/**
 * @file apps/api/src/stellar/reconciler/reconciler.service.ts
 * @summary Periodic fallback payment reconciler and safety net.
 * 
 * Purpose:
 *   - Serves as the high-availability safety net for the live SSE payment listener.
 *   - Runs on a scheduled cron/interval to scan recent ledger transactions on the receiving platform wallet.
 *   - Detects any payment operations dropped during network blips, server restarts, or Horizon SSE disconnects.
 *   - Evaluates missing operations through the pure matcher and records them idempotently.
 * 
 * Inputs:
 *   - Recent transactions from IChainReader, database payment records from config/prisma.ts.
 * 
 * Outputs:
 *   - Reconciled payment records, caught-up invoices, and reconciliation audit logs.
 * 
 * Interacting Modules:
 *   - Consumes stellar/chainReader/chainReader.interface.ts.
 *   - Uses stellar/matcher/matcher.service.ts.
 *   - Scheduled by worker.ts.
 */

