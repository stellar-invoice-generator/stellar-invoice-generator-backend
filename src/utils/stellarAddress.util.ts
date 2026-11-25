/**
 * @file src/utils/stellarAddress.util.ts
 * @summary Validation and checksum utility for Stellar StrKey public addresses.
 * 
 * Purpose:
 *   [Step 23] Validates that a candidate string is a valid Stellar account public key
 *   (56-character ed25519 public key starting with 'G') with verified StrKey version byte
 *   and CRC16 checksum using @stellar/stellar-sdk StrKey.
 *   [Step 24] Guarantees non-custodial safety: strictly rejects secret seeds (starting with 'S'),
 *   muxed accounts ('M'), contract IDs ('C'), signed payloads ('P'), and corrupted checksums.
 * 
 * Inputs:
 *   - Candidate address string or unknown input.
 * 
 * Outputs:
 *   - isValidStellarAddress(address): boolean
 *   - isSecretSeed(key): boolean
 *   - assertValidStellarAddress(address, fieldName?): asserts valid public key, throws if invalid or secret
 * 
 * Interacting Modules:
 *   - Used in merchant wallet registration and Zod schemas (src/schemas/index.ts).
 *   - Used in chain listener payment event extraction to validate sender addresses.
 */

import { StrKey } from '@stellar/stellar-sdk';

/**
 * Validates that an address is a valid standard Stellar ed25519 public key (G... 56 chars).
 * Strictly rejects secret seeds (S...), muxed accounts (M...), contracts (C...),
 * corrupted checksums, and non-string inputs.
 * 
 * @param address Candidate address to validate
 * @returns boolean true if valid 56-char ed25519 public key starting with G
 */
export function isValidStellarAddress(address: unknown): address is string {
  if (typeof address !== 'string') {
    return false;
  }

  // Must be non-empty, exactly 56 chars, and start with 'G' (ed25519 public key prefix)
  if (address.length !== 56 || !address.startsWith('G')) {
    return false;
  }

  try {
    return StrKey.isValidEd25519PublicKey(address);
  } catch {
    return false;
  }
}

/**
 * Checks whether a candidate string is a valid Stellar secret seed (S... 56 chars).
 * Used to detect accidental private key submission and enforce non-custodial safety.
 * 
 * @param key Candidate string to check
 * @returns boolean true if valid secret seed
 */
export function isSecretSeed(key: unknown): boolean {
  if (typeof key !== 'string') {
    return false;
  }

  if (key.length !== 56 || !key.startsWith('S')) {
    return false;
  }

  try {
    return StrKey.isValidEd25519SecretSeed(key);
  } catch {
    return false;
  }
}

/**
 * Asserts that the given value is a valid Stellar public address (G...).
 * Throws a descriptive Error if invalid. Explicitly detects and rejects secret seeds (S...)
 * to safeguard users and maintain a strictly non-custodial architecture.
 * 
 * @param address Candidate address
 * @param fieldName Optional label for the error message
 */
export function assertValidStellarAddress(
  address: unknown,
  fieldName = 'Stellar address',
): asserts address is string {
  if (typeof address === 'string' && (address.startsWith('S') || isSecretSeed(address))) {
    throw new Error(
      `Security violation: ${fieldName} appears to be a private secret key (starts with 'S'). StellarInvoice is strictly non-custodial and never accepts or stores private keys.`,
    );
  }

  if (!isValidStellarAddress(address)) {
    throw new Error(
      `Invalid ${fieldName}: must be a valid 56-character Stellar public key starting with 'G' and with a valid StrKey checksum.`,
    );
  }
}
