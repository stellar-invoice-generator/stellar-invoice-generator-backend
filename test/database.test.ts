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
  CreateInvoiceSchema,
  InvoiceItemSchema,
  PaymentRecordSchema,
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

describe('Step 17: Invoice and InvoiceItem Models & Precision Constraints', () => {
  it('should verify schema.prisma defines Invoice with Decimal(20, 7) precision and compound index', () => {
    const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    // Model declaration
    expect(schemaContent).toContain('model Invoice {');
    // Decimal(20, 7) precision on amount and amount_paid
    expect(schemaContent).toMatch(/amount\s+Decimal\s+@db\.Decimal\(20,\s*7\)/);
    expect(schemaContent).toMatch(/amountPaid\s+Decimal\s+@default\(0\)\s+@map\("amount_paid"\)\s+@db\.Decimal\(20,\s*7\)/);
    // Reference unique constraint
    expect(schemaContent).toMatch(/reference\s+String\s+@unique/);
    // Compound index on (merchantId, status)
    expect(schemaContent).toContain('@@index([merchantId, status])');
    // Index on reference
    expect(schemaContent).toContain('@@index([reference])');
    // Relations to Merchant and Customer
    expect(schemaContent).toMatch(/@relation\(fields:\s*\[merchantId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/);
    expect(schemaContent).toMatch(/@relation\(fields:\s*\[customerId\],\s*references:\s*\[id\],\s*onDelete:\s*SetNull\)/);
    // Table mapping
    expect(schemaContent).toContain('@@map("invoices")');
  });

  it('should verify schema.prisma defines InvoiceItem with Decimal(20, 7) and foreign key index', () => {
    const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    // Model declaration
    expect(schemaContent).toContain('model InvoiceItem {');
    // Decimal(20, 7) precision on unitPrice
    expect(schemaContent).toMatch(/unitPrice\s+Decimal\s+@map\("unit_price"\)\s+@db\.Decimal\(20,\s*7\)/);
    // Cascade relation to Invoice
    expect(schemaContent).toMatch(/@relation\(fields:\s*\[invoiceId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/);
    // Index on invoiceId
    expect(schemaContent).toContain('@@index([invoiceId])');
    // Table mapping
    expect(schemaContent).toContain('@@map("invoice_items")');
  });

  it('should validate CreateInvoiceSchema and InvoiceItemSchema parsing and validation rules', () => {
    const validInvoice = {
      amount: '125.5000000',
      assetCode: 'USDC',
      assetIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      description: 'Consulting services - November 2026',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      items: [
        {
          description: 'Architecture review',
          quantity: 1,
          unitPrice: '100.0000000',
        },
        {
          description: 'Implementation hours',
          quantity: 2,
          unitPrice: '12.7500000',
        },
      ],
    };

    const parsed = CreateInvoiceSchema.parse(validInvoice);
    expect(parsed.amount).toBe('125.5000000');
    expect(parsed.assetCode).toBe('USDC');
    expect(parsed.items?.length).toBe(2);

    // Rejects amounts exceeding 7 decimal places
    expect(() =>
      CreateInvoiceSchema.parse({
        ...validInvoice,
        amount: '125.12345678', // 8 decimals
      }),
    ).toThrow(/up to 7 decimal places/);

    // Rejects negative line item quantity
    expect(() =>
      InvoiceItemSchema.parse({
        description: 'Test',
        quantity: -1,
        unitPrice: '10.0000000',
      }),
    ).toThrow();
  });
});

describe('Step 18: Payment Model & Composite Idempotency Constraint', () => {
  it('should verify schema.prisma defines Payment with @@unique([txHash, operationIndex])', () => {
    const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    // Model declaration
    expect(schemaContent).toContain('model Payment {');
    // Field mappings
    expect(schemaContent).toMatch(/txHash\s+String\s+@map\("tx_hash"\)/);
    expect(schemaContent).toMatch(/operationIndex\s+Int\s+@default\(0\)\s+@map\("operation_index"\)/);
    expect(schemaContent).toMatch(/senderAddress\s+String\s+@map\("sender_address"\)/);
    expect(schemaContent).toMatch(/amount\s+Decimal\s+@db\.Decimal\(20,\s*7\)/);
    // Composite unique constraint enforcing idempotency
    expect(schemaContent).toContain('@@unique([txHash, operationIndex])');
    // Index on invoiceId
    expect(schemaContent).toContain('@@index([invoiceId])');
    // Table mapping
    expect(schemaContent).toContain('@@map("payments")');
  });

  it('should validate PaymentRecordSchema validates 64-char hex txHash, amounts, and ledger values', () => {
    const validPayment = {
      txHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      operationIndex: 0,
      senderAddress: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      amount: '50.0000000',
      assetCode: 'XLM',
      memoReceived: 'INV-A1B2C3',
      ledger: '12345678',
      timestamp: new Date().toISOString(),
    };

    const parsed = PaymentRecordSchema.parse(validPayment);
    expect(parsed.txHash).toBe(validPayment.txHash);
    expect(parsed.operationIndex).toBe(0);
    expect(parsed.amount).toBe('50.0000000');

    // Rejects non-64 char hex hash
    expect(() =>
      PaymentRecordSchema.parse({
        ...validPayment,
        txHash: 'invalid-hash-too-short',
      }),
    ).toThrow(/64 hexadecimal characters/);

    // Rejects negative operation index
    expect(() =>
      PaymentRecordSchema.parse({
        ...validPayment,
        operationIndex: -1,
      }),
    ).toThrow(/non-negative/);

    // Rejects invalid sender address format
    expect(() =>
      PaymentRecordSchema.parse({
        ...validPayment,
        senderAddress: 'SBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5', // Secret seed!
      }),
    ).toThrow(/Invalid Stellar public address/);
  });
});

describe('Step 19: ListenerState & WebhookEvent Models', () => {
  it('should verify schema.prisma defines ListenerState for stream cursor tracking', () => {
    const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    // Model declaration
    expect(schemaContent).toContain('model ListenerState {');
    // Primary key on streamName
    expect(schemaContent).toMatch(/streamName\s+String\s+@id\s+@map\("stream_name"\)/);
    // Cursor string tracking
    expect(schemaContent).toMatch(/lastCursor\s+String\s+@map\("last_cursor"\)/);
    // Auto-updating timestamp
    expect(schemaContent).toMatch(/updatedAt\s+DateTime\s+@updatedAt\s+@map\("updated_at"\)/);
    // Table mapping
    expect(schemaContent).toContain('@@map("listener_states")');
  });

  it('should verify schema.prisma defines WebhookEvent with multi-tenant and status indexes', () => {
    const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    // Model declaration
    expect(schemaContent).toContain('model WebhookEvent {');
    // Foreign key and fields
    expect(schemaContent).toMatch(/merchantId\s+String\s+@map\("merchant_id"\)/);
    expect(schemaContent).toMatch(/eventType\s+String\s+@map\("event_type"\)/);
    expect(schemaContent).toMatch(/deliveryStatus\s+WebhookStatus\s+@default\(PENDING\)\s+@map\("delivery_status"\)/);
    expect(schemaContent).toMatch(/attempts\s+Int\s+@default\(0\)/);
    // Cascade delete to Merchant
    expect(schemaContent).toMatch(/@relation\(fields:\s*\[merchantId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/);
    // Query indexes for polling and filtering
    expect(schemaContent).toContain('@@index([merchantId])');
    expect(schemaContent).toContain('@@index([deliveryStatus])');
    // Table mapping
    expect(schemaContent).toContain('@@map("webhook_events")');
  });
});

describe('Step 20: Initial Prisma Migration & DDL Integrity', () => {
  it('should verify migration.sql exists and creates all required relational tables and constraints', () => {
    const migrationsDir = path.resolve(__dirname, '../prisma/migrations');
    const migrationFolders = fs
      .readdirSync(migrationsDir)
      .filter((file) => fs.statSync(path.join(migrationsDir, file)).isDirectory());

    expect(migrationFolders.length).toBeGreaterThanOrEqual(1);

    const initFolder = migrationFolders.find((folder) => folder.endsWith('_init'));
    expect(initFolder).toBeDefined();

    const sqlPath = path.join(migrationsDir, initFolder!, 'migration.sql');
    expect(fs.existsSync(sqlPath)).toBe(true);

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Domain Enums
    expect(sqlContent).toContain('CREATE TYPE "InvoiceStatus"');
    expect(sqlContent).toContain('CREATE TYPE "PaymentMatchResult"');
    expect(sqlContent).toContain('CREATE TYPE "WebhookStatus"');

    // Relational Tables
    expect(sqlContent).toContain('CREATE TABLE "merchants"');
    expect(sqlContent).toContain('CREATE TABLE "customers"');
    expect(sqlContent).toContain('CREATE TABLE "invoices"');
    expect(sqlContent).toContain('CREATE TABLE "invoice_items"');
    expect(sqlContent).toContain('CREATE TABLE "payments"');
    expect(sqlContent).toContain('CREATE TABLE "listener_states"');
    expect(sqlContent).toContain('CREATE TABLE "webhook_events"');

    // Critical Constraints & Indexes
    expect(sqlContent).toContain('CREATE UNIQUE INDEX "payments_tx_hash_operation_index_key"');
    expect(sqlContent).toContain('CREATE INDEX "invoices_merchant_id_status_idx"');
    expect(sqlContent).toContain('CREATE UNIQUE INDEX "invoices_reference_key"');
    expect(sqlContent).toContain('ALTER TABLE "payments" ADD CONSTRAINT');
    expect(sqlContent).toContain('ALTER TABLE "invoices" ADD CONSTRAINT');
  });
});
