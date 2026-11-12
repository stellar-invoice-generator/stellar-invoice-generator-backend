/**
 * @file apps/api/test/auth.test.ts
 * @summary Unit and integration tests for merchant tenant isolation and auth drivers.
 * 
 * Test Scenarios:
 *   1. API-key verification: Authenticates valid key, rejects invalid key.
 *   2. Tenant isolation: Merchant A cannot access, view, or modify invoices/payments of Merchant B.
 *   3. Missing auth headers: Returns 401 Unauthorized.
 * 
 * Interacting Modules:
 *   - Tests modules/auth/auth.service.ts and middleware/auth.middleware.ts.
 */

