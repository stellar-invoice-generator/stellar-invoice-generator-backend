/**
 * @file apps/api/src/modules/auth/auth.controller.ts
 * @summary HTTP request handler for merchant authentication and identity sessions.
 * 
 * Purpose:
 *   Handles login, registration callbacks, session validation, and returns the active merchant context.
 * 
 * Inputs:
 *   - Express Request (credentials, headers).
 * 
 * Outputs:
 *   - Express Response (HTTP status codes, session tokens, merchant profile).
 * 
 * Interacting Modules:
 *   - Calls auth.service.ts.
 *   - Bound to endpoints in auth.routes.ts.
 */

