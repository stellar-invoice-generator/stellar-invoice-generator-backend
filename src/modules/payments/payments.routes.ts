/**
 * @file apps/api/src/modules/payments/payments.routes.ts
 * @summary Route definitions for payment auditing and manual intervention.
 * 
 * Purpose:
 *   Registers endpoints:
 *   - GET  /api/v1/payments               (List payments for merchant)
 *   - GET  /api/v1/payments/needs-review   (List flagged payments: underpaid, wrong asset, no memo)
 *   - POST /api/v1/payments/:id/assign    (Manually assign payment to invoice)
 * 
 * Inputs:
 *   - HTTP requests.
 * 
 * Outputs:
 *   - Express Router instance.
 * 
 * Interacting Modules:
 *   - Protected by middleware/auth.middleware.ts.
 *   - Dispatches to payments.controller.ts.
 */

