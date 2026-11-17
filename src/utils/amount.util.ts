/**
 * @file src/utils/amount.util.ts
 * @summary High-precision Decimal arithmetic and formatting helpers for Stellar currency amounts.
 * 
 * Purpose:
 *   - [Step 07] Provides a safe Decimal instantiation wrapper that eliminates JavaScript
 *     IEEE 754 floating-point precision drift.
 *   - [Step 08] Formats monetary amounts strictly to Stellar's 7-decimal place standard
 *     (1 stroop = 0.0000001 units).
 * 
 * Inputs:
 *   - String, number, BigInt, or Decimal amount representations.
 * 
 * Outputs:
 *   - Precision-safe Decimal instances and standardized 7-decimal string representations.
 * 
 * Interacting Modules:
 *   - Consumed by stellar/matcher/matcher.service.ts, modules/invoices/invoices.service.ts,
 *     and public payment formatting endpoints.
 */

import { Decimal } from 'decimal.js';

// Configure Decimal precision: 28 significant digits with standard half-up rounding
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export { Decimal };

/**
 * Standard number of decimal places supported natively by the Stellar network.
 * 1 unit (XLM / USDC) = 10^7 stroops (0.0000001).
 */
export const STELLAR_DECIMAL_PLACES = 7;

/**
 * Conversion factor from Stellar base units to stroops (10^7).
 */
export const STROOPS_PER_UNIT = new Decimal(10).pow(STELLAR_DECIMAL_PLACES);

/**
 * Step 07: Safe Decimal Instantiation Wrapper
 * Converts any numeric, string, or BigInt representation to a high-precision Decimal.
 * Strictly prevents IEEE 754 float precision loss by normalizing numbers to strings.
 * 
 * @throws {Error} if input is null, undefined, empty, NaN, or an unparseable string.
 */
export function toDecimal(value: string | number | Decimal | bigint): Decimal {
  if (value === null || value === undefined || value === '') {
    throw new Error('Cannot convert empty or null value to Decimal');
  }

  if (value instanceof Decimal) {
    return value;
  }

  if (typeof value === 'bigint') {
    return new Decimal(value.toString());
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`Cannot convert non-finite number (${value}) to Decimal`);
    }
    return new Decimal(value.toString());
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || isNaN(Number(trimmed))) {
      throw new Error(`Cannot parse invalid numeric string "${value}" to Decimal`);
    }
    return new Decimal(trimmed);
  }

  throw new Error(`Unsupported type for Decimal conversion: ${typeof value}`);
}

/**
 * Step 08: 7-Decimal Place String Formatter
 * Formats any amount to Stellar's standard 7-decimal place representation.
 * e.g. "10.5" -> "10.5000000", "0.1" -> "0.1000000"
 * 
 * @param amount - Candidate amount value
 * @param options - Optional formatting configuration (e.g. trimTrailingZeros)
 */
export function formatStellarAmount(
  amount: string | number | Decimal | bigint,
  options?: { trimTrailingZeros?: boolean },
): string {
  const dec = toDecimal(amount);
  const formatted = dec.toFixed(STELLAR_DECIMAL_PLACES);

  if (options?.trimTrailingZeros) {
    if (!formatted.includes('.')) {
      return formatted;
    }
    const trimmed = formatted.replace(/\.?0+$/, '');
    return trimmed === '' ? '0' : trimmed;
  }

  return formatted;
}

/**
 * Validates whether a candidate string is a valid positive Stellar amount
 * with at most 7 decimal places.
 */
export function isValidStellarAmount(val: string): boolean {
  if (typeof val !== 'string' || !val.trim()) {
    return false;
  }

  // Regex strictly matching positive numbers with up to 7 decimal digits
  const stellarAmountRegex = /^\d+(\.\d{1,7})?$/;
  if (!stellarAmountRegex.test(val.trim())) {
    return false;
  }

  try {
    const dec = toDecimal(val);
    return dec.isPositive() && !dec.isZero();
  } catch {
    return false;
  }
}

/**
 * Converts a Stellar asset amount to stroops (integer representation: 1 unit = 10,000,000 stroops).
 */
export function toStroops(amount: string | number | Decimal | bigint): bigint {
  const dec = toDecimal(amount);
  const stroopsDec = dec.times(STROOPS_PER_UNIT).truncated();
  return BigInt(stroopsDec.toFixed(0));
}

/**
 * Converts an integer amount of stroops to a Decimal in base units (10,000,000 stroops = 1.0000000).
 */
export function fromStroops(stroops: bigint | string | number): Decimal {
  const dec = toDecimal(stroops);
  return dec.dividedBy(STROOPS_PER_UNIT);
}
