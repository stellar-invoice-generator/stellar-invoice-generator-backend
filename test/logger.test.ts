import { describe, it, expect } from 'vitest';
import pino from 'pino';
import {
  logger,
  createLogger,
  createChildLogger,
  maskSecret,
  SENSITIVE_LOG_KEYS,
} from '../src/utils/logger.util.js';

describe('Step 05: Pino Logger Configuration & Lifecycle', () => {
  it('should export a valid singleton logger with standard logging methods', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.trace).toBe('function');
  });

  it('should support creating custom loggers with specific log levels', () => {
    const customLogger = createLogger({ level: 'debug', isDev: false });
    expect(customLogger.level).toBe('debug');
  });

  it('should create scoped child loggers with module context', () => {
    const child = createChildLogger('PaymentListener');
    expect(child).toBeDefined();
    expect(child.bindings().module).toBe('PaymentListener');
  });
});

describe('Step 06: Sensitive Field Redaction & String Masking', () => {
  it('should define comprehensive redaction paths for headers, keys, and tokens', () => {
    expect(SENSITIVE_LOG_KEYS).toContain('authorization');
    expect(SENSITIVE_LOG_KEYS).toContain('apiKey');
    expect(SENSITIVE_LOG_KEYS).toContain('password');
    expect(SENSITIVE_LOG_KEYS).toContain('secret');
    expect(SENSITIVE_LOG_KEYS).toContain('secretSeed');
    expect(SENSITIVE_LOG_KEYS).toContain('DEV_API_KEY');
    expect(SENSITIVE_LOG_KEYS).toContain('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('should automatically redact sensitive fields in logged payloads', () => {
    let capturedLog = '';
    // Create a logger with a custom memory stream to inspect serialized output
    const testStream = {
      write(chunk: string) {
        capturedLog += chunk;
      },
    };

    const redactingLogger = pino(
      {
        level: 'info',
        redact: {
          paths: SENSITIVE_LOG_KEYS,
          censor: '[REDACTED]',
        },
      },
      testStream,
    );

    redactingLogger.info(
      {
        apiKey: 'super-secret-key-12345',
        authorization: 'Bearer jwt.token.here',
        password: 'my-db-password',
        safeField: 'visible-merchant-id',
      },
      'User logged in',
    );

    const parsed = JSON.parse(capturedLog);
    expect(parsed.safeField).toBe('visible-merchant-id');
    expect(parsed.apiKey).toBe('[REDACTED]');
    expect(parsed.authorization).toBe('[REDACTED]');
    expect(parsed.password).toBe('[REDACTED]');
  });

  it('should correctly mask raw secret strings via maskSecret helper', () => {
    expect(maskSecret('SBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5')).toBe(
      'SBBD...[REDACTED]',
    );
    expect(maskSecret('short', 2)).toBe('sh...[REDACTED]');
    expect(maskSecret('abc', 4)).toBe('***');
    expect(maskSecret('')).toBe('');
    expect(maskSecret(null)).toBe('');
    expect(maskSecret(undefined)).toBe('');
  });
});

