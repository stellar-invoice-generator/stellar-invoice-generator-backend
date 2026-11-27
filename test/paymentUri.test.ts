import { describe, it, expect } from 'vitest';
import {
  buildNativePaymentUri,
  buildAssetPaymentUri,
  buildUsdcPaymentUri,
  buildPaymentUri,
  parsePaymentUri,
  SEP7_PAY_PREFIX,
} from '../src/stellar/paymentUri/paymentUri.service.js';
import {
  TESTNET_USDC_ISSUER,
  PUBLIC_USDC_ISSUER,
} from '../src/config/stellar.js';

describe('Step 28: SEP-7 Payment URI Builder for Native XLM', () => {
  const validDestination = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
  const testMemo = 'INV-8F3K2A';

  it('should build a valid SEP-7 payment URI for native XLM with memo', () => {
    const uri = buildNativePaymentUri({
      destination: validDestination,
      amount: '50',
      memo: testMemo,
    });

    expect(uri.startsWith(`${SEP7_PAY_PREFIX}?`)).toBe(true);
    expect(uri).toContain(`destination=${validDestination}`);
    expect(uri).toContain('amount=50.0000000');
    expect(uri).toContain(`memo=${testMemo}`);
    expect(uri).toContain('memo_type=MEMO_TEXT');

    // For native XLM, asset_code and asset_issuer must NOT be present
    expect(uri).not.toContain('asset_code');
    expect(uri).not.toContain('asset_issuer');
  });

  it('should correctly format decimal amounts with 7 decimal places', () => {
    const uri = buildNativePaymentUri({
      destination: validDestination,
      amount: '12.345',
    });

    const parsed = parsePaymentUri(uri);
    expect(parsed.amount).toBe('12.3450000');
  });

  it('should support optional msg parameter truncated to 300 characters', () => {
    const msg = 'Invoice #1024 for Web Design Services';
    const uri = buildNativePaymentUri({
      destination: validDestination,
      amount: '100',
      memo: testMemo,
      msg,
    });

    expect(uri).toContain(`msg=${encodeURIComponent(msg)}`);
    const parsed = parsePaymentUri(uri);
    expect(parsed.msg).toBe(msg);
  });

  it('should support optional network_passphrase parameter', () => {
    const passphrase = 'Test SDF Network ; September 2015';
    const uri = buildNativePaymentUri({
      destination: validDestination,
      amount: '10',
      networkPassphrase: passphrase,
    });

    expect(uri).toContain(`network_passphrase=${encodeURIComponent(passphrase)}`);
    const parsed = parsePaymentUri(uri);
    expect(parsed.networkPassphrase).toBe(passphrase);
  });

  it('should parse generated SEP-7 payment URIs accurately', () => {
    const original = {
      destination: validDestination,
      amount: '99.9900000',
      memo: 'INV-TEST01',
      msg: 'Test payment',
    };

    const uri = buildNativePaymentUri(original);
    const parsed = parsePaymentUri(uri);

    expect(parsed.operation).toBe('pay');
    expect(parsed.destination).toBe(original.destination);
    expect(parsed.amount).toBe(original.amount);
    expect(parsed.assetCode).toBe('XLM');
    expect(parsed.assetIssuer).toBeNull();
    expect(parsed.memo).toBe(original.memo);
    expect(parsed.memoType).toBe('MEMO_TEXT');
    expect(parsed.msg).toBe(original.msg);
  });

  it('should reject invalid destination address and secret seeds', () => {
    // Secret seed rejected with security violation
    expect(() =>
      buildNativePaymentUri({
        destination: 'SBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        amount: '10',
      }),
    ).toThrow(/Security violation.*private secret key/);

    // Corrupted public key rejected
    expect(() =>
      buildNativePaymentUri({
        destination: 'GNOTAVALIDSTELLARADDRESS',
        amount: '10',
      }),
    ).toThrow(/Invalid Payment destination/);
  });

  it('should reject non-positive amounts (0 or negative)', () => {
    expect(() =>
      buildNativePaymentUri({
        destination: validDestination,
        amount: '0',
      }),
    ).toThrow(/Amount must be strictly greater than 0/);

    expect(() =>
      buildNativePaymentUri({
        destination: validDestination,
        amount: '-5.0000000',
      }),
    ).toThrow(/Amount must be strictly greater than 0/);
  });

  it('should reject memo exceeding Stellar 28-byte text limit', () => {
    // 29-character ASCII string (29 bytes)
    const longMemo = 'A'.repeat(29);
    expect(() =>
      buildNativePaymentUri({
        destination: validDestination,
        amount: '10',
        memo: longMemo,
      }),
    ).toThrow(/exceeds Stellar 28-byte text memo limit/);
  });
});

describe('Step 29: SEP-7 URI Builder for Non-Native Assets (USDC & Tokens)', () => {
  const validDestination = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
  const testMemo = 'INV-USDC01';

  it('should build a valid SEP-7 payment URI with asset_code and asset_issuer for USDC', () => {
    const uri = buildAssetPaymentUri({
      destination: validDestination,
      amount: '25.5000000',
      assetCode: 'USDC',
      assetIssuer: TESTNET_USDC_ISSUER,
      memo: testMemo,
    });

    expect(uri.startsWith(`${SEP7_PAY_PREFIX}?`)).toBe(true);
    expect(uri).toContain(`destination=${validDestination}`);
    expect(uri).toContain('amount=25.5000000');
    expect(uri).toContain('asset_code=USDC');
    expect(uri).toContain(`asset_issuer=${TESTNET_USDC_ISSUER}`);
    expect(uri).toContain(`memo=${testMemo}`);
    expect(uri).toContain('memo_type=MEMO_TEXT');
  });

  it('should build official USDC payment URI via buildUsdcPaymentUri helper', () => {
    // Testnet USDC
    const testnetUri = buildUsdcPaymentUri({
      destination: validDestination,
      amount: '100',
      memo: 'INV-TESTNET',
      network: 'TESTNET',
    });
    expect(testnetUri).toContain('asset_code=USDC');
    expect(testnetUri).toContain(`asset_issuer=${TESTNET_USDC_ISSUER}`);

    // Public USDC
    const publicUri = buildUsdcPaymentUri({
      destination: validDestination,
      amount: '100',
      memo: 'INV-PUBLIC',
      network: 'PUBLIC',
    });
    expect(publicUri).toContain('asset_code=USDC');
    expect(publicUri).toContain(`asset_issuer=${PUBLIC_USDC_ISSUER}`);
  });

  it('should reject non-native asset missing asset_issuer', () => {
    expect(() =>
      buildPaymentUri({
        destination: validDestination,
        amount: '10',
        assetCode: 'USDC',
        assetIssuer: null,
      }),
    ).toThrow(/Missing required asset issuer for non-native Stellar asset/);
  });

  it('should reject invalid asset codes (empty, too long, or invalid characters)', () => {
    // Empty asset code
    expect(() =>
      buildAssetPaymentUri({
        destination: validDestination,
        amount: '10',
        assetCode: '',
        assetIssuer: TESTNET_USDC_ISSUER,
      }),
    ).toThrow();

    // Exceeds 12 characters (Stellar protocol limit for alphanumeric assets)
    expect(() =>
      buildAssetPaymentUri({
        destination: validDestination,
        amount: '10',
        assetCode: 'TOKENOVERTWELVECHARS',
        assetIssuer: TESTNET_USDC_ISSUER,
      }),
    ).toThrow(/Asset code must be 1-12 alphanumeric characters/);

    // Invalid symbols in asset code
    expect(() =>
      buildAssetPaymentUri({
        destination: validDestination,
        amount: '10',
        assetCode: 'USDC$',
        assetIssuer: TESTNET_USDC_ISSUER,
      }),
    ).toThrow(/Asset code must be 1-12 alphanumeric characters/);
  });

  it('should reject secret seed as asset issuer', () => {
    expect(() =>
      buildAssetPaymentUri({
        destination: validDestination,
        amount: '10',
        assetCode: 'USDC',
        assetIssuer: 'SBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      }),
    ).toThrow(/Security violation.*private secret key/);
  });
});

describe('Step 30: Standard SEP-7 URI Specification Compliance & Round-Trip', () => {
  const destination = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
  const issuer = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

  it('should match exact canonical SEP-7 pattern web+stellar:pay?destination=...&amount=...&memo=...', () => {
    const uri = buildNativePaymentUri({
      destination,
      amount: '42.0000000',
      memo: 'INV-CANONICAL',
    });

    const expectedPattern = /^web\+stellar:pay\?destination=GA5Z[A-Z0-9]+&amount=42\.0000000&memo=INV-CANONICAL&memo_type=MEMO_TEXT$/;
    expect(uri).toMatch(expectedPattern);
  });

  it('should properly URL-encode special characters in memo, msg, and parameters', () => {
    const complexMsg = 'Invoice #100: Coffee & Tea (20% off)';
    const complexMemo = 'INV-100-AB';

    const uri = buildNativePaymentUri({
      destination,
      amount: '15.5000000',
      memo: complexMemo,
      msg: complexMsg,
    });

    expect(uri).toContain(`msg=${encodeURIComponent(complexMsg)}`);

    const parsed = parsePaymentUri(uri);
    expect(parsed.msg).toBe(complexMsg);
    expect(parsed.memo).toBe(complexMemo);
  });

  it('should support alternative memo types (MEMO_ID, MEMO_HASH)', () => {
    // MEMO_ID (64-bit integer string)
    const idUri = buildPaymentUri({
      destination,
      amount: '10',
      memo: '1234567890',
      memoType: 'MEMO_ID',
    });
    const parsedId = parsePaymentUri(idUri);
    expect(parsedId.memo).toBe('1234567890');
    expect(parsedId.memoType).toBe('MEMO_ID');

    // MEMO_HASH (32-byte hex hash string)
    const hashMemo = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';
    const hashUri = buildPaymentUri({
      destination,
      amount: '10',
      memo: hashMemo,
      memoType: 'MEMO_HASH',
    });
    const parsedHash = parsePaymentUri(hashUri);
    expect(parsedHash.memo).toBe(hashMemo);
    expect(parsedHash.memoType).toBe('MEMO_HASH');
  });

  it('should guarantee lossless bidirectional round-trip serialization and deserialization', () => {
    const testCases = [
      {
        destination,
        amount: '1.0000000',
        assetCode: 'XLM',
        assetIssuer: null,
        memo: 'INV-ROUNDTRIP1',
        memoType: 'MEMO_TEXT',
        msg: 'Payment 1',
      },
      {
        destination,
        amount: '250.7500000',
        assetCode: 'USDC',
        assetIssuer: issuer,
        memo: 'INV-ROUNDTRIP2',
        memoType: 'MEMO_TEXT',
        msg: 'Payment 2',
        networkPassphrase: 'Test SDF Network ; September 2015',
      },
    ];

    for (const tc of testCases) {
      const uri = buildPaymentUri(tc);
      const parsed = parsePaymentUri(uri);

      expect(parsed.destination).toBe(tc.destination);
      expect(parsed.amount).toBe(tc.amount);
      expect(parsed.assetCode).toBe(tc.assetCode);
      expect(parsed.assetIssuer).toBe(tc.assetIssuer);
      expect(parsed.memo).toBe(tc.memo);
      expect(parsed.memoType).toBe(tc.memoType);
      expect(parsed.msg).toBe(tc.msg);
      if (tc.networkPassphrase) {
        expect(parsed.networkPassphrase).toBe(tc.networkPassphrase);
      }
    }
  });
});
