import { describe, it, expect } from 'vitest';
import { Keypair, StrKey, Networks } from '@stellar/stellar-sdk';
import {
  isValidStellarAddress,
  isSecretSeed,
  assertValidStellarAddress,
} from '../src/utils/stellarAddress.util.js';
import { StellarAddressSchema } from '../src/schemas/index.js';
import {
  getNetworkPassphrase,
  TESTNET_USDC_ISSUER,
  PUBLIC_USDC_ISSUER,
  OFFICIAL_USDC_ISSUERS,
  getOfficialUsdcIssuer,
  isOfficialUsdcIssuer,
  stellarConfig,
} from '../src/config/stellar.js';

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

describe('Step 25: Stellar Network Passphrase Resolver', () => {
  it('should return official TESTNET passphrase for "TESTNET" (case-insensitive)', () => {
    expect(getNetworkPassphrase('TESTNET')).toBe(Networks.TESTNET);
    expect(getNetworkPassphrase('testnet')).toBe(Networks.TESTNET);
    expect(getNetworkPassphrase('Testnet')).toBe(Networks.TESTNET);
    expect(getNetworkPassphrase('TESTNET')).toBe('Test SDF Network ; September 2015');
  });

  it('should return official PUBLIC passphrase for "PUBLIC" (case-insensitive)', () => {
    expect(getNetworkPassphrase('PUBLIC')).toBe(Networks.PUBLIC);
    expect(getNetworkPassphrase('public')).toBe(Networks.PUBLIC);
    expect(getNetworkPassphrase('Public')).toBe(Networks.PUBLIC);
    expect(getNetworkPassphrase('PUBLIC')).toBe('Public Global Stellar Network ; September 2015');
  });

  it('should default to envConfig.STELLAR_NETWORK when called without arguments', () => {
    const defaultPassphrase = getNetworkPassphrase();
    expect(defaultPassphrase).toBe(Networks.TESTNET);
  });

  it('should throw descriptive error when passed an unsupported network', () => {
    expect(() => getNetworkPassphrase('REGTEST')).toThrow(
      /Unsupported Stellar network: "REGTEST"/,
    );
    expect(() => getNetworkPassphrase('MAINNET')).toThrow(
      /Unsupported Stellar network: "MAINNET"/,
    );
  });
});

describe('Step 26: Official USDC Issuer & Asset Verification Registry', () => {
  it('should register valid official USDC issuers for TESTNET and PUBLIC', () => {
    expect(TESTNET_USDC_ISSUER).toBe('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5');
    expect(PUBLIC_USDC_ISSUER).toBe('GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');

    expect(isValidStellarAddress(TESTNET_USDC_ISSUER)).toBe(true);
    expect(isValidStellarAddress(PUBLIC_USDC_ISSUER)).toBe(true);

    expect(OFFICIAL_USDC_ISSUERS.TESTNET).toBe(TESTNET_USDC_ISSUER);
    expect(OFFICIAL_USDC_ISSUERS.PUBLIC).toBe(PUBLIC_USDC_ISSUER);
  });

  it('should resolve official USDC issuer via getOfficialUsdcIssuer', () => {
    expect(getOfficialUsdcIssuer('TESTNET')).toBe(TESTNET_USDC_ISSUER);
    expect(getOfficialUsdcIssuer('PUBLIC')).toBe(PUBLIC_USDC_ISSUER);
    expect(getOfficialUsdcIssuer()).toBe(TESTNET_USDC_ISSUER);

    expect(() => getOfficialUsdcIssuer('UNKNOWN')).toThrow(
      /Unsupported Stellar network: "UNKNOWN"/,
    );
  });

  it('should verify official USDC issuer and prevent spoofed token assets', () => {
    // Valid official Circle USDC on Testnet
    expect(isOfficialUsdcIssuer('USDC', TESTNET_USDC_ISSUER, 'TESTNET')).toBe(true);

    // Valid official Circle USDC on Public
    expect(isOfficialUsdcIssuer('USDC', PUBLIC_USDC_ISSUER, 'PUBLIC')).toBe(true);

    // Cross-network mismatch rejected
    expect(isOfficialUsdcIssuer('USDC', TESTNET_USDC_ISSUER, 'PUBLIC')).toBe(false);

    // Spoofed issuer address with USDC symbol rejected
    const spoofedIssuer = Keypair.random().publicKey();
    expect(isOfficialUsdcIssuer('USDC', spoofedIssuer, 'TESTNET')).toBe(false);

    // Native XLM or other codes rejected
    expect(isOfficialUsdcIssuer('XLM', null, 'TESTNET')).toBe(false);
    expect(isOfficialUsdcIssuer('EURC', TESTNET_USDC_ISSUER, 'TESTNET')).toBe(false);
  });

  it('should provide dynamic getters on stellarConfig singleton matching active environment', () => {
    expect(stellarConfig.network).toBe('TESTNET');
    expect(stellarConfig.networkPassphrase).toBe(Networks.TESTNET);
    expect(stellarConfig.horizonUrl).toBe('https://horizon-testnet.stellar.org');
    expect(stellarConfig.chainReaderDriver).toBe('horizon');
    expect(isValidStellarAddress(stellarConfig.platformWalletAddress)).toBe(true);
    expect(stellarConfig.verifiedIssuers.USDC).toBe(TESTNET_USDC_ISSUER);
  });
});
