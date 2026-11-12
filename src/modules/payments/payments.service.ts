/**
 * @file apps/api/src/modules/payments/payments.service.ts
 * @summary Business logic for recording payments and manual payment reassignment.
 * 
 * Purpose:
 *   - Fetches recorded payments for invoices and merchant audit trails.
 *   - Lists unrecognized / flagged payments needing review (e.g. NO_MEMO, UNKNOWN, WRONG_ASSET).
 *   - Allows merchants to manually associate an unmatched payment with an invoice.
 *   - Executes state changes within atomic database transactions.
 * 
 * Inputs:
 *   - MerchantId, invoiceId, paymentId, filters.
 * 
 * Outputs:
 *   - Payment database records and updated invoice status.
 * 
 * Interacting Modules:
 *   - config/prisma.ts for database transactions.
 *   - Called by payments.controller.ts and stellar/matcher/matcher.service.ts.
 */

