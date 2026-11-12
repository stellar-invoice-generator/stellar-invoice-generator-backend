/**
 * @file apps/api/src/stellar/chainReader/horizonReader.ts
 * @summary Stellar Horizon implementation of IChainReader.
 * 
 * Purpose:
 *   Connects to Stellar Horizon REST API over Server-Sent Events (SSE) to stream payments,
 *   extracts transaction memos (handling multi-operation transactions), normalizes path payments
 *   (strict receive and strict send destination amount/asset), and yields NormalizedChainPayment objects.
 * 
 * Inputs:
 *   - Horizon endpoint from config/env.ts, account public address, and persistent cursor.
 * 
 * Outputs:
 *   - NormalizedChainPayment stream and batch query results.
 * 
 * Interacting Modules:
 *   - Implements IChainReader from chainReader.interface.ts.
 *   - Utilizes @stellar/stellar-sdk Horizon.Server.
 *   - Instantiated by stellar/chainReader/index.ts.
 */

