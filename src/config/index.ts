/**
 * @file apps/api/src/config/index.ts
 * @summary Central configuration barrel export.
 * 
 * Purpose:
 *   Re-exports validated environment configurations, Stellar network parameters, and Prisma client.
 * 
 * Inputs / Outputs:
 *   - Aggregates env.ts, stellar.ts, and prisma.ts.
 * 
 * Interacting Modules:
 *   - Consumed throughout apps/api.
 */

export * from './env.js';
export * from './stellar.js';
export * from './prisma.js';

