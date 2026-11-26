import { describe, it, expect } from 'vitest';
import {
  buildNativePaymentUri,
  buildPaymentUri,
  parsePaymentUri,
  SEP7_PAY_PREFIX,
} from '../src/stellar/paymentUri/paymentUri.service.js';

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
