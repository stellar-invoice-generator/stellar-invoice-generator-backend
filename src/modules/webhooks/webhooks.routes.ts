/**
 * @file apps/api/src/modules/webhooks/webhooks.routes.ts
 * @summary Route definitions for merchant webhook settings.
 * 
 * Purpose:
 *   Registers endpoints:
 *   - GET  /api/v1/webhooks/logs
 *   - POST /api/v1/webhooks/test
 * 
 * Inputs:
 *   - HTTP requests.
 * 
 * Outputs:
 *   - Express Router instance.
 * 
 * Interacting Modules:
 *   - Protected by middleware/auth.middleware.ts.
 *   - Dispatches to webhooks.controller.ts.
 */

