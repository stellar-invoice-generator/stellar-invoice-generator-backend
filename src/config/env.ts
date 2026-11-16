/**
 * @file src/config/env.ts
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

import { z } from 'zod';
import dotenv from 'dotenv';

// Automatically load environment variables from .env file
dotenv.config();

/**
 * Step 01: Server & Runtime Environment Schema
 * Validates fundamental application runtime flags, port, host, and logging level.
 */
export const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  API_PORT: z.coerce
    .number()
    .int()
    .positive('API_PORT must be a positive integer')
    .default(4000),
  API_HOST: z
    .string()
    .min(1)
    .default('0.0.0.0'),
  CORS_ORIGIN: z
    .string()
    .min(1)
    .default('http://localhost:3000'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Step 02: Database & Authentication Environment Schema
 * Validates PostgreSQL connection strings and merchant authentication driver configurations.
 */
export const databaseEnvSchema = z.object({
  DATABASE_URL: z
    .string({
      required_error: 'DATABASE_URL is required for PostgreSQL connectivity',
    })
    .min(1, 'DATABASE_URL is required for PostgreSQL connectivity'),
  DIRECT_URL: z
    .string()
    .optional(),
});

export const authEnvBaseSchema = z.object({
  AUTH_MODE: z
    .enum(['api_key', 'supabase'])
    .default('api_key'),
  DEV_API_KEY: z
    .string()
    .default('dev-secret-api-key-change-in-production'),
  SUPABASE_URL: z
    .string()
    .url('SUPABASE_URL must be a valid URL')
    .optional(),
  SUPABASE_ANON_KEY: z
    .string()
    .optional(),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .optional(),
  SUPABASE_JWT_SECRET: z
    .string()
    .optional(),
});

export const authEnvSchema = authEnvBaseSchema.superRefine((data, ctx) => {
  // If Supabase mode is selected, ensure required Supabase credentials are present
  if (data.AUTH_MODE === 'supabase' && !data.SUPABASE_URL) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['SUPABASE_URL'],
      message: 'SUPABASE_URL is required when AUTH_MODE is set to "supabase"',
    });
  }
});

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;
export type AuthEnv = z.infer<typeof authEnvSchema>;

/**
 * Step 03: Stellar Network & Worker Configuration Schema
 * Validates Stellar network mode, Horizon/RPC URLs, receiving wallet address,
 * known token issuers, and background worker polling intervals.
 */
export const stellarEnvSchema = z.object({
  STELLAR_NETWORK: z
    .enum(['TESTNET', 'PUBLIC'])
    .default('TESTNET'),
  HORIZON_URL: z
    .string()
    .url('HORIZON_URL must be a valid URL')
    .default('https://horizon-testnet.stellar.org'),
  STELLAR_RPC_URL: z
    .string()
    .url('STELLAR_RPC_URL must be a valid URL')
    .optional(),
  CHAIN_READER_DRIVER: z
    .enum(['horizon', 'rpc'])
    .default('horizon'),
  PLATFORM_WALLET_PUBLIC_ADDRESS: z
    .string({
      required_error: 'PLATFORM_WALLET_PUBLIC_ADDRESS is required to receive payments',
    })
    .regex(
      /^G[A-Z2-7]{55}$/,
      'PLATFORM_WALLET_PUBLIC_ADDRESS must be a valid 56-character Stellar public key (starting with G)',
    ),
  TESTNET_USDC_ISSUER: z
    .string()
    .regex(
      /^G[A-Z2-7]{55}$/,
      'TESTNET_USDC_ISSUER must be a valid 56-character Stellar public key (starting with G)',
    )
    .default('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'),
  RECONCILER_INTERVAL_MS: z.coerce
    .number()
    .int()
    .positive('RECONCILER_INTERVAL_MS must be a positive integer')
    .default(180000), // 3 minutes
  EXPIRY_JOB_INTERVAL_MS: z.coerce
    .number()
    .int()
    .positive('EXPIRY_JOB_INTERVAL_MS must be a positive integer')
    .default(60000), // 1 minute
  LISTENER_RECONNECT_DELAY_MS: z.coerce
    .number()
    .int()
    .positive('LISTENER_RECONNECT_DELAY_MS must be a positive integer')
    .default(5000), // 5 seconds
});

export type StellarEnv = z.infer<typeof stellarEnvSchema>;

/**
 * Step 04: Full Application Environment Schema & Loader
 * Combines all individual schemas into a single validated configuration.
 * Provides fail-fast validation on startup with formatted human-readable diagnostic messages.
 */
export const rawEnvSchema = serverEnvSchema
  .merge(databaseEnvSchema)
  .merge(authEnvBaseSchema)
  .merge(stellarEnvSchema);

export const envSchema = rawEnvSchema.superRefine((data, ctx) => {
  if (data.AUTH_MODE === 'supabase' && !data.SUPABASE_URL) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['SUPABASE_URL'],
      message: 'SUPABASE_URL is required when AUTH_MODE is set to "supabase"',
    });
  }
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Formats Zod validation issues into clean, readable bullet points for CLI / startup logs.
 */
export function formatZodErrors(error: z.ZodError): string {
  return error.errors
    .map((err) => `  - [${err.path.join('.')}]: ${err.message}`)
    .join('\n');
}

/**
 * Validates and returns parsed environment configuration.
 * Throws a formatted Error if any required variable is missing or invalid.
 */
export function loadEnvConfig(overrideEnv?: Record<string, string | undefined>): EnvConfig {
  const envToParse = overrideEnv ?? process.env;
  const parseResult = envSchema.safeParse(envToParse);

  if (!parseResult.success) {
    const formattedErrors = formatZodErrors(parseResult.error);
    const errorMessage = `❌ [StellarInvoice Config Error] Invalid environment configuration:\n${formattedErrors}`;
    throw new Error(errorMessage);
  }

  return parseResult.data;
}

// Memoized singleton for application runtime consumption
let cachedEnvConfig: EnvConfig | null = null;

export function getEnvConfig(
  overrideEnv?: Record<string, string | undefined>,
  resetCache = false,
): EnvConfig {
  if (!cachedEnvConfig || resetCache || overrideEnv) {
    const loaded = loadEnvConfig(overrideEnv);
    cachedEnvConfig = loaded;
    return loaded;
  }
  return cachedEnvConfig;
}

/**
 * Exported Proxy for convenient, direct property access (e.g. `envConfig.DATABASE_URL`)
 * Evaluates lazily on first property access.
 */
export const envConfig: EnvConfig = new Proxy({} as EnvConfig, {
  get(_target, prop: string | symbol) {
    const config = getEnvConfig();
    return Reflect.get(config, prop);
  },
});
