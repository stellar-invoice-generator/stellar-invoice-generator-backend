/**
 * @file apps/api/src/modules/invoices/invoices.routes.ts
 * @summary Route definitions for invoice operations.
 * 
 * Purpose:
 *   Registers endpoints:
 *   - POST /api/v1/invoices              (Merchant: Create invoice)
 *   - GET  /api/v1/invoices              (Merchant: List invoices with status filter)
 *   - GET  /api/v1/invoices/:id          (Merchant: Get invoice details)
 *   - POST /api/v1/invoices/:id/cancel   (Merchant: Cancel invoice)
 *   - GET  /api/v1/invoices/public/:ref  (Public: Get invoice by reference for customer payment)
 * 
 * Inputs:
 *   - HTTP requests.
 * 
 * Outputs:
 *   - Express Router instance.
 * 
 * Interacting Modules:
 *   - Uses middleware/auth.middleware.ts for merchant routes.
 *   - Uses middleware/rateLimit.middleware.ts for public reference endpoint.
 *   - Dispatches to invoices.controller.ts.
 */

