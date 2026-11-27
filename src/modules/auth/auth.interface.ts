/**
 * @file src/modules/auth/auth.interface.ts
 * @summary Pluggable authentication provider interface and identity context.
 * 
 * Purpose:
 *   [Step 31] Abstracts merchant identity verification so the system can run locally in API-key mode
 *   without external dependencies, or in production using Supabase Auth JWT verification.
 * 
 * Inputs:
 *   - Incoming request credentials (Bearer token, API key header).
 * 
 * Outputs:
 *   - Authenticated merchant identity context (AuthContext: authUserId, merchantId, email).
 * 
 * Interacting Modules:
 *   - Implemented by ApiKeyAuthProvider and SupabaseAuthProvider in auth.service.ts.
 *   - Used by middleware/auth.middleware.ts to guard protected merchant routes.
 */

export interface AuthContext {
  authUserId: string;
  email: string;
  merchantId?: string | null;
  role?: string;
}

export interface AuthCredentials {
  apiKey?: string | null;
  token?: string | null;
}

export interface IAuthProvider {
  readonly mode: 'api_key' | 'supabase';
  authenticate(credentials: AuthCredentials): Promise<AuthContext | null>;
  verifyApiKey(apiKey: string): Promise<AuthContext | null>;
  verifyToken(token: string): Promise<AuthContext | null>;
}
