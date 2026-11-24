/**
 * @file src/types/index.ts
 * @summary TypeScript interfaces, domain types, and enums for StellarInvoice backend.
 * 
 * Purpose:
 *   Defines core domain models, payment matching results, invoice statuses, and Stellar asset definitions.
 *   [Step 14] Aligns 1:1 with Prisma schema enums (InvoiceStatus, PaymentMatchResult, WebhookStatus).
 * 
 * Inputs / Outputs:
 *   - Inputs: Domain data structures.
 *   - Outputs: Exported TypeScript types and const arrays.
 * 
 * Interacting Modules:
 *   - Imported by controllers, services, matcher, and chainReader.
 *   - Used in src/schemas for Zod schema type inference.
 */

export const INVOICE_STATUSES = [
  'PENDING',
  'PARTIALLY_PAID',
  'PAID',
  'OVERPAID',
  'EXPIRED',
  'CANCELLED',
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PAYMENT_MATCH_RESULTS = [
  'MATCHED',
  'UNDERPAID',
  'OVERPAID',
  'WRONG_ASSET',
  'NO_MEMO',
  'UNKNOWN',
] as const;

export type PaymentMatchResult = (typeof PAYMENT_MATCH_RESULTS)[number];

export const WEBHOOK_STATUSES = [
  'PENDING',
  'DELIVERED',
  'FAILED',
] as const;

export type WebhookStatus = (typeof WEBHOOK_STATUSES)[number];

export interface StellarAssetConfig {
  code: string;
  issuer?: string | null;
}

export interface InvoiceItemDTO {
  description: string;
  quantity: number;
  unitPrice: string;
}

export interface CreateInvoiceDTO {
  customerId?: string;
  amount: string;
  assetCode: string;
  assetIssuer?: string | null;
  description: string;
  dueDate: string;
  items?: InvoiceItemDTO[];
}

export interface MerchantDTO {
  id: string;
  authUserId: string;
  name: string;
  email: string;
  businessName: string;
  walletAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerDTO {
  id: string;
  merchantId: string;
  name: string;
  email: string;
  phone?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCustomerDTO {
  name: string;
  email: string;
  phone?: string;
}

export interface InvoiceDTO {
  id: string;
  merchantId: string;
  customerId?: string | null;
  reference: string;
  amount: string;
  amountPaid: string;
  assetCode: string;
  assetIssuer?: string | null;
  description: string;
  dueDate: Date;
  status: InvoiceStatus;
  paymentLink?: string | null;
  createdAt: Date;
  paidDate?: Date | null;
  updatedAt: Date;
  items?: InvoiceItemDTO[];
}

export interface PaymentDTO {
  id: string;
  invoiceId?: string | null;
  txHash: string;
  operationIndex: number;
  senderAddress: string;
  amount: string;
  assetCode: string;
  assetIssuer?: string | null;
  memoReceived?: string | null;
  matchResult: PaymentMatchResult;
  ledger: string;
  timestamp: Date;
  createdAt: Date;
}

export interface ListenerStateDTO {
  streamName: string;
  lastCursor: string;
  updatedAt: Date;
}

export interface WebhookEventDTO {
  id: string;
  merchantId: string;
  eventType: string;
  payload: Record<string, unknown>;
  deliveryStatus: WebhookStatus;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}


