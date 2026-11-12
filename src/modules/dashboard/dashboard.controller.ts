/**
 * @file apps/api/src/modules/dashboard/dashboard.controller.ts
 * @summary Controller handling merchant analytics and metrics endpoints.
 * 
 * Purpose:
 *   Handles GET /api/v1/dashboard/stats and returns financial totals.
 * 
 * Inputs:
 *   - Express Request with authenticated merchant context.
 * 
 * Outputs:
 *   - Express Response with financial analytics JSON.
 * 
 * Interacting Modules:
 *   - Invokes dashboard.service.ts.
 *   - Bound in dashboard.routes.ts.
 */

