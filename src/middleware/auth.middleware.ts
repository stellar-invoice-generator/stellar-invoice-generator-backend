/**
 * @file apps/api/src/middleware/auth.middleware.ts
 * @summary Authentication and tenant authorization Express middleware.
 * 
 * Purpose:
 *   - Extracts Bearer tokens or API keys from request headers.
 *   - Delegates verification to modules/auth/auth.service.ts.
 *   - Attaches authenticated merchant identity to `req.user` / `req.merchant`.
 *   - Rejects unauthenticated requests with HTTP 401 Unauthorized.
 * 
 * Inputs:
 *   - Express Request (Authorization or X-API-Key headers).
 * 
 * Outputs:
 *   - Calls next() with populated req.user or yields 401 response.
 * 
 * Interacting Modules:
 *   - Uses modules/auth/auth.service.ts.
 *   - Applied across all protected merchant routes.
 */

