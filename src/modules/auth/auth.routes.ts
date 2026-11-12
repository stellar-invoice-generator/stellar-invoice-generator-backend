/**
 * @file apps/api/src/modules/auth/auth.routes.ts
 * @summary Route definitions for merchant authentication endpoints.
 * 
 * Purpose:
 *   Registers Express router endpoints for auth operations:
 *   - POST /api/v1/auth/login
 *   - GET  /api/v1/auth/me
 * 
 * Inputs:
 *   - HTTP requests mapped from server.ts.
 * 
 * Outputs:
 *   - Express Router instance.
 * 
 * Interacting Modules:
 *   - Routes requests to auth.controller.ts; applies middleware/validate.middleware.ts.
 */

