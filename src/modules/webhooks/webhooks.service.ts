/**
 * @file apps/api/src/modules/webhooks/webhooks.service.ts
 * @summary Business logic for dispatching merchant webhook notifications.
 * 
 * Purpose:
 *   - Enqueues events (e.g. invoice.paid, invoice.expired).
 *   - Signs outgoing payloads with HMAC-SHA256 signatures for authenticity.
 *   - Strictly prevents SSRF by blocking non-HTTPS URLs and private/internal IP address ranges.
 *   - Implements exponential backoff retries.
 * 
 * Inputs:
 *   - Event name, payload, merchant webhook endpoint URL and signing secret.
 * 
 * Outputs:
 *   - WebhookEvent persistence records and delivery status.
 * 
 * Interacting Modules:
 *   - Called after payment matching transitions in matcher.service.ts or jobs/expireInvoices.job.ts.
 *   - Retried by jobs/retryWebhooks.job.ts.
 */

