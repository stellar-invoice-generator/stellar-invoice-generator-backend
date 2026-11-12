/**
 * @file apps/api/src/modules/dashboard/dashboard.service.ts
 * @summary Business logic for merchant dashboard statistics and payment metrics.
 * 
 * Purpose:
 *   Aggregates totals for earned revenue, pending receivable amounts, overdue invoices,
 *   and recent payment volume grouped by asset (XLM, USDC).
 * 
 * Inputs:
 *   - Authenticated merchantId, date range filters.
 * 
 * Outputs:
 *   - Dashboard summary metrics (totalRevenue, pendingAmount, overdueCount, volumeByAsset).
 * 
 * Interacting Modules:
 *   - config/prisma.ts for database aggregations.
 *   - Called by dashboard.controller.ts.
 */

