/**
 * @file apps/api/src/modules/merchants/merchants.service.ts
 * @summary Business logic for merchant account lifecycle and wallet address registration.
 * 
 * Purpose:
 *   Manages merchant profile creation, updates receiving Stellar wallet addresses (validating G... keys),
 *   and ensures merchant tenant isolation across data operations.
 * 
 * Inputs:
 *   - Merchant registration data, wallet update DTOs, and authenticated authUserId.
 * 
 * Outputs:
 *   - Merchant database records and public configuration.
 * 
 * Interacting Modules:
 *   - Prisma client from config/prisma.ts.
 *   - Address validator from utils/stellarAddress.util.ts.
 *   - Called by merchants.controller.ts and auth.service.ts.
 */

