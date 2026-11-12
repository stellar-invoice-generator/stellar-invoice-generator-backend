/**
 * @file apps/api/src/modules/webhooks/webhooks.controller.ts
 * @summary Controller handling webhook endpoint registration and test dispatch.
 * 
 * Purpose:
 *   Handles merchant webhook endpoint configurations, delivery logs, and test ping triggers.
 * 
 * Inputs:
 *   - Express Request with authenticated merchant context and webhook URL.
 * 
 * Outputs:
 *   - Express Response with webhook configuration and delivery attempt logs.
 * 
 * Interacting Modules:
 *   - Invokes webhooks.service.ts.
 *   - Bound in webhooks.routes.ts.
 */

