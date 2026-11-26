/**
 * @file src/config/stellar.ts
 * @summary Stellar network settings, passphrase resolvers, and verified asset issuers.
 * 
 * Purpose:
 *   [Step 25] Configures active Stellar network passphrases for Public and Testnet networks
 *   using @stellar/stellar-sdk Networks.
 *   [Step 26] Registers official Testnet and Public USDC asset issuers (Circle) to prevent
 *   token spoofing attacks during payment evaluation.
 * 
 * Inputs:
 *   - envConfig from src/config/env.ts.
 * 
 * Outputs:
 *   - getNetworkPassphrase(network): Returns official passphrase for Public or Testnet.
 *   - TESTNET_USDC_ISSUER: Circle Testnet USDC issuer address.
 *   - PUBLIC_USDC_ISSUER: Circle Public / Mainnet USDC issuer address.
 *   - OFFICIAL_USDC_ISSUERS: Record mapping networks to official issuers.
 *   - getOfficialUsdcIssuer(network): Resolves official USDC issuer by network.
 *   - isOfficialUsdcIssuer(assetCode, issuer, network): Validates USDC issuer.
 *   - stellarConfig: Global resolved Stellar configuration object.
 * 
 * Interacting Modules:
 *   - Read by stellar/chainReader/*, stellar/listener/*, and stellar/paymentUri/*.
 *   - Used in payment matcher to verify asset integrity.
 */

import { Networks } from '@stellar/stellar-sdk';
import { envConfig } from './env.js';
import { assertValidStellarAddress } from '../utils/stellarAddress.util.js';

export type StellarNetwork = 'TESTNET' | 'PUBLIC';

/**
 * Official Circle USDC asset issuers on Stellar:
 * - Testnet: GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
 * - Public:  GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN
 */
export const TESTNET_USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5' as const;
export const PUBLIC_USDC_ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN' as const;

export const OFFICIAL_USDC_ISSUERS: Record<StellarNetwork, string> = {
  TESTNET: TESTNET_USDC_ISSUER,
  PUBLIC: PUBLIC_USDC_ISSUER,
} as const;

export interface StellarConfig {
  network: StellarNetwork;
  networkPassphrase: string;
  horizonUrl: string;
  rpcUrl?: string;
  chainReaderDriver: 'horizon' | 'rpc';
  platformWalletAddress: string;
  verifiedIssuers: {
    USDC: string;
    [assetCode: string]: string;
  };
}

/**
 * Step 25: Resolves the official Stellar network passphrase for a given network.
 * Defaults to the configured envConfig.STELLAR_NETWORK.
 * 
 * @param network Optional network identifier ('TESTNET' | 'PUBLIC')
 * @returns Official Stellar network passphrase string
 */
export function getNetworkPassphrase(network?: string): string {
  const target = (network ?? envConfig.STELLAR_NETWORK).toUpperCase();

  switch (target) {
    case 'PUBLIC':
      return Networks.PUBLIC;
    case 'TESTNET':
      return Networks.TESTNET;
    default:
      throw new Error(`Unsupported Stellar network: "${network}". Expected "TESTNET" or "PUBLIC".`);
  }
}

/**
 * Step 26: Resolves the official Circle USDC issuer address for a given network.
 * For TESTNET, returns envConfig.TESTNET_USDC_ISSUER if customized, otherwise default.
 * 
 * @param network Optional network identifier ('TESTNET' | 'PUBLIC')
 * @returns 56-character Stellar public address of the USDC issuer
 */
export function getOfficialUsdcIssuer(network?: string): string {
  const target = (network ?? envConfig.STELLAR_NETWORK).toUpperCase() as StellarNetwork;

  if (target === 'TESTNET') {
    const issuer = envConfig.TESTNET_USDC_ISSUER || TESTNET_USDC_ISSUER;
    assertValidStellarAddress(issuer, 'TESTNET_USDC_ISSUER');
    return issuer;
  }

  if (target === 'PUBLIC') {
    return PUBLIC_USDC_ISSUER;
  }

  throw new Error(`Unsupported Stellar network: "${network}". Cannot resolve USDC issuer.`);
}

/**
 * Verifies if an asset code and issuer match the official verified USDC issuer for the network.
 * Critical anti-spoofing check for non-native assets.
 * 
 * @param assetCode Asset code string (e.g. "USDC")
 * @param issuer Issuer public key (G...)
 * @param network Optional network ('TESTNET' | 'PUBLIC')
 */
export function isOfficialUsdcIssuer(
  assetCode: string,
  issuer: string | null | undefined,
  network?: string,
): boolean {
  if (assetCode !== 'USDC' || !issuer) {
    return false;
  }

  try {
    const expectedIssuer = getOfficialUsdcIssuer(network);
    return issuer === expectedIssuer;
  } catch {
    return false;
  }
}

/**
 * Resolved global Stellar configuration singleton.
 */
export const stellarConfig: StellarConfig = {
  get network(): StellarNetwork {
    return envConfig.STELLAR_NETWORK as StellarNetwork;
  },
  get networkPassphrase(): string {
    return getNetworkPassphrase(envConfig.STELLAR_NETWORK);
  },
  get horizonUrl(): string {
    return envConfig.HORIZON_URL;
  },
  get rpcUrl(): string | undefined {
    return envConfig.STELLAR_RPC_URL;
  },
  get chainReaderDriver(): 'horizon' | 'rpc' {
    return envConfig.CHAIN_READER_DRIVER;
  },
  get platformWalletAddress(): string {
    return envConfig.PLATFORM_WALLET_PUBLIC_ADDRESS;
  },
  get verifiedIssuers(): { USDC: string; [assetCode: string]: string } {
    return {
      USDC: getOfficialUsdcIssuer(envConfig.STELLAR_NETWORK),
    };
  },
};
