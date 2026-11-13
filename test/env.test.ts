import { describe, it, expect } from 'vitest';
import { serverEnvSchema, databaseEnvSchema, authEnvSchema } from '../src/config/env.js';

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
