/**
 * @file src/types/index.ts
 * @summary TypeScript interfaces, domain types, and enums for StellarInvoice backend.
 * 
 * Purpose:
 *   Defines core domain models, payment matching results, invoice statuses, and Stellar asset definitions.
 * 
 * Inputs / Outputs:
 *   - Inputs: Domain data structures.
 *   - Outputs: Exported TypeScript types (InvoiceStatus, PaymentMatchResult, StellarAssetConfig, etc.).
 * 
 * Interacting Modules:
 *   - Imported by controllers, services, matcher, and chainReader.
 *   - Used in src/schemas for Zod schema type inference.
 */

export type InvoiceStatus =
  | 'PENDING'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERPAID'
  | 'EXPIRED'
  | 'CANCELLED';

export type PaymentMatchResult =
  | 'MATCHED'
  | 'UNDERPAID'
  | 'OVERPAID'
  | 'WRONG_ASSET'
  | 'NO_MEMO'
  | 'UNKNOWN';

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

