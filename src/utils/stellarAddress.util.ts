/**
 * @file apps/api/src/utils/stellarAddress.util.ts
 * @summary Validation and checksum utility for Stellar StrKey public addresses.
 * 
 * Purpose:
 *   - Validates that a string is a valid Stellar account public key (G... 56 characters, ed25519 public key).
 *   - Verifies the StrKey version byte and CRC16 checksum using @stellar/stellar-sdk StrKey.
 *   - Validates muxed account addresses (M...) for future multi-tenant wallet routing.
 * 
 * Inputs:
 *   - Candidate address string.
 * 
 * Outputs:
 *   - Boolean indicating validity, or normalized StrKey string.
 * 
 * Interacting Modules:
 *   - Used in merchant wallet registration and shared Zod schemas.
 *   - Wave Trivial bounty candidate task.
 */

