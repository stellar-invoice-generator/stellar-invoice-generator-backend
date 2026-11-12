/**
 * @file apps/api/test/amount.test.ts
 * @summary Unit tests for Decimal amount arithmetic and Stellar 7-decimal place precision.
 * 
 * Test Scenarios:
 *   1. Addition & subtraction precision: 0.1 + 0.2 === 0.3000000 (verifies no IEEE 754 float drift).
 *   2. Minimum stroop value handling: Correctly processes 0.0000001 amounts.
 *   3. Decimal comparison logic: accurately flags underpayments by even 1 stroop.
 * 
 * Interacting Modules:
 *   - Tests utils/amount.util.ts.
 */

