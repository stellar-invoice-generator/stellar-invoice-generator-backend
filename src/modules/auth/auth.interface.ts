/**
 * @file apps/api/src/modules/auth/auth.interface.ts
 * @summary Pluggable authentication provider interface.
 * 
 * Purpose:
 *   Abstracts merchant identity verification so the system can run locally in API-key mode
 *   without external dependencies, or in production using Supabase Auth JWT verification.
 * 
 * Inputs:
 *   - Incoming request credentials (Bearer token, API key header).
 * 
 * Outputs:
 *   - Authenticated merchant identity context (authUserId, merchantId, roles).
 * 
 * Interacting Modules:
 *   - Implemented by auth.service.ts.
 *   - Used by middleware/auth.middleware.ts to guard protected merchant routes.
 */

export interface AuthContext {
  authUserId: string;
  email?: string;
  merchantId?: string;
}

export interface IAuthProvider {
  verifyToken(token: string): Promise<AuthContext | null>;
  verifyApiKey(apiKey: string): Promise<AuthContext | null>;
}

