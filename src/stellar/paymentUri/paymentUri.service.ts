/**
 * @file apps/api/src/stellar/paymentUri/paymentUri.service.ts
 * @summary SEP-7 compliant Stellar payment URI builder (`web+stellar:pay?...`).
 * 
 * Purpose:
 *   Builds standardized, wallet-compatible SEP-7 payment links and deep links
 *   (supported by Freighter, LOBSTR, xBull, and Stellar ecosystem wallets).
 *   Encodes destination address, exact decimal amount, asset code, asset issuer, and 28-byte text memo.
 * 
 * Inputs:
 *   - Destination public address (G...), amount (Decimal string), assetCode, assetIssuer, and invoice short reference memo.
 * 
 * Outputs:
 *   - Fully encoded SEP-7 URI string: `web+stellar:pay?destination=G...&amount=...&memo=...&memo_type=MEMO_TEXT`.
 * 
 * Interacting Modules:
 *   - Called during invoice creation in modules/invoices/invoices.service.ts.
 *   - Displayed by apps/web payment pages and QR code widgets.
 */

