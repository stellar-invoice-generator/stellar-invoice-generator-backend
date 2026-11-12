/**
 * @file src/stellar/matcher/matcher.types.ts
 * @summary Types and evaluation context for the payment matching engine.
 * 
 * Purpose:
 *   Defines the input contract and output structure for pure payment evaluation.
 * 
 * Inputs:
 *   - Invoice candidate and incoming payment details.
 * 
 * Outputs:
 *   - Evaluation match result, effective amount credited, and status transition outcome.
 * 
 * Interacting Modules:
 *   - Consumed by matcher.service.ts and test/matcher.test.ts.
 */

import { InvoiceStatus, PaymentMatchResult } from '../../types/index.js';

export interface MatcherInvoiceCandidate {
  id: string;
  reference: string;
  amount: string; // Decimal string
  amountPaid: string; // Decimal string
  assetCode: string;
  assetIssuer?: string | null;
  status: InvoiceStatus;
  dueDate: Date;
}

export interface MatcherPaymentInput {
  txHash: string;
  operationIndex: number;
  senderAddress: string;
  amount: string; // Decimal string
  assetCode: string;
  assetIssuer?: string | null;
  memoReceived?: string | null;
  timestamp: Date;
}

export interface MatcherEvaluationResult {
  matchResult: PaymentMatchResult;
  invoiceId?: string;
  newInvoiceStatus?: InvoiceStatus;
  newTotalPaid?: string;
  isTerminalMatch: boolean;
  notes: string;
}
