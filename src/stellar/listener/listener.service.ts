/**
 * @file apps/api/src/stellar/listener/listener.service.ts
 * @summary Real-time Stellar payment stream listener and ingestion orchestrator.
 * 
 * Purpose:
 *   - Establishes a persistent streaming connection to incoming wallet payments.
 *   - Loads the last saved cursor from ListenerState to resume without gaps or replay storms.
 *   - Performs an idempotency pre-check on (txHash, operationIndex).
 *   - Hands the normalized payment to matcher.service.ts.
 *   - Persists the payment, invoice status change, and updated cursor in a single database transaction.
 *   - Implements exponential reconnection backoff when network interruptions occur.
 * 
 * Inputs:
 *   - Stream events from IChainReader, database state from config/prisma.ts.
 * 
 * Outputs:
 *   - Saved Payment records, updated Invoice status, and updated ListenerState.
 * 
 * Interacting Modules:
 *   - Consumes stellar/chainReader/chainReader.interface.ts.
 *   - Invokes stellar/matcher/matcher.service.ts.
 *   - Started by worker.ts.
 */

