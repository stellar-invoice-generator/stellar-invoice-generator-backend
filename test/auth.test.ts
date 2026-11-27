/**
 * @file test/auth.test.ts
 * @summary Unit and integration tests for merchant tenant isolation and auth drivers.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  ApiKeyAuthProvider,
  DEV_AUTH_USER_ID,
  DEV_MERCHANT_EMAIL,
} from '../src/modules/auth/auth.service.js';
import { IAuthProvider, AuthContext } from '../src/modules/auth/auth.interface.js';
import { envConfig } from '../src/config/env.js';
import { prisma } from '../src/config/prisma.js';

describe('Step 31: Pluggable IAuthProvider Interface & AuthContext', () => {
  it('should verify ApiKeyAuthProvider implements IAuthProvider contract', () => {
    const provider: IAuthProvider = new ApiKeyAuthProvider();
    expect(provider.mode).toBe('api_key');
    expect(typeof provider.authenticate).toBe('function');
    expect(typeof provider.verifyApiKey).toBe('function');
    expect(typeof provider.verifyToken).toBe('function');
  });

  it('should type-check AuthContext structure', () => {
    const context: AuthContext = {
      authUserId: 'user-123',
      email: 'merchant@example.com',
      merchantId: 'merchant-456',
      role: 'merchant',
    };

    expect(context.authUserId).toBe('user-123');
    expect(context.email).toBe('merchant@example.com');
    expect(context.merchantId).toBe('merchant-456');
    expect(context.role).toBe('merchant');
  });
});

describe('Step 32: ApiKeyAuthProvider Implementation', () => {
  const mockPrisma = {
    merchant: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  } as unknown as typeof prisma;

  const provider = new ApiKeyAuthProvider(mockPrisma);

  it('should authenticate valid DEV_API_KEY returning dev context instantly without database dependency', async () => {
    const devKey = envConfig.DEV_API_KEY;
    expect(devKey).toBeDefined();

    const result = await provider.verifyApiKey(devKey!);
    expect(result).not.toBeNull();
    expect(result?.authUserId).toBe(DEV_AUTH_USER_ID);
    expect(result?.email).toBe(DEV_MERCHANT_EMAIL);
    expect(result?.role).toBe('merchant');
  });

  it('should authenticate via universal authenticate() method using apiKey or token', async () => {
    const devKey = envConfig.DEV_API_KEY!;

    // Passing apiKey property
    const res1 = await provider.authenticate({ apiKey: devKey });
    expect(res1?.authUserId).toBe(DEV_AUTH_USER_ID);

    // Passing token property (Bearer token containing API key)
    const res2 = await provider.authenticate({ token: devKey });
    expect(res2?.authUserId).toBe(DEV_AUTH_USER_ID);

    // Empty credentials return null
    const res3 = await provider.authenticate({});
    expect(res3).toBeNull();
  });

  it('should reject invalid, malformed, or empty API keys', async () => {
    expect(await provider.verifyApiKey('wrong-key')).toBeNull();
    expect(await provider.verifyApiKey('')).toBeNull();
    expect(await provider.verifyApiKey('   ')).toBeNull();
    // @ts-expect-error Testing non-string input
    expect(await provider.verifyApiKey(null)).toBeNull();
    // @ts-expect-error Testing non-string input
    expect(await provider.verifyApiKey(undefined)).toBeNull();
  });

  it('should resolve registered merchant by authUserId when present in database', async () => {
    const mockMerchant = {
      id: 'm-uuid-12345',
      authUserId: 'custom-merchant-api-key-99',
      name: 'Custom Merchant LLC',
      email: 'custom@merchant.com',
      businessName: 'Custom Merchant LLC',
      walletAddress: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const customPrisma = {
      merchant: {
        findUnique: vi.fn().mockResolvedValue(mockMerchant),
      },
    } as unknown as typeof prisma;

    const customProvider = new ApiKeyAuthProvider(customPrisma);
    const result = await customProvider.verifyApiKey('custom-merchant-api-key-99');

    expect(result).not.toBeNull();
    expect(result?.authUserId).toBe('custom-merchant-api-key-99');
    expect(result?.merchantId).toBe('m-uuid-12345');
    expect(result?.email).toBe('custom@merchant.com');
  });
});

describe('Stage 4: Pending Integration Suites', () => {
  it.todo('tenant isolation: merchant A cannot access, view, or modify invoices of merchant B');
  it.todo('missing auth headers: returns 401 Unauthorized');
});
