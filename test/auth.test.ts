/**
 * @file test/auth.test.ts
 * @summary Unit and integration tests for merchant tenant isolation and auth drivers.
 */

import { describe, it } from 'vitest';

describe('Stage 4: Auth & Tenant Isolation (Pending Implementation in Stage 4)', () => {
  it.todo('api-key verification: authenticates valid key, rejects invalid key');
  it.todo('tenant isolation: merchant A cannot access, view, or modify invoices of merchant B');
  it.todo('missing auth headers: returns 401 Unauthorized');
});
