/**
 * @file src/schemas/index.ts
 * @summary Zod validation schemas for API request validation and payload verification.
 * 
 * Purpose:
 *   Provides runtime validation schemas for invoices, merchant setup, customer profiles,
 *   and Stellar address formats (G... 56 chars).
 * 
 * Inputs / Outputs:
 *   - Inputs: Unvalidated raw JSON or request bodies.
 *   - Outputs: Parsed, type-safe validated DTOs or Zod validation errors.
 * 
 * Interacting Modules:
 *   - Used by src/middleware/validate.middleware.ts for request body validation.
 *   - Used by controllers across modules (invoices, merchants, customers).
 */

import { z } from 'zod';
import { isValidStellarAddress } from '../utils/stellarAddress.util.js';

export const StellarAddressSchema = z
  .string()
  .regex(/^G[A-Z2-7]{55}$/, 'Invalid Stellar public address format (must start with G and be 56 characters)')
  .refine(isValidStellarAddress, 'Invalid Stellar public address checksum');

export const InvoiceItemSchema = z.object({
  description: z.string().min(1).max(255),
  quantity: z.number().int().positive(),
  unitPrice: z.string().regex(/^\d+(\.\d{1,7})?$/, 'Unit price must be a valid decimal string with up to 7 decimal places'),
});

export const CreateInvoiceSchema = z.object({
  customerId: z.string().uuid().optional(),
  amount: z.string().regex(/^\d+(\.\d{1,7})?$/, 'Amount must be a valid decimal string with up to 7 decimal places'),
  assetCode: z.string().min(1).max(12),
  assetIssuer: StellarAddressSchema.optional().nullable(),
  description: z.string().min(1).max(255),
  dueDate: z.string().datetime(),
  items: z.array(InvoiceItemSchema).optional(),
});

export const MerchantProfileSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  businessName: z.string().min(1).max(150),
  walletAddress: StellarAddressSchema,
});

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(100),
  email: z.string().email('Invalid customer email address'),
  phone: z.string().max(30).optional(),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

export const PaymentRecordSchema = z.object({
  txHash: z.string().regex(/^[0-9a-fA-F]{64}$/, 'Stellar transaction hash must be 64 hexadecimal characters'),
  operationIndex: z.number().int().nonnegative('Operation index must be a non-negative integer'),
  senderAddress: StellarAddressSchema,
  amount: z.string().regex(/^\d+(\.\d{1,7})?$/, 'Amount must be a valid decimal string with up to 7 decimal places'),
  assetCode: z.string().min(1).max(12),
  assetIssuer: StellarAddressSchema.optional().nullable(),
  memoReceived: z.string().max(28).optional().nullable(),
  ledger: z.union([z.bigint(), z.number().int().positive(), z.string().regex(/^\d+$/)]),
  timestamp: z.string().datetime(),
});

