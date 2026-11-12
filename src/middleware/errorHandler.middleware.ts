/**
 * @file apps/api/src/middleware/errorHandler.middleware.ts
 * @summary Centralized Express error-handling middleware.
 * 
 * Purpose:
 *   - Catches unhandled errors from all controllers and middleware.
 *   - Formats uniform JSON error responses ({ status, message, details, timestamp }).
 *   - Logs stack traces via pino logger while sanitizing internal details in production to prevent information disclosure.
 * 
 * Inputs:
 *   - Error object, Express Request, Response, NextFunction.
 * 
 * Outputs:
 *   - Standardized HTTP error responses (400, 401, 403, 404, 409, 500).
 * 
 * Interacting Modules:
 *   - Uses utils/logger.util.ts.
 *   - Mounted as the final middleware in server.ts.
 */

