import { describe, it, expect } from 'vitest';
import {
  generateInvoiceReference,
  isValidInvoiceReference,
  getByteLength,
  STELLAR_MAX_MEMO_BYTES,
  UNAMBIGUOUS_CHARSET,
} from '../src/utils/reference.util.js';

describe('Step 11: Collision-Resistant Reference Generator', () => {
  it('should generate references with default INV- prefix and 10-character length', () => {
    const ref = generateInvoiceReference();
    expect(ref.startsWith('INV-')).toBe(true);
    expect(ref.length).toBe(10); // 'INV-' (4) + 6 random chars = 10
    expect(getByteLength(ref)).toBe(10);
  });

  it('should support custom prefixes and custom random lengths', () => {
    const ref = generateInvoiceReference({ prefix: 'PAY-', randomLength: 8 });
    expect(ref.startsWith('PAY-')).toBe(true);
    expect(ref.length).toBe(12); // 'PAY-' (4) + 8 = 12
    expect(getByteLength(ref)).toBe(12);
  });

  it('should reject invalid non-positive randomLength', () => {
    expect(() => generateInvoiceReference({ randomLength: 0 })).toThrow(
      /randomLength must be a positive integer/,
    );
    expect(() => generateInvoiceReference({ randomLength: -5 })).toThrow(
      /randomLength must be a positive integer/,
    );
  });

  it('should exclude ambiguous characters (0, O, 1, I, L)', () => {
    const ambiguousChars = ['0', 'O', '1', 'I', 'L'];

    // Verify charset itself excludes them
    for (const char of ambiguousChars) {
      expect(UNAMBIGUOUS_CHARSET).not.toContain(char);
    }

    // Generate 500 references and ensure none contain ambiguous characters
    for (let i = 0; i < 500; i++) {
      const ref = generateInvoiceReference();
      const randomPart = ref.slice(4);
      for (const char of ambiguousChars) {
        expect(randomPart).not.toContain(char);
      }
    }
  });

  it('should demonstrate high entropy with near-zero collisions across 10,000 generated references', () => {
    const total = 10000;
    const generated = new Set<string>();

    for (let i = 0; i < total; i++) {
      generated.add(generateInvoiceReference({ randomLength: 6 }));
    }

    // In a 31^6 (~8.87e8) keyspace, 10,000 samples has a ~5.5% statistical birthday collision chance.
    // Verify high entropy with >= 99.98% uniqueness (at most 2 collisions across 10,000 samples).
    expect(generated.size).toBeGreaterThanOrEqual(total - 2);
  });
});

describe('Step 12: Stellar 28-Byte Text Memo Protocol Enforcement', () => {
  it('should verify STELLAR_MAX_MEMO_BYTES is strictly 28', () => {
    expect(STELLAR_MAX_MEMO_BYTES).toBe(28);
  });

  it('should strictly enforce that reference byte length is <= 28 bytes UTF-8', () => {
    // Standard reference is well within limit
    const ref = generateInvoiceReference();
    expect(getByteLength(ref)).toBeLessThanOrEqual(STELLAR_MAX_MEMO_BYTES);

    // Maximum allowable configuration: 4 prefix + 24 chars = 28 bytes
    const maxRef = generateInvoiceReference({ prefix: 'INV-', randomLength: 24 });
    expect(getByteLength(maxRef)).toBe(28);

    // Exceeding 28 bytes must throw an error
    expect(() =>
      generateInvoiceReference({ prefix: 'INV-', randomLength: 25 }),
    ).toThrow(/exceeds Stellar's 28-byte memo limit/);

    expect(() =>
      generateInvoiceReference({ prefix: 'VERY_LONG_CUSTOM_PREFIX_NAME-', randomLength: 6 }),
    ).toThrow(/exceeds Stellar's 28-byte memo limit/);
  });

  it('should validate reference format with isValidInvoiceReference', () => {
    const validRef = generateInvoiceReference();
    expect(isValidInvoiceReference(validRef)).toBe(true);

    // Valid with custom prefix
    const customRef = generateInvoiceReference({ prefix: 'BILL-' });
    expect(isValidInvoiceReference(customRef, 'BILL-')).toBe(true);

    // Rejects ambiguous characters
    expect(isValidInvoiceReference('INV-8F3K0A')).toBe(false); // contains 0
    expect(isValidInvoiceReference('INV-8F3KOA')).toBe(false); // contains O
    expect(isValidInvoiceReference('INV-8F3K1A')).toBe(false); // contains 1
    expect(isValidInvoiceReference('INV-8F3KIA')).toBe(false); // contains I

    // Rejects wrong prefix
    expect(isValidInvoiceReference('ORDER-8F3K2A', 'INV-')).toBe(false);

    // Rejects strings exceeding 28 bytes
    const over28 = 'INV-12345678901234567890123456'; // 30 bytes
    expect(isValidInvoiceReference(over28)).toBe(false);

    // Rejects non-string and empty inputs
    expect(isValidInvoiceReference('')).toBe(false);
    // @ts-expect-error testing null input
    expect(isValidInvoiceReference(null)).toBe(false);
    // @ts-expect-error testing undefined input
    expect(isValidInvoiceReference(undefined)).toBe(false);
  });
});
