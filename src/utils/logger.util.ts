/**
 * @file src/utils/logger.util.ts
 * @summary Structured logging utility powered by pino.
 * 
 * Purpose:
 *   - [Step 05] Provides high-performance, asynchronous structured JSON logging for production
 *     and human-readable colorized terminal output in development mode using pino-pretty.
 *   - [Step 06] Automatically redacts sensitive fields (Authorization headers, API keys,
 *     private seeds, database credentials) from all log streams to prevent data leaks.
 * 
 * Inputs:
 *   - Log messages, error objects, metadata contexts, HTTP request details.
 * 
 * Outputs:
 *   - Redacted stdout/stderr structured log streams and module child loggers.
 * 
 * Interacting Modules:
 *   - Consumed throughout the API controllers, listener, reconciler, and background jobs.
 */

import pino from 'pino';

/**
 * Step 06: Sensitive Field Redaction Rules
 * Automatically intercepts and masks credentials across nested log objects.
 */
export const SENSITIVE_LOG_KEYS = [
  'req.headers.authorization',
  'req.headers["x-api-key"]',
  'headers.authorization',
  'headers["x-api-key"]',
  'authorization',
  'Authorization',
  'apiKey',
  'api_key',
  'DEV_API_KEY',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
  'password',
  'secret',
  'secretKey',
  'secretSeed',
  'token',
  '*.authorization',
  '*.apiKey',
  '*.password',
  '*.secret',
  '*.secretSeed',
];

export interface LoggerOptions {
  level?: string;
  isDev?: boolean;
}

/**
 * Step 05: Pino Logger Factory & Configuration
 * Configures appropriate transports and log levels based on the active runtime environment.
 */
export function createLogger(options?: LoggerOptions) {
  const isDev = options?.isDev ?? (process.env.NODE_ENV === 'development');
  const level =
    options?.level ??
    (process.env.NODE_ENV === 'test'
      ? 'silent'
      : process.env.LOG_LEVEL || 'info');

  return pino({
    level,
    redact: {
      paths: SENSITIVE_LOG_KEYS,
      censor: '[REDACTED]',
    },
    transport: isDev
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  });
}

// Global logger singleton instance
export const logger = createLogger();

/**
 * Creates a scoped child logger annotated with module context.
 */
export function createChildLogger(moduleName: string) {
  return logger.child({ module: moduleName });
}

/**
 * Helper to mask sensitive strings for display in diagnostics or CLI output.
 * e.g. "SBBD47IF6LWK..." -> "SBBD...[REDACTED]"
 */
export function maskSecret(val: string | undefined | null, visibleChars = 4): string {
  if (!val) return '';
  if (val.length <= visibleChars) return '***';
  return `${val.slice(0, visibleChars)}...[REDACTED]`;
}
