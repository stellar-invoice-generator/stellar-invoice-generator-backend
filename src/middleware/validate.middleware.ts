/**
 * @file src/middleware/validate.middleware.ts
 * @summary Request payload validation middleware powered by Zod.
 * 
 * Purpose:
 *   Validates request body, query params, or route params against supplied Zod schemas.
 *   Returns formatted HTTP 400 Bad Request error arrays on validation failure.
 * 
 * Inputs:
 *   - Zod schema and Express Request (body/query/params).
 * 
 * Outputs:
 *   - Replaces req.body with typed, validated data or responds with 400 error payload.
 * 
 * Interacting Modules:
 *   - Consumes schemas from src/schemas.
 *   - Applied to API routes across all modules.
 */
