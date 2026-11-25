/**
 * @file test/setup.ts
 * @summary Global test configuration, database fixture helpers, and table reset utilities.
 * 
 * Purpose:
 *   [Step 22] Provides database cleanup helpers for integration tests to safely reset
 *   tables in reverse dependency order without violating foreign key constraints.
 *   Provides standard test fixtures for merchants, customers, invoices, and payments.
 * 
 * Inputs:
 *   - PrismaClient instance (defaults to config/prisma.ts singleton or mock).
 * 
 * Outputs:
 *   - resetTestDatabase(client): Cleans all database tables inside an atomic transaction.
 *   - Test fixture factories (createTestMerchantData, createTestCustomerData, createTestInvoiceData).
 * 
 * Interacting Modules:
 *   - Used across test suites (database.test.ts, auth.test.ts, etc.) for clean isolation.
 */

import { PrismaClient } from '@prisma/client';
import { prisma } from '../src/config/prisma.js';

/**
 * Resets all application tables in reverse foreign-key dependency order
 * inside an atomic Prisma transaction.
 * 
 * Dependency order:
 * 1. payments (references invoices)
 * 2. invoice_items (references invoices)
 * 3. invoices (references merchants, customers)
 * 4. webhook_events (references merchants)
 * 5. customers (references merchants)
 * 6. merchants (root tenant)
 * 7. listener_states (independent cursor tracking)
 */
export async function resetTestDatabase(client: PrismaClient = prisma): Promise<void> {
  const deletePayments = client.payment.deleteMany();
  const deleteInvoiceItems = client.invoiceItem.deleteMany();
  const deleteInvoices = client.invoice.deleteMany();
  const deleteWebhookEvents = client.webhookEvent.deleteMany();
  const deleteCustomers = client.customer.deleteMany();
  const deleteMerchants = client.merchant.deleteMany();
  const deleteListenerStates = client.listenerState.deleteMany();

  await client.$transaction([
    deletePayments,
    deleteInvoiceItems,
    deleteInvoices,
    deleteWebhookEvents,
    deleteCustomers,
    deleteMerchants,
    deleteListenerStates,
  ]);
}

/**
 * Test fixture factory for creating a valid Merchant payload.
 */
export function createTestMerchantData(overrides: Partial<{
  authUserId: string;
  name: string;
  email: string;
  businessName: string;
  walletAddress: string;
}> = {}) {
  const id = Math.random().toString(36).substring(2, 8);
  return {
    authUserId: overrides.authUserId ?? `auth-user-${id}`,
    name: overrides.name ?? 'Test Merchant',
    email: overrides.email ?? `merchant-${id}@example.com`,
    businessName: overrides.businessName ?? 'Test Merchant LLC',
    walletAddress:
      overrides.walletAddress ??
      'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  };
}

/**
 * Test fixture factory for creating a valid Customer payload.
 */
export function createTestCustomerData(merchantId: string, overrides: Partial<{
  name: string;
  email: string;
  phone: string;
}> = {}) {
  const id = Math.random().toString(36).substring(2, 8);
  return {
    merchantId,
    name: overrides.name ?? 'Test Customer',
    email: overrides.email ?? `customer-${id}@example.com`,
    phone: overrides.phone ?? '+1-555-0100',
  };
}

/**
 * Test fixture factory for creating a valid Invoice payload.
 */
export function createTestInvoiceData(merchantId: string, overrides: Partial<{
  customerId?: string;
  reference: string;
  amount: string;
  assetCode: string;
  assetIssuer?: string | null;
  description: string;
  dueDate: Date;
}> = {}) {
  const id = Math.random().toString(36).substring(2, 8).toUpperCase();
  return {
    merchantId,
    customerId: overrides.customerId,
    reference: overrides.reference ?? `INV-${id}`,
    amount: overrides.amount ?? '100.0000000',
    assetCode: overrides.assetCode ?? 'XLM',
    assetIssuer: overrides.assetIssuer ?? null,
    description: overrides.description ?? 'Test invoice for testing',
    dueDate: overrides.dueDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
}
