/**
 * @file apps/api/src/worker.ts
 * @summary Background worker process entry point (Listener, Reconciler, Jobs).
 * 
 * Purpose:
 *   - Runs independently from the HTTP server process for horizontal scalability and fault isolation.
 *   - Boots the real-time Stellar payment streaming listener (stellar/listener/listener.service.ts).
 *   - Schedules the periodic reconciler fallback sweep (stellar/reconciler/reconciler.service.ts).
 *   - Schedules background maintenance jobs:
 *       - Invoice expiration sweeps (jobs/expireInvoices.job.ts)
 *       - Payment due date reminders (jobs/reminders.job.ts)
 *       - Webhook retry queue (jobs/retryWebhooks.job.ts)
 *   - Handles graceful shutdown on SIGINT / SIGTERM signals, safely unsubscribing from chain streams.
 * 
 * Inputs:
 *   - config/env.ts, config/stellar.ts, config/prisma.ts.
 * 
 * Outputs:
 *   - Persistent worker event loop and background job intervals.
 * 
 * Interacting Modules:
 *   - stellar/listener, stellar/reconciler, and jobs/*.
 */

