/**
 * @file apps/api/src/server.ts
 * @summary HTTP REST API entry point for StellarInvoice.
 * 
 * Purpose:
 *   - Initializes Express application, security headers (helmet), CORS, body parsers, and pino-http.
 *   - Mounts health check endpoints:
 *       GET /health
 *       GET /health/listener (reports listener stream status and cursor lag)
 *   - Mounts API modules under /api/v1 (auth, merchants, customers, invoices, payments, dashboard, webhooks).
 *   - Attaches centralized error handler.
 *   - Starts HTTP listener on envConfig.API_PORT.
 * 
 * Inputs:
 *   - envConfig from config/env.ts, Prisma client from config/prisma.ts.
 * 
 * Outputs:
 *   - Running Node.js HTTP server.
 * 
 * Interacting Modules:
 *   - Mounts routes from modules/*.
 *   - Uses middleware/errorHandler.middleware.ts, rateLimit.middleware.ts.
 */

