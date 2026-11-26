/**
 * @file src/stellar/paymentUri/paymentUri.service.ts
 * @summary SEP-7 compliant Stellar payment URI builder (`web+stellar:pay?...`).
 * 
 * Purpose:
 *   [Step 28] Builds standardized, wallet-compatible SEP-7 payment URIs for native XLM
 *   (supported by Freighter, LOBSTR, xBull, and Stellar ecosystem wallets).
 *   [Step 29] Supports non-native assets (`asset_code` and `asset_issuer`).
 *   Encodes destination address, exact 7-decimal amount, and 28-byte text memo.
 * 
 * Inputs:
 *   - BuildPaymentUriParams: destination, amount, memo, assetCode, assetIssuer, msg, networkPassphrase.
 * 
 * Outputs:
 *   - Formatted SEP-7 URI string: `web+stellar:pay?destination=G...&amount=...&memo=...&memo_type=MEMO_TEXT`.
 *   - Parsed SEP-7 URI object for inspection and verification.
 * 
 * Interacting Modules:
 *   - Used during invoice creation in modules/invoices/invoices.service.ts.
 *   - Displayed on merchant checkout pages and QR code payment widgets.
 */

import { assertValidStellarAddress } from '../../utils/stellarAddress.util.js';
import { formatStellarAmount, toDecimal } from '../../utils/amount.util.js';
import { STELLAR_MAX_MEMO_BYTES } from '../../utils/reference.util.js';

export interface BuildPaymentUriParams {
  destination: string;
  amount: string | number;
  memo?: string;
  memoType?: 'MEMO_TEXT' | 'MEMO_ID' | 'MEMO_HASH' | 'MEMO_RETURN';
  assetCode?: string;
  assetIssuer?: string | null;
  msg?: string;
  networkPassphrase?: string;
}

export interface ParsedPaymentUri {
  operation: 'pay';
  destination: string;
  amount?: string;
  assetCode: string;
  assetIssuer?: string | null;
  memo?: string;
  memoType?: string;
  msg?: string;
  networkPassphrase?: string;
}

export const SEP7_PAY_PREFIX = 'web+stellar:pay';

/**
 * Step 28: Builds a SEP-7 compliant payment URI for native XLM payments.
 * For native XLM, asset_code and asset_issuer are omitted per SEP-7 specification.
 * 
 * @param params Destination, amount, and optional memo/msg
 * @returns Fully formatted SEP-7 URI string
 */
export function buildNativePaymentUri(params: {
  destination: string;
  amount: string | number;
  memo?: string;
  msg?: string;
  networkPassphrase?: string;
}): string {
  return buildPaymentUri({
    ...params,
    assetCode: 'XLM',
    assetIssuer: null,
  });
}

/**
 * Builds a standardized SEP-7 payment URI with rigorous validation.
 * 
 * Rules enforced:
 * 1. destination must be a valid 56-char Stellar public key (G...); secret seeds are rejected.
 * 2. amount must be strictly positive and formatted to at most 7 decimal places.
 * 3. memo must not exceed 28 bytes UTF-8 when memoType is MEMO_TEXT.
 * 4. asset_code and asset_issuer are omitted for native XLM.
 * 
 * @param params Payment URI parameters
 * @returns Formatted `web+stellar:pay?...` URI string
 */
export function buildPaymentUri(params: BuildPaymentUriParams): string {
  const {
    destination,
    amount,
    memo,
    memoType = 'MEMO_TEXT',
    assetCode,
    assetIssuer,
    msg,
    networkPassphrase,
  } = params;

  // 1. Validate destination address
  assertValidStellarAddress(destination, 'Payment destination');

  // 2. Validate and format amount
  const decAmount = toDecimal(amount);
  if (decAmount.isNegative() || decAmount.isZero()) {
    throw new Error(`Invalid payment amount: "${amount}". Amount must be strictly greater than 0.`);
  }
  const formattedAmount = formatStellarAmount(decAmount);

  // 3. Validate memo length (UTF-8 byte length strictly <= 28 for MEMO_TEXT)
  if (memo !== undefined && memo !== '') {
    const memoBytes = Buffer.byteLength(memo, 'utf8');
    if (memoBytes > STELLAR_MAX_MEMO_BYTES) {
      throw new Error(
        `Invoice reference memo exceeds Stellar ${STELLAR_MAX_MEMO_BYTES}-byte text memo limit: "${memo}" is ${memoBytes} bytes.`,
      );
    }
  }

  // 4. Build query parameters in canonical order
  const queryParts: string[] = [];

  queryParts.push(`destination=${encodeURIComponent(destination)}`);
  queryParts.push(`amount=${encodeURIComponent(formattedAmount)}`);

  // Non-native assets include asset_code and asset_issuer (Step 29 support)
  const isNative = !assetCode || assetCode.toUpperCase() === 'XLM' || assetCode.toUpperCase() === 'NATIVE';
  if (!isNative) {
    queryParts.push(`asset_code=${encodeURIComponent(assetCode!)}`);
    if (assetIssuer) {
      assertValidStellarAddress(assetIssuer, 'Asset issuer');
      queryParts.push(`asset_issuer=${encodeURIComponent(assetIssuer)}`);
    }
  }

  if (memo !== undefined && memo !== '') {
    queryParts.push(`memo=${encodeURIComponent(memo)}`);
    queryParts.push(`memo_type=${encodeURIComponent(memoType)}`);
  }

  if (msg) {
    queryParts.push(`msg=${encodeURIComponent(msg.slice(0, 300))}`);
  }

  if (networkPassphrase) {
    queryParts.push(`network_passphrase=${encodeURIComponent(networkPassphrase)}`);
  }

  return `${SEP7_PAY_PREFIX}?${queryParts.join('&')}`;
}

/**
 * Parses a SEP-7 URI string into structured fields for validation and testing.
 * 
 * @param uri Candidate SEP-7 URI string
 * @returns ParsedPaymentUri object
 */
export function parsePaymentUri(uri: string): ParsedPaymentUri {
  if (!uri.startsWith(`${SEP7_PAY_PREFIX}?`)) {
    throw new Error(`Invalid SEP-7 URI prefix: Expected to start with "${SEP7_PAY_PREFIX}?". Received: "${uri}"`);
  }

  const queryString = uri.slice(`${SEP7_PAY_PREFIX}?`.length);
  const searchParams = new URLSearchParams(queryString);

  const destination = searchParams.get('destination');
  if (!destination) {
    throw new Error('SEP-7 pay URI missing required parameter: "destination"');
  }

  const rawAssetCode = searchParams.get('asset_code');
  const assetIssuer = searchParams.get('asset_issuer');

  return {
    operation: 'pay',
    destination,
    amount: searchParams.get('amount') ?? undefined,
    assetCode: rawAssetCode ?? 'XLM',
    assetIssuer: assetIssuer ?? null,
    memo: searchParams.get('memo') ?? undefined,
    memoType: searchParams.get('memo_type') ?? undefined,
    msg: searchParams.get('msg') ?? undefined,
    networkPassphrase: searchParams.get('network_passphrase') ?? undefined,
  };
}
