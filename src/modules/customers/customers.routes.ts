/**
 * @file apps/api/src/modules/customers/customers.routes.ts
 * @summary Route definitions for customer directory management.
 * 
 * Purpose:
 *   Registers endpoints:
 *   - GET  /api/v1/customers
 *   - POST /api/v1/customers
 *   - GET  /api/v1/customers/:id
 *   - PUT  /api/v1/customers/:id
 * 
 * Inputs:
 *   - HTTP requests.
 * 
 * Outputs:
 *   - Express Router instance.
 * 
 * Interacting Modules:
 *   - Protected by middleware/auth.middleware.ts.
 *   - Dispatches to customers.controller.ts.
 */

