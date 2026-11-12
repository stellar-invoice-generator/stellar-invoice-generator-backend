/**
 * @file apps/api/src/modules/merchants/merchants.routes.ts
 * @summary Express route definitions for merchant management.
 * 
 * Purpose:
 *   Registers endpoints:
 *   - GET  /api/v1/merchants/profile
 *   - PUT  /api/v1/merchants/profile
 *   - PUT  /api/v1/merchants/wallet
 * 
 * Inputs:
 *   - Express HTTP requests.
 * 
 * Outputs:
 *   - Configured Express router.
 * 
 * Interacting Modules:
 *   - Protected by middleware/auth.middleware.ts.
 *   - Delegates to merchants.controller.ts.
 */

