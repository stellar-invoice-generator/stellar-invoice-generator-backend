/**
 * @file src/modules/auth/auth.service.ts
 * @summary Authentication business logic and ApiKeyAuthProvider implementation.
 * 
 * Purpose:
 *   [Step 32] Implements ApiKeyAuthProvider checking DEV_API_KEY for local development
 *   and registered merchant API keys in the database.
 * 
 * Inputs:
 *   - API keys or tokens from request headers (X-API-Key, Authorization).
 * 
 * Outputs:
 *   - Verified AuthContext containing merchant identity.
 * 
 * Interacting Modules:
 *   - Implements IAuthProvider from auth.interface.ts.
 *   - Uses config/env.ts (envConfig.DEV_API_KEY).
 *   - Uses config/prisma.ts (prisma) to resolve existing merchant records.
 */

import { AuthContext, AuthCredentials, IAuthProvider } from './auth.interface.js';
import { envConfig } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { logger } from '../../utils/logger.util.js';

export const DEV_AUTH_USER_ID = 'dev-admin-user';
export const DEV_MERCHANT_EMAIL = 'dev@stellarinvoice.local';

/**
 * Step 32: ApiKeyAuthProvider
 * Authenticates requests via API keys:
 * 1. Matches envConfig.DEV_API_KEY in local/development mode for zero-dependency bootstrap.
 * 2. Matches registered merchants in PostgreSQL by authUserId.
 */
export class ApiKeyAuthProvider implements IAuthProvider {
  readonly mode = 'api_key' as const;
  private readonly client: typeof prisma;

  constructor(client: typeof prisma = prisma) {
    this.client = client;
  }

  /**
   * Universal credential verification method checking either apiKey or Bearer token.
   */
  async authenticate(credentials: AuthCredentials): Promise<AuthContext | null> {
    const key = credentials.apiKey || credentials.token;
    if (!key) {
      return null;
    }
    return this.verifyApiKey(key);
  }

  /**
   * Verifies an API key string against DEV_API_KEY and database merchants.
   */
  async verifyApiKey(apiKey: string): Promise<AuthContext | null> {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      return null;
    }

    const trimmedKey = apiKey.trim();

    // 1. Check DEV_API_KEY for local development bypass
    const devKey = envConfig.DEV_API_KEY;
    if (devKey && trimmedKey === devKey) {
      return {
        authUserId: DEV_AUTH_USER_ID,
        email: DEV_MERCHANT_EMAIL,
        merchantId: DEV_AUTH_USER_ID,
        role: 'merchant',
      };
    }

    // 2. Check database for merchant matching authUserId = apiKey
    try {
      const merchant = await this.client.merchant.findUnique({
        where: { authUserId: trimmedKey },
      });

      if (merchant) {
        return {
          authUserId: merchant.authUserId,
          email: merchant.email,
          merchantId: merchant.id,
          role: 'merchant',
        };
      }
    } catch (err) {
      logger.debug({ err }, 'Database error during API key verification');
    }

    return null;
  }

  /**
   * In API key mode, tokens passed as Bearer tokens are treated as API keys.
   */
  async verifyToken(token: string): Promise<AuthContext | null> {
    return this.verifyApiKey(token);
  }
}
