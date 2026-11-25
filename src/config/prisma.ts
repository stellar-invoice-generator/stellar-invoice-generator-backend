/**
 * @file src/config/prisma.ts
 * @summary Prisma client singleton and database lifecycle management.
 * 
 * Purpose:
 *   [Step 21] Instantiates and exports a singleton instance of PrismaClient.
 *   Prevents connection pool exhaustion in serverless or multi-process execution environments.
 *   Provides graceful connection and disconnection lifecycle hooks.
 * 
 * Inputs:
 *   - DATABASE_URL / DIRECT_URL from config/env.ts.
 * 
 * Outputs:
 *   - prisma: PrismaClient singleton instance.
 *   - connectPrisma(): Explicit database connection initializer with structured logging.
 *   - disconnectPrisma(): Graceful disconnection helper.
 *   - registerPrismaShutdownHooks(): Process signal hooks (SIGINT, SIGTERM) for clean teardown.
 * 
 * Interacting Modules:
 *   - Used across all module services (merchants, customers, invoices, payments, listener).
 *   - Consumed by test/setup.ts for test fixture management and table resets.
 */

import { PrismaClient } from '@prisma/client';
import { envConfig } from './env.js';
import { logger } from '../utils/logger.util.js';

// Global declaration to maintain singleton across hot module reloads in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Factory function to instantiate PrismaClient with environment-aware log configuration.
 */
export const createPrismaClient = (): PrismaClient => {
  const isDev = envConfig.NODE_ENV === 'development';
  return new PrismaClient({
    log: isDev ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
};

/**
 * Prisma client singleton instance.
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (envConfig.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Explicitly connects to the database, logging the connection status.
 */
export const connectPrisma = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Successfully connected to PostgreSQL database via Prisma');
  } catch (error) {
    logger.error({ error }, 'Failed to connect to PostgreSQL database');
    throw error;
  }
};

/**
 * Gracefully disconnects PrismaClient and drains the connection pool.
 */
export const disconnectPrisma = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('PrismaClient disconnected successfully');
  } catch (error) {
    logger.error({ error }, 'Error disconnecting PrismaClient');
    throw error;
  }
};

/**
 * Registers process lifecycle termination listeners to ensure database connections
 * are drained and closed cleanly on server or worker shutdown.
 */
export const registerPrismaShutdownHooks = (): void => {
  const shutdownSignals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

  for (const signal of shutdownSignals) {
    process.once(signal, async () => {
      logger.info({ signal }, 'Received termination signal, gracefully disconnecting Prisma...');
      try {
        await disconnectPrisma();
      } finally {
        process.exit(0);
      }
    });
  }
};
