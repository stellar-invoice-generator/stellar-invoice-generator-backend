/**
 * @file apps/api/src/utils/logger.util.ts
 * @summary Structured logging utility powered by pino.
 * 
 * Purpose:
 *   - Provides high-performance, asynchronous structured JSON logging for production.
 *   - Formats human-readable output in development mode using pino-pretty.
 *   - Automatically redacts sensitive fields (authorization headers, private data).
 * 
 * Inputs:
 *   - Log messages, error objects, metadata contexts.
 * 
 * Outputs:
 *   - Stdout/stderr structured log streams.
 * 
 * Interacting Modules:
 *   - Consumed throughout the API and worker processes.
 */

