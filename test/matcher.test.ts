/**
 * @file apps/api/test/matcher.test.ts
 * @summary Unit test suite for the pure payment matcher engine.
 * 
 * Test Scenarios:
 *   1. Exact payment match: Correct memo, asset code, issuer, and exact amount -> MATCHED & PAID.
 *   2. Underpayment: Valid memo and asset, but amount is less than remaining balance -> UNDERPAID & PARTIALLY_PAID.
 *   3. Overpayment: Valid memo and asset, amount exceeds invoice total -> OVERPAID & OVERPAID.
 *   4. Wrong asset code: Memo matches, but paid with XLM instead of USDC -> WRONG_ASSET (invoice unchanged).
 *   5. Spoofed asset issuer: Memo matches, asset code is USDC, but issuer is fake -> WRONG_ASSET (critical security test).
 *   6. Missing memo: Payment has null memo -> NO_MEMO (sent to needs review queue).
 *   7. Unrecognized memo: Memo does not correspond to any invoice reference -> UNKNOWN.
 *   8. Expired invoice payment: Memo matches an invoice in EXPIRED status -> MATCHED (flags for merchant review).
 *   9. Multi-operation transaction: Transaction contains multiple payments with distinct references.
 *   10. Decimal precision test: Handles 7-decimal fractional amounts (e.g. 0.0000001) without rounding errors.
 * 
 * Interacting Modules:
 *   - Tests stellar/matcher/matcher.service.ts.
 */

