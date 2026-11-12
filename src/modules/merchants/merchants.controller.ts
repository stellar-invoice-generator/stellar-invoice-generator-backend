/**
 * @file apps/api/src/modules/merchants/merchants.controller.ts
 * @summary Controller handling HTTP requests for merchant profile and wallet settings.
 * 
 * Purpose:
 *   Handles endpoints for fetching merchant profile, updating business details,
 *   and updating receiving Stellar public keys.
 * 
 * Inputs:
 *   - Express Request with authenticated merchant context and body.
 * 
 * Outputs:
 *   - Express Response with sanitized merchant profile object.
 * 
 * Interacting Modules:
 *   - Invokes merchants.service.ts.
 *   - Bound in merchants.routes.ts.
 */

