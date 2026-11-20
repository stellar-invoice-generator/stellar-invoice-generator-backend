import { describe, it, expect } from 'vitest';
import net from 'net';
import {
  INVOICE_STATUSES,
  PAYMENT_MATCH_RESULTS,
  WEBHOOK_STATUSES,
} from '../src/types/index.js';

describe('Step 13: Local PostgreSQL Container & Connectivity', () => {
  it('should successfully establish a TCP socket connection to PostgreSQL on port 5432', async () => {
    const isPortOpen = await new Promise<boolean>((resolve) => {
      const socket = net.createConnection({ host: 'localhost', port: 5432 });

      socket.on('connect', () => {
        socket.end();
        resolve(true);
      });

      socket.on('error', () => {
        resolve(false);
      });
    });

    expect(isPortOpen).toBe(true);
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
