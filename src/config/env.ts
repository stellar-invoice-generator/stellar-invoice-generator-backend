/**
 * @file apps/api/src/config/env.ts
 * @summary Environment variable parsing, default fallback handling, and Zod schema validation.
 * 
 * Purpose:
 *   Ensures fail-fast startup behavior by validating all required environment variables
 *   (database URLs, Stellar network settings, platform wallet, auth modes) on application boot.
 * 
 * Inputs:
 *   - process.env (Node.js runtime environment variables).
 * 
 * Outputs:
 *   - Typed, immutable, and validated config object exported as `envConfig`.
 * 
 * Interacting Modules:
 *   - Used by config/stellar.ts, config/prisma.ts, server.ts, worker.ts, and middleware.
 */

export interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  API_PORT: number;
  API_HOST: string;
  CORS_ORIGIN: string;
  DATABASE_URL: string;
  DIRECT_URL?: string;
  AUTH_MODE: 'api_key' | 'supabase';
  DEV_API_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_JWT_SECRET?: string;
  STELLAR_NETWORK: 'TESTNET' | 'PUBLIC';
  HORIZON_URL: string;
  STELLAR_RPC_URL?: string;
  CHAIN_READER_DRIVER: 'horizon' | 'rpc';
  PLATFORM_WALLET_PUBLIC_ADDRESS: string;
  TESTNET_USDC_ISSUER?: string;
  RECONCILER_INTERVAL_MS: number;
  EXPIRY_JOB_INTERVAL_MS: number;
  LISTENER_RECONNECT_DELAY_MS: number;
}

