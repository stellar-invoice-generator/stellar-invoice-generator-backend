/**
 * @file apps/api/src/middleware/rateLimit.middleware.ts
 * @summary Rate limiting middleware for public and authenticated API endpoints.
 * 
 * Purpose:
 *   Protects unauthenticated endpoints (such as public payment lookups) and merchant API routes
 *   against brute-force attacks, DDoS, and spam scraping.
 * 
 * Inputs:
 *   - Client IP address and endpoint route.
 * 
 * Outputs:
 *   - Next middleware execution or HTTP 429 Too Many Requests response with Retry-After header.
 * 
 * Interacting Modules:
 *   - Utilizes express-rate-limit configured via config/env.ts.
 *   - Applied in server.ts and modules/invoices/invoices.routes.ts.
 */

