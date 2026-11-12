/**
 * @file apps/api/src/modules/payments/payments.controller.ts
 * @summary Controller handling payment audit and review requests.
 * 
 * Purpose:
 *   Handles listing payments, querying payments flagged for manual review,
 *   and submitting manual payment-to-invoice assignments.
 * 
 * Inputs:
 *   - Express Request (authenticated merchant context, payment IDs).
 * 
 * Outputs:
 *   - Express Response with payment details and match resolutions.
 * 
 * Interacting Modules:
 *   - Invokes payments.service.ts.
 *   - Bound in payments.routes.ts.
 */

