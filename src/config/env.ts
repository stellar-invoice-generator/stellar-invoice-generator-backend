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

export const authEnvSchema = z.object({
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
}).superRefine((data, ctx) => {
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

// Combined schema for Step 01 & Step 02
export const baseEnvSchema = serverEnvSchema
  .merge(databaseEnvSchema)
  .merge(authEnvSchema);

export type BaseEnvConfig = z.infer<typeof baseEnvSchema>;
