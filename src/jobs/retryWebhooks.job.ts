/**
 * @file apps/api/src/jobs/retryWebhooks.job.ts
 * @summary Background job to retry failed or pending webhook event deliveries.
 * 
 * Purpose:
 *   - Scans WebhookEvent table for records in PENDING or FAILED status with attempts < MAX_ATTEMPTS.
 *   - Dispatches webhook payloads with HMAC-SHA256 headers using exponential backoff.
 *   - Enforces SSRF blocks (HTTPS only, no private subnets).
 * 
 * Inputs:
 *   - Undelivered WebhookEvent records via Prisma.
 * 
 * Outputs:
 *   - Updated deliveryStatus and attempt counts.
 * 
 * Interacting Modules:
 *   - modules/webhooks/webhooks.service.ts.
 *   - Scheduled by worker.ts.
 */

