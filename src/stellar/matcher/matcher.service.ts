/**
 * @file apps/api/src/stellar/matcher/matcher.service.ts
 * @summary Pure payment evaluation and state transition matching engine.
 * 
 * Purpose:
 *   - Evaluates incoming payments against target invoices as a deterministic, pure function.
 *   - Enforces the 5 golden validation rules:
 *     1. Memo presence: No memo yields 'NO_MEMO'. Unmatched reference yields 'UNKNOWN'.
 *     2. Asset code equality: Asset codes must match identically ('XLM', 'USDC').
 *     3. Asset issuer validation: For non-native assets, issuer must match strictly to block counterfeit tokens.
 *     4. Decimal arithmetic: Evaluates remaining balance using exact 7-decimal place precision (Decimal.js).
 *     5. Invoice state machine: Transitions PENDING/PARTIALLY_PAID -> PAID, OVERPAID, or updates balance on UNDERPAID.
 *        Flags payments on EXPIRED/CANCELLED invoices for manual review.
 * 
 * Inputs:
 *   - Invoice candidate record and incoming payment operation.
 * 
 * Outputs:
 *   - MatcherEvaluationResult (matchResult, newInvoiceStatus, newTotalPaid, audit notes).
 * 
 * Interacting Modules:
 *   - Consumed by stellar/listener/listener.service.ts and stellar/reconciler/reconciler.service.ts.
 *   - Rigorously tested by test/matcher.test.ts across all edge cases.
 */

