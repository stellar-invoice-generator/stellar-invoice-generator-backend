/**
 * @file apps/api/src/stellar/chainReader/index.ts
 * @summary Chain reader factory and barrel export.
 * 
 * Purpose:
 *   Instantiates the configured chain reader implementation (Horizon or RPC) based on CHAIN_READER_DRIVER.
 * 
 * Inputs:
 *   - config/env.ts settings.
 * 
 * Outputs:
 *   - Exported `chainReader` singleton fulfilling IChainReader.
 * 
 * Interacting Modules:
 *   - Used by stellar/listener and stellar/reconciler.
 */

export * from './chainReader.interface.js';
export * from './horizonReader.js';
export * from './rpcReader.js';

