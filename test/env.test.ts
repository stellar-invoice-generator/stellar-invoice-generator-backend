import { describe, it, expect } from 'vitest';
import {
  serverEnvSchema,
  databaseEnvSchema,
  authEnvSchema,
  stellarEnvSchema,
  loadEnvConfig,
  formatZodErrors,
  getEnvConfig,
  envConfig,
} from '../src/config/env.js';

describe('Step 01: Server Environment Schema Validation', () => {
  it('should parse valid server environment settings with defaults', () => {
    const result = serverEnvSchema.parse({});
    expect(result.NODE_ENV).toBe('development');
    expect(result.API_PORT).toBe(4000);
    expect(result.API_HOST).toBe('0.0.0.0');
    expect(result.CORS_ORIGIN).toBe('http://localhost:3000');
    expect(result.LOG_LEVEL).toBe('info');
  });

  it('should coerce string API_PORT to a number', () => {
    const result = serverEnvSchema.parse({
      API_PORT: '8080',
      NODE_ENV: 'production',
      LOG_LEVEL: 'debug',
    });
    expect(result.API_PORT).toBe(8080);
    expect(result.NODE_ENV).toBe('production');
    expect(result.LOG_LEVEL).toBe('debug');
  });

  it('should reject invalid NODE_ENV value', () => {
    expect(() =>
      serverEnvSchema.parse({
        NODE_ENV: 'staging',
      }),
    ).toThrow();
  });
});

describe('Step 02: Database & Auth Environment Schema Validation', () => {
  it('should require DATABASE_URL', () => {
    expect(() =>
      databaseEnvSchema.parse({}),
    ).toThrow(/DATABASE_URL is required/);
  });

  it('should accept a valid DATABASE_URL and optional DIRECT_URL', () => {
    const result = databaseEnvSchema.parse({
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/stellar_invoice',
      DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/stellar_invoice?direct=true',
    });
    expect(result.DATABASE_URL).toBe('postgresql://postgres:postgres@localhost:5432/stellar_invoice');
    expect(result.DIRECT_URL).toBe('postgresql://postgres:postgres@localhost:5432/stellar_invoice?direct=true');
  });

  it('should default AUTH_MODE to api_key with dev fallback key', () => {
    const result = authEnvSchema.parse({});
    expect(result.AUTH_MODE).toBe('api_key');
    expect(result.DEV_API_KEY).toBe('dev-secret-api-key-change-in-production');
  });

  it('should reject supabase AUTH_MODE when SUPABASE_URL is missing', () => {
    expect(() =>
      authEnvSchema.parse({
        AUTH_MODE: 'supabase',
      }),
    ).toThrow(/SUPABASE_URL is required/);
  });

  it('should accept valid supabase credentials when AUTH_MODE is supabase', () => {
    const result = authEnvSchema.parse({
      AUTH_MODE: 'supabase',
      SUPABASE_URL: 'https://testproject.supabase.co',
      SUPABASE_ANON_KEY: 'anon-key-123',
    });
    expect(result.AUTH_MODE).toBe('supabase');
    expect(result.SUPABASE_URL).toBe('https://testproject.supabase.co');
  });
});

describe('Step 03: Stellar Network Environment Schema Validation', () => {
  const validStellarAddress = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

  it('should parse valid Stellar network settings with defaults', () => {
    const result = stellarEnvSchema.parse({
      PLATFORM_WALLET_PUBLIC_ADDRESS: validStellarAddress,
    });
    expect(result.STELLAR_NETWORK).toBe('TESTNET');
    expect(result.HORIZON_URL).toBe('https://horizon-testnet.stellar.org');
    expect(result.CHAIN_READER_DRIVER).toBe('horizon');
    expect(result.RECONCILER_INTERVAL_MS).toBe(180000);
    expect(result.EXPIRY_JOB_INTERVAL_MS).toBe(60000);
    expect(result.LISTENER_RECONNECT_DELAY_MS).toBe(5000);
    expect(result.PLATFORM_WALLET_PUBLIC_ADDRESS).toBe(validStellarAddress);
  });

  it('should require PLATFORM_WALLET_PUBLIC_ADDRESS', () => {
    expect(() =>
      stellarEnvSchema.parse({}),
    ).toThrow(/PLATFORM_WALLET_PUBLIC_ADDRESS is required/);
  });

  it('should reject invalid Stellar public addresses (e.g. secret keys or bad lengths)', () => {
    // Secret seed starting with S
    expect(() =>
      stellarEnvSchema.parse({
        PLATFORM_WALLET_PUBLIC_ADDRESS: 'SBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      }),
    ).toThrow(/must be a valid 56-character Stellar public key/);

    // Too short
    expect(() =>
      stellarEnvSchema.parse({
        PLATFORM_WALLET_PUBLIC_ADDRESS: 'GABC123',
      }),
    ).toThrow(/must be a valid 56-character Stellar public key/);
  });

  it('should coerce interval strings to positive integers', () => {
    const result = stellarEnvSchema.parse({
      PLATFORM_WALLET_PUBLIC_ADDRESS: validStellarAddress,
      RECONCILER_INTERVAL_MS: '300000',
      EXPIRY_JOB_INTERVAL_MS: '120000',
      LISTENER_RECONNECT_DELAY_MS: '10000',
    });
    expect(result.RECONCILER_INTERVAL_MS).toBe(300000);
    expect(result.EXPIRY_JOB_INTERVAL_MS).toBe(120000);
    expect(result.LISTENER_RECONNECT_DELAY_MS).toBe(10000);
  });
});

describe('Step 04: Full Application loadEnvConfig & Startup Error Handling', () => {
  const validStellarAddress = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

  const validFullEnv = {
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/stellar_invoice',
    PLATFORM_WALLET_PUBLIC_ADDRESS: validStellarAddress,
  };

  it('should successfully load valid complete environment config', () => {
    const config = loadEnvConfig(validFullEnv);
    expect(config.DATABASE_URL).toBe(validFullEnv.DATABASE_URL);
    expect(config.PLATFORM_WALLET_PUBLIC_ADDRESS).toBe(validStellarAddress);
    expect(config.API_PORT).toBe(4000);
    expect(config.STELLAR_NETWORK).toBe('TESTNET');
  });

  it('should throw formatted error listing all missing required fields', () => {
    expect(() => loadEnvConfig({})).toThrowError(/\[StellarInvoice Config Error\]/);
    expect(() => loadEnvConfig({})).toThrowError(/DATABASE_URL/);
    expect(() => loadEnvConfig({})).toThrowError(/PLATFORM_WALLET_PUBLIC_ADDRESS/);
  });

  it('should format zod errors cleanly using formatZodErrors helper', () => {
    const parsed = databaseEnvSchema.safeParse({});
    if (!parsed.success) {
      const formatted = formatZodErrors(parsed.error);
      expect(formatted).toContain('- [DATABASE_URL]: DATABASE_URL is required');
    }
  });

  it('should allow accessing properties via envConfig proxy', () => {
    // Reset cache with valid test env
    getEnvConfig(validFullEnv, true);
    expect(envConfig.DATABASE_URL).toBe(validFullEnv.DATABASE_URL);
    expect(envConfig.PLATFORM_WALLET_PUBLIC_ADDRESS).toBe(validStellarAddress);
  });
});
