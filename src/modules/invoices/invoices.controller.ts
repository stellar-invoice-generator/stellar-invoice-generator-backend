/**
 * @file apps/api/src/modules/invoices/invoices.controller.ts
 * @summary Controller handling invoice REST API requests.
 * 
 * Purpose:
 *   Handles endpoints for creating invoices, listing with status filtering, fetching by ID,
 *   cancelling pending invoices, and public reference lookups for the payment page.
 * 
 * Inputs:
 *   - Express Request (authenticated merchant or public rate-limited requester).
 * 
 * Outputs:
 *   - Express Response with invoice payloads.
 * 
 * Interacting Modules:
 *   - Invokes invoices.service.ts.
 *   - Bound in invoices.routes.ts.
 */

