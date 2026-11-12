/**
 * @file apps/api/src/utils/reference.util.ts
 * @summary Cryptographically random short reference generator for invoice memos.
 * 
 * Purpose:
 *   - Generates collision-resistant, human-readable invoice reference codes (e.g. "INV-8F3K2A").
 *   - Strictly enforces the Stellar text memo limit of 28 bytes (ASCII / UTF-8).
 *   - Excludes ambiguous characters (0, O, I, 1) to reduce customer payment entry errors.
 * 
 * Inputs:
 *   - Optional prefix (default "INV-") and length configuration.
 * 
 * Outputs:
 *   - Unique short reference string guaranteed to be <= 28 bytes.
 * 
 * Interacting Modules:
 *   - Used by modules/invoices/invoices.service.ts.
 *   - Tested by test/reference.test.ts.
 */

