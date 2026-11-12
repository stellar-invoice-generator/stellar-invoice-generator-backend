/**
 * @file apps/api/src/stellar/chainReader/rpcReader.ts
 * @summary Stellar RPC implementation of IChainReader.
 * 
 * Purpose:
 *   Provides stateless polling over Stellar RPC JSON-RPC endpoints (`getTransactions`, `getEvents`)
 *   for networks where Horizon is unavailable or phased out. Emits classic asset movement events.
 * 
 * Inputs:
 *   - Stellar RPC endpoint from config/env.ts, account address, and ledger cursor.
 * 
 * Outputs:
 *   - NormalizedChainPayment polling stream and batch query results.
 * 
 * Interacting Modules:
 *   - Implements IChainReader from chainReader.interface.ts.
 *   - Utilizes @stellar/stellar-sdk rpc.Server.
 *   - Instantiated by stellar/chainReader/index.ts.
 */

