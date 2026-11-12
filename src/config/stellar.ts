/**
 * @file apps/api/src/config/stellar.ts
 * @summary Stellar network settings, server instance providers, and official asset configurations.
 * 
 * Purpose:
 *   Configures the active Stellar network (Testnet vs Public), initializes Horizon Server / RPC clients,
 *   and registers known verified asset issuers (e.g. Testnet USDC) to prevent spoofed token payments.
 * 
 * Inputs:
 *   - Validated env settings from config/env.ts.
 * 
 * Outputs:
 *   - Stellar network passphrase, Horizon/RPC client instances, and verified asset registry.
 * 
 * Interacting Modules:
 *   - Read by stellar/chainReader/*, stellar/listener/*, and stellar/paymentUri/*.
 */

export interface StellarConfig {
  networkPassphrase: string;
  horizonUrl: string;
  rpcUrl?: string;
  platformWalletAddress: string;
  verifiedIssuers: Record<string, string>;
}

