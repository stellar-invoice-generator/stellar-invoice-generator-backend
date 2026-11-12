/**
 * @file apps/api/src/jobs/expireInvoices.job.ts
 * @summary Background job to transition overdue pending invoices to EXPIRED status.
 * 
 * Purpose:
 *   - Runs periodically to query all invoices with status PENDING or PARTIALLY_PAID
 *     whose `dueDate` is earlier than the current system timestamp.
 *   - Transitions their status to EXPIRED.
 *   - Emits invoice.expired events for merchant webhook dispatch.
 * 
 * Inputs:
 *   - Current timestamp, database query via Prisma.
 * 
 * Outputs:
 *   - Status transitions on expired invoices.
 * 
 * Interacting Modules:
 *   - Uses config/prisma.ts.
 *   - Triggers modules/webhooks/webhooks.service.ts.
 *   - Scheduled by worker.ts.
 */

