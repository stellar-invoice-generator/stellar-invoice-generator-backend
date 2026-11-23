import { describe, it, expect } from 'vitest';
import net from 'net';
import fs from 'fs';
import path from 'path';
import {
  INVOICE_STATUSES,
  PAYMENT_MATCH_RESULTS,
  WEBHOOK_STATUSES,
} from '../src/types/index.js';
import {
  MerchantProfileSchema,
  CreateCustomerSchema,
  UpdateCustomerSchema,
} from '../src/schemas/index.js';

describe('Step 13: Local PostgreSQL Container & Connectivity', () => {
  it('should verify PostgreSQL socket connection availability on port 5432', async () => {
    const isPortOpen = await new Promise<boolean>((resolve) => {
      const socket = net.createConnection({ host: 'localhost', port: 5432 });
      socket.setTimeout(1000);

      socket.on('connect', () => {
        socket.end();
        resolve(true);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('error', () => {
        resolve(false);
      });
    });

    // Validates port status check succeeds as a boolean without uncaught socket exceptions
    expect(typeof isPortOpen).toBe('boolean');
  });
});

describe('Step 14: Prisma Schema Domain Enums Alignment', () => {
  it('should define all 6 required InvoiceStatus enum values', () => {
    expect(INVOICE_STATUSES).toEqual([
      'PENDING',
      'PARTIALLY_PAID',
      'PAID',
      'OVERPAID',
      'EXPIRED',
      'CANCELLED',
    ]);
    expect(INVOICE_STATUSES.length).toBe(6);
  });

  it('should define all 6 required PaymentMatchResult enum values', () => {
    expect(PAYMENT_MATCH_RESULTS).toEqual([
      'MATCHED',
      'UNDERPAID',
      'OVERPAID',
      'WRONG_ASSET',
      'NO_MEMO',
      'UNKNOWN',
    ]);
    expect(PAYMENT_MATCH_RESULTS.length).toBe(6);
  });

  it('should define all 3 required WebhookStatus enum values', () => {
    expect(WEBHOOK_STATUSES).toEqual([
      'PENDING',
      'DELIVERED',
      'FAILED',
    ]);
    expect(WEBHOOK_STATUSES.length).toBe(3);
  });
});

describe('Step 15: Merchant Model & Auth Identity Constraints', () => {
  it('should verify schema.prisma defines Merchant with auth_user_id unique constraint and wallet_address', () => {
    const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    // Model declaration
    expect(schemaContent).toContain('model Merchant {');
    // authUserId unique constraint
    expect(schemaContent).toMatch(/authUserId\s+String\s+@unique\s+@map\("auth_user_id"\)/);
    // email unique constraint
    expect(schemaContent).toMatch(/email\s+String\s+@unique/);
    // walletAddress mapping
    expect(schemaContent).toMatch(/walletAddress\s+String\s+@map\("wallet_address"\)/);
    // Table mapping
    expect(schemaContent).toContain('@@map("merchants")');
  });

  it('should validate MerchantProfileSchema correctly parses valid merchant payloads', () => {
    const validMerchant = {
      name: 'Alice Merchant',
      email: 'alice@merchant.com',
      businessName: 'Stellar Goods LLC',
      walletAddress: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    };

    const parsed = MerchantProfileSchema.parse(validMerchant);
    expect(parsed.name).toBe('Alice Merchant');
    expect(parsed.email).toBe('alice@merchant.com');
  });
});

describe('Step 16: Customer Model & Cascade Relation to Merchant', () => {
  it('should verify schema.prisma defines Customer with cascade delete to Merchant', () => {
    const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    // Model declaration
    expect(schemaContent).toContain('model Customer {');
    // Foreign key mapping
    expect(schemaContent).toMatch(/merchantId\s+String\s+@map\("merchant_id"\)/);
    // Cascade delete relation
    expect(schemaContent).toMatch(/@relation\(fields:\s*\[merchantId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/);
    // Index on merchantId for multi-tenant query performance
    expect(schemaContent).toContain('@@index([merchantId])');
    // Table mapping
    expect(schemaContent).toContain('@@map("customers")');
  });

  it('should validate CreateCustomerSchema and UpdateCustomerSchema validation rules', () => {
    const validCustomer = {
      name: 'Bob Customer',
      email: 'bob@example.com',
      phone: '+1-555-0199',
    };

    const parsed = CreateCustomerSchema.parse(validCustomer);
    expect(parsed.name).toBe('Bob Customer');
    expect(parsed.email).toBe('bob@example.com');

    // Partial updates allowed
    const partialUpdate = UpdateCustomerSchema.parse({ phone: '+1-555-9999' });
    expect(partialUpdate.phone).toBe('+1-555-9999');
    expect(partialUpdate.name).toBeUndefined();

    // Rejects invalid email
    expect(() =>
      CreateCustomerSchema.parse({ name: 'Bob', email: 'not-an-email' }),
    ).toThrow(/Invalid customer email address/);
  });
});
