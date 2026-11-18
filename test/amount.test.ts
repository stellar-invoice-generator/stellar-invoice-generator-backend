import { describe, it, expect } from 'vitest';
import {
  toDecimal,
  formatStellarAmount,
  isValidStellarAmount,
  toStroops,
  fromStroops,
  isEqualAmount,
  isLessThan,
  isGreaterThan,
  isLessThanOrEqual,
  isGreaterThanOrEqual,
  isZeroAmount,
  addAmounts,
  subtractAmounts,
  calculateRemainingBalance,
  STELLAR_DECIMAL_PLACES,
  Decimal,
} from '../src/utils/amount.util.js';

describe('Step 07: Safe Decimal Instantiation (toDecimal)', () => {
  it('should instantiate Decimal from valid string representations', () => {
    const d1 = toDecimal('10.5000000');
    expect(d1).toBeInstanceOf(Decimal);
    expect(d1.toString()).toBe('10.5');

    const d2 = toDecimal('100');
    expect(d2.toString()).toBe('100');
  });

  it('should support BigInt inputs without precision loss', () => {
    const d = toDecimal(10000000n);
    expect(d.toString()).toBe('10000000');
  });

  it('should return existing Decimal instance without re-instantiation', () => {
    const orig = new Decimal('42.75');
    const d = toDecimal(orig);
    expect(d).toBe(orig);
  });

  it('should safely convert standard numbers via string conversion', () => {
    const d = toDecimal(25.5);
    expect(d.toString()).toBe('25.5');
  });

  it('should reject invalid, null, undefined, and non-numeric inputs', () => {
    // @ts-expect-error testing null
    expect(() => toDecimal(null)).toThrow(/Cannot convert empty or null value/);
    // @ts-expect-error testing undefined
    expect(() => toDecimal(undefined)).toThrow(/Cannot convert empty or null value/);
    expect(() => toDecimal('')).toThrow(/Cannot convert empty or null value/);
    expect(() => toDecimal('   ')).toThrow(/Cannot parse invalid numeric string/);
    expect(() => toDecimal('abc')).toThrow(/Cannot parse invalid numeric string/);
    expect(() => toDecimal(NaN)).toThrow(/Cannot convert non-finite number/);
    expect(() => toDecimal(Infinity)).toThrow(/Cannot convert non-finite number/);
  });
});

describe('Step 08: Stellar 7-Decimal String Formatting (formatStellarAmount)', () => {
  it('should format amounts strictly to 7 decimal places', () => {
    expect(formatStellarAmount('1')).toBe('1.0000000');
    expect(formatStellarAmount('10.5')).toBe('10.5000000');
    expect(formatStellarAmount('0.1234567')).toBe('0.1234567');
    expect(formatStellarAmount(new Decimal('100'))).toBe('100.0000000');
  });

  it('should accurately handle minimum stroop precision (0.0000001)', () => {
    expect(formatStellarAmount('0.0000001')).toBe('0.0000001');
    expect(STELLAR_DECIMAL_PLACES).toBe(7);
  });

  it('should optionally trim trailing zeros when requested', () => {
    expect(formatStellarAmount('10.5000000', { trimTrailingZeros: true })).toBe('10.5');
    expect(formatStellarAmount('1.0000000', { trimTrailingZeros: true })).toBe('1');
    expect(formatStellarAmount('0.0000000', { trimTrailingZeros: true })).toBe('0');
    expect(formatStellarAmount('0.1234567', { trimTrailingZeros: true })).toBe('0.1234567');
  });

  it('should validate candidate Stellar amount strings via isValidStellarAmount', () => {
    expect(isValidStellarAmount('10')).toBe(true);
    expect(isValidStellarAmount('10.5')).toBe(true);
    expect(isValidStellarAmount('0.0000001')).toBe(true);
    expect(isValidStellarAmount('100.1234567')).toBe(true);

    // Rejects more than 7 decimal places
    expect(isValidStellarAmount('10.12345678')).toBe(false);
    // Rejects negatives
    expect(isValidStellarAmount('-5')).toBe(false);
    // Rejects zero
    expect(isValidStellarAmount('0')).toBe(false);
    expect(isValidStellarAmount('0.0000000')).toBe(false);
    // Rejects non-numbers
    expect(isValidStellarAmount('abc')).toBe(false);
    expect(isValidStellarAmount('')).toBe(false);
  });

  it('should correctly convert to and from stroops (1 unit = 10,000,000 stroops)', () => {
    expect(toStroops('1')).toBe(10000000n);
    expect(toStroops('0.0000001')).toBe(1n);
    expect(toStroops('2.5')).toBe(25000000n);

    const fromStroop = fromStroops(10000000n);
    expect(fromStroop.toString()).toBe('1');

    const fromOneStroop = fromStroops(1n);
    expect(fromOneStroop.toFixed(7)).toBe('0.0000001');
  });
});

describe('Step 09: Decimal Comparison & Arithmetic Helpers', () => {
  it('should accurately compare equality regardless of representation', () => {
    expect(isEqualAmount('10.5', '10.5000000')).toBe(true);
    expect(isEqualAmount('100', 100)).toBe(true);
    expect(isEqualAmount(new Decimal('5'), '5.0000000')).toBe(true);
    expect(isEqualAmount('10.0000001', '10.0000000')).toBe(false);
  });

  it('should accurately evaluate lessThan and greaterThan', () => {
    expect(isLessThan('9.9999999', '10.0000000')).toBe(true);
    expect(isLessThan('10.0000000', '9.9999999')).toBe(false);
    expect(isGreaterThan('10.0000001', '10.0000000')).toBe(true);
    expect(isGreaterThan('10.0000000', '10.0000001')).toBe(false);
  });

  it('should accurately evaluate boundary comparisons (<=, >=)', () => {
    expect(isLessThanOrEqual('10.0000000', '10.0000000')).toBe(true);
    expect(isLessThanOrEqual('9.9999999', '10.0000000')).toBe(true);
    expect(isLessThanOrEqual('10.0000001', '10.0000000')).toBe(false);

    expect(isGreaterThanOrEqual('10.0000000', '10.0000000')).toBe(true);
    expect(isGreaterThanOrEqual('10.0000001', '10.0000000')).toBe(true);
    expect(isGreaterThanOrEqual('9.9999999', '10.0000000')).toBe(false);
  });

  it('should evaluate isZeroAmount correctly', () => {
    expect(isZeroAmount('0')).toBe(true);
    expect(isZeroAmount('0.0000000')).toBe(true);
    expect(isZeroAmount(0)).toBe(true);
    expect(isZeroAmount('0.0000001')).toBe(false);
  });

  it('should calculate remaining balance with optional clamping', () => {
    const bal1 = calculateRemainingBalance('100.0000000', '40.0000000');
    expect(bal1.toString()).toBe('60');

    const bal2 = calculateRemainingBalance('100.0000000', '100.0000000');
    expect(bal2.toString()).toBe('0');

    const overpaid = calculateRemainingBalance('100.0000000', '120.0000000');
    expect(overpaid.toString()).toBe('-20');

    const clamped = calculateRemainingBalance('100.0000000', '120.0000000', { clampZero: true });
    expect(clamped.toString()).toBe('0');
  });
});

describe('Step 10: Zero Floating-Point Drift & Accounting Precision', () => {
  it('should avoid the classic IEEE 754 float precision addition trap (0.1 + 0.2 === 0.3)', () => {
    // In native JavaScript numbers: 0.1 + 0.2 === 0.30000000000000004
    expect(0.1 + 0.2 === 0.3).toBe(false);

    // Using StellarInvoice high-precision arithmetic: strictly 0.3000000
    const sum = addAmounts('0.1', '0.2');
    expect(isEqualAmount(sum, '0.3')).toBe(true);
    expect(formatStellarAmount(sum)).toBe('0.3000000');
  });

  it('should handle fractional stroop subtraction without drift (1.0000000 - 0.0000001)', () => {
    const diff = subtractAmounts('1.0000000', '0.0000001');
    expect(formatStellarAmount(diff)).toBe('0.9999999');
    expect(isEqualAmount(diff, '0.9999999')).toBe(true);
  });

  it('should accurately accumulate multiple partial installment payments', () => {
    let accumulated = toDecimal('0');
    accumulated = addAmounts(accumulated, '0.1000000');
    accumulated = addAmounts(accumulated, '0.2000000');
    accumulated = addAmounts(accumulated, '0.3000000');
    accumulated = addAmounts(accumulated, '0.4000000');

    expect(isEqualAmount(accumulated, '1.0000000')).toBe(true);
    expect(formatStellarAmount(accumulated)).toBe('1.0000000');
  });

  it('should detect underpayments down to a single stroop (0.0000001)', () => {
    const invoiceTotal = '50.0000000';
    const underpaymentByOneStroop = '49.9999999';

    expect(isLessThan(underpaymentByOneStroop, invoiceTotal)).toBe(true);
    expect(isEqualAmount(underpaymentByOneStroop, invoiceTotal)).toBe(false);

    const remaining = calculateRemainingBalance(invoiceTotal, underpaymentByOneStroop);
    expect(formatStellarAmount(remaining)).toBe('0.0000001');
  });

  it('should detect overpayments down to a single stroop (0.0000001)', () => {
    const invoiceTotal = '50.0000000';
    const overpaymentByOneStroop = '50.0000001';

    expect(isGreaterThan(overpaymentByOneStroop, invoiceTotal)).toBe(true);
    expect(isEqualAmount(overpaymentByOneStroop, invoiceTotal)).toBe(false);

    const surplus = subtractAmounts(overpaymentByOneStroop, invoiceTotal);
    expect(formatStellarAmount(surplus)).toBe('0.0000001');
  });
});
