/**
 * @file apps/api/src/utils/amount.util.ts
 * @summary High-precision Decimal arithmetic helpers for Stellar currency amounts.
 * 
 * Purpose:
 *   - NEVER uses JavaScript IEEE 754 floating-point numbers for financial calculations.
 *   - Employs Decimal.js / Prisma Decimal with exact 7-decimal place Stellar precision (1 stroop = 0.0000001 XLM).
 *   - Provides helpers for addition, subtraction, comparison (lessThan, equals, greaterThan), and string formatting.
 * 
 * Inputs:
 *   - String, BigInt, or Decimal amounts.
 * 
 * Outputs:
 *   - Precision-safe Decimal calculation results and formatted 7-decimal string representations.
 * 
 * Interacting Modules:
 *   - Used by stellar/matcher/matcher.service.ts and modules/invoices/invoices.service.ts.
 *   - Tested by test/amount.test.ts.
 */

