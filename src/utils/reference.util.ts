/**
 * @file src/utils/reference.util.ts
 * @summary Cryptographically random short reference generator for Stellar transaction memos.
 * 
 * Purpose:
 *   - [Step 11] Generates collision-resistant, human-readable invoice reference codes (e.g. "INV-8F3K2A").
 *   - [Step 12] Strictly enforces Stellar network MEMO_TEXT protocol limit of 28 bytes UTF-8.
 *   - Excludes ambiguous characters (0, O, 1, I, L) to eliminate user payment entry errors.
 * 
 * Inputs:
 *   - Optional configuration: custom prefix (default: "INV-"), random character length (default: 6).
 * 
 * Outputs:
 *   - Cryptographically random reference string guaranteed to be <= 28 bytes UTF-8.
 * 
 * Interacting Modules:
 *   - Used by modules/invoices/invoices.service.ts for invoice generation and SEP-7 payment links.
 *   - Tested by test/reference.test.ts.
 */

import crypto from 'crypto';

/**
 * Stellar consensus protocol maximum text memo size in bytes (RFC / SEP standard).
 * Transactions with text memos exceeding 28 bytes fail on-chain with MEMO_TOO_LONG.
 */
export const STELLAR_MAX_MEMO_BYTES = 28;

/**
 * 32-character unambiguous alphanumeric alphabet.
 * Excludes visually confusing characters: '0', 'O', '1', 'I', 'L'.
 * Provides exactly 5 bits of entropy per character (32 = 2^5).
 */
export const UNAMBIGUOUS_CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export interface ReferenceOptions {
  /** Prefix for the reference (default: 'INV-') */
  prefix?: string;
  /** Number of random characters to append (default: 6) */
  randomLength?: number;
}

/**
 * Returns the UTF-8 byte length of a string.
 */
export function getByteLength(str: string): number {
  return Buffer.byteLength(str, 'utf8');
}

/**
 * Step 11: Cryptographically Secure Reference Generator
 * Generates an unguessable invoice reference code formatted as `<PREFIX><RANDOM_CHARS>`.
 * 
 * @param options - Configuration options for prefix and random string length
 * @returns Formatted reference string (e.g. "INV-8F3K2A")
 * @throws {Error} if the combined length exceeds Stellar's 28-byte limit
 */
export function generateInvoiceReference(options?: ReferenceOptions): string {
  const prefix = options?.prefix ?? 'INV-';
  const randomLength = options?.randomLength ?? 6;

  if (randomLength <= 0) {
    throw new Error('randomLength must be a positive integer');
  }

  // Calculate random characters using cryptographic entropy
  const randomBytes = crypto.randomBytes(randomLength);
  const chars: string[] = [];
  const charsetLength = UNAMBIGUOUS_CHARSET.length;

  for (let i = 0; i < randomLength; i++) {
    // Modulo 32 maps uniformly over the 256-value byte space (256 is an exact multiple of 32)
    const charIndex = randomBytes[i] % charsetLength;
    chars.push(UNAMBIGUOUS_CHARSET[charIndex]);
  }

  const reference = `${prefix}${chars.join('')}`;
  const byteLength = getByteLength(reference);

  // Step 12: Enforce Stellar 28-byte text memo limit
  if (byteLength > STELLAR_MAX_MEMO_BYTES) {
    throw new Error(
      `Generated reference "${reference}" exceeds Stellar's 28-byte memo limit (${byteLength} bytes).`,
    );
  }

  return reference;
}

/**
 * Validates whether a candidate string is a valid invoice reference format
 * conforming to the unambiguous character set and Stellar's 28-byte memo limit.
 */
export function isValidInvoiceReference(ref: string, prefix = 'INV-'): boolean {
  if (typeof ref !== 'string' || !ref.trim()) {
    return false;
  }

  const trimmed = ref.trim();

  // Check Stellar 28-byte limit
  if (getByteLength(trimmed) > STELLAR_MAX_MEMO_BYTES) {
    return false;
  }

  // Must start with prefix
  if (!trimmed.startsWith(prefix)) {
    return false;
  }

  const randomPart = trimmed.slice(prefix.length);
  if (randomPart.length < 4) {
    return false;
  }

  // Check that all characters in the random part belong to UNAMBIGUOUS_CHARSET
  for (const char of randomPart) {
    if (!UNAMBIGUOUS_CHARSET.includes(char)) {
      return false;
    }
  }

  return true;
}
