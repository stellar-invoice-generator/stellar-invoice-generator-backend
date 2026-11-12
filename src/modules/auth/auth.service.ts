/**
 * @file apps/api/src/modules/auth/auth.service.ts
 * @summary Authentication business logic and provider resolution.
 * 
 * Purpose:
 *   Resolves the configured authentication driver ('api_key' or 'supabase') and executes
 *   credential verification, token decoding, and merchant profile linkage.
 * 
 * Inputs:
 *   - Auth headers / credentials from auth.controller.ts or auth.middleware.ts.
 * 
 * Outputs:
 *   - Verified AuthContext containing merchant identity.
 * 
 * Interacting Modules:
 *   - Implements IAuthProvider from auth.interface.ts.
 *   - Interacts with config/env.ts and modules/merchants/merchants.service.ts.
 */

