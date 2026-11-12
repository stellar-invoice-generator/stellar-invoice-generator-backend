/**
 * @file apps/api/src/stellar/chainReader/chainReader.interface.ts
 * @summary Pluggable Stellar blockchain reader interface.
 * 
 * Purpose:
 *   Decouples raw on-chain payment ingestion from matching and business logic.
 *   Enables seamless interchangeability between Stellar Horizon (SSE streaming)
 *   and Stellar RPC (stateless polling / getEvents / getTransactions) without altering downstream logic.
 * 
 * Inputs:
 *   - Wallet address, paging cursor string, and stream/polling callbacks.
 * 
 * Outputs:
 *   - Normalized raw Stellar payment operations with transaction hashes, memos, assets, amounts, and ledger sequences.
 * 
 * Interacting Modules:
 *   - Implemented by horizonReader.ts and rpcReader.ts.
 *   - Consumed by stellar/listener/listener.service.ts and stellar/reconciler/reconciler.service.ts.
 */

export interface NormalizedChainPayment {
  txHash: string;
  operationIndex: number;
  senderAddress: string;
  destinationAddress: string;
  amount: string; // 7 decimal places string representation
  assetCode: string; // 'XLM' or token code
  assetIssuer?: string | null;
  memo?: string | null;
  memoType?: string | null;
  ledger: string | bigint;
  timestamp: Date;
  pagingToken: string;
}

export interface IChainReader {
  /**
   * Streams incoming payments for an account beginning from a saved cursor.
   */
  streamPayments(
    accountAddress: string,
    cursor: string | undefined,
    onPayment: (payment: NormalizedChainPayment) => Promise<void>,
    onError: (error: Error) => void,
  ): () => void; // Returns unsubscribe / stop function

  /**
   * Fetches recent historical payments for reconciliation sweeps.
   */
  fetchRecentPayments(
    accountAddress: string,
    limit?: number,
  ): Promise<NormalizedChainPayment[]>;
}

