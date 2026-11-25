import { describe, it, expect } from 'vitest';
import { Keypair, StrKey } from '@stellar/stellar-sdk';
import {
  isValidStellarAddress,
  isSecretSeed,
  assertValidStellarAddress,
} from '../src/utils/stellarAddress.util.js';
import { StellarAddressSchema } from '../src/schemas/index.js';

describe('Step 23: StrKey Public Key Validation (isValidStellarAddress)', () => {
  const knownTestnetUsdcIssuer = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

  it('should validate standard 56-character Stellar public addresses starting with G', () => {
    expect(isValidStellarAddress(knownTestnetUsdcIssuer)).toBe(true);

    // Test with 10 dynamically generated valid Stellar ed25519 keypairs
    for (let i = 0; i < 10; i++) {
      const pair = Keypair.random();
      const pubKey = pair.publicKey();
      expect(pubKey.startsWith('G')).toBe(true);
      expect(pubKey.length).toBe(56);
      expect(isValidStellarAddress(pubKey)).toBe(true);
    }
  });

  it('should reject non-string inputs cleanly without throwing exceptions', () => {
    expect(isValidStellarAddress(null)).toBe(false);
    expect(isValidStellarAddress(undefined)).toBe(false);
    expect(isValidStellarAddress(12345)).toBe(false);
    expect(isValidStellarAddress({})).toBe(false);
    expect(isValidStellarAddress([])).toBe(false);
    expect(isValidStellarAddress(true)).toBe(false);
  });

  it('should reject addresses with incorrect length', () => {
    expect(isValidStellarAddress('')).toBe(false);
    expect(isValidStellarAddress('GABC')).toBe(false);
    // 55 characters (1 short)
    expect(isValidStellarAddress(knownTestnetUsdcIssuer.slice(0, 55))).toBe(false);
    // 57 characters (1 long)
    expect(isValidStellarAddress(knownTestnetUsdcIssuer + 'A')).toBe(false);
  });

  it('should reject addresses with invalid StrKey CRC16 checksums', () => {
    // Modify the final checksum character of a valid address
    const lastChar = knownTestnetUsdcIssuer.slice(-1);
    const corruptedLastChar = lastChar === '5' ? '6' : '5';
    const corruptedChecksumAddress = knownTestnetUsdcIssuer.slice(0, -1) + corruptedLastChar;

    expect(isValidStellarAddress(corruptedChecksumAddress)).toBe(false);
  });

  it('should reject addresses containing non-Base32 characters or lowercase letters', () => {
    // Base32 strictly excludes 0, 1, 8, 9
    const addressWith0 = 'G' + '0'.repeat(55);
    const addressWith8 = 'G' + '8'.repeat(55);
    const addressWithLowercase = knownTestnetUsdcIssuer.toLowerCase();

    expect(isValidStellarAddress(addressWith0)).toBe(false);
    expect(isValidStellarAddress(addressWith8)).toBe(false);
    expect(isValidStellarAddress(addressWithLowercase)).toBe(false);
  });
});

describe('Step 24: Secret Seed Rejection & Non-Custodial Safety', () => {
  it('should strictly reject ed25519 secret seeds (starting with S)', () => {
    for (let i = 0; i < 10; i++) {
      const pair = Keypair.random();
      const secret = pair.secret();

      expect(secret.startsWith('S')).toBe(true);
      expect(secret.length).toBe(56);

      // Must be rejected by isValidStellarAddress
      expect(isValidStellarAddress(secret)).toBe(false);

      // Must be identified as a secret seed
      expect(isSecretSeed(secret)).toBe(true);
    }
  });

  it('should verify isSecretSeed returns false for public keys and invalid strings', () => {
    const pair = Keypair.random();
    expect(isSecretSeed(pair.publicKey())).toBe(false);
    expect(isSecretSeed('not-a-seed')).toBe(false);
    expect(isSecretSeed(null)).toBe(false);
    expect(isSecretSeed(undefined)).toBe(false);
  });

  it('should strictly reject muxed accounts (M...) and smart contracts (C...)', () => {
    // Generate a contract ID string if supported
    const fakeContractAddress = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const fakeMuxedAddress = 'MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

    expect(isValidStellarAddress(fakeContractAddress)).toBe(false);
    expect(isValidStellarAddress(fakeMuxedAddress)).toBe(false);
  });

  it('should assert valid Stellar addresses without throwing for valid public keys', () => {
    const pair = Keypair.random();
    expect(() => assertValidStellarAddress(pair.publicKey())).not.toThrow();
  });

  it('should throw an explicit Security violation when assertValidStellarAddress receives a secret seed', () => {
    const pair = Keypair.random();
    const secret = pair.secret();

    expect(() => assertValidStellarAddress(secret, 'Merchant wallet')).toThrow(
      /Security violation: Merchant wallet appears to be a private secret key/,
    );
  });

  it('should throw an invalid address error when assertValidStellarAddress receives malformed strings', () => {
    expect(() => assertValidStellarAddress('invalid-string', 'Recipient')).toThrow(
      /Invalid Recipient: must be a valid 56-character Stellar public key/,
    );
  });

  it('should enforce checksum and public key constraints via StellarAddressSchema in Zod', () => {
    const pair = Keypair.random();
    // Valid public key passes
    expect(StellarAddressSchema.parse(pair.publicKey())).toBe(pair.publicKey());

    // Secret seed rejected
    expect(() => StellarAddressSchema.parse(pair.secret())).toThrow(
      /Invalid Stellar public address format/,
    );

    // Corrupted checksum with valid format regex rejected by refine
    const validKey = pair.publicKey();
    const lastChar = validKey.slice(-1);
    const corruptedKey = validKey.slice(0, -1) + (lastChar === 'A' ? 'B' : 'A');
    expect(() => StellarAddressSchema.parse(corruptedKey)).toThrow(
      /Invalid Stellar public address checksum/,
    );
  });
});
