/**
 * @file apps/api/src/modules/customers/customers.service.ts
 * @summary Business logic for customer record creation, listing, and updates.
 * 
 * Purpose:
 *   Maintains merchant customer directories for invoicing history and CRM linkage.
 *   Strictly enforces merchant tenant scoping.
 * 
 * Inputs:
 *   - Customer data DTOs and active merchantId.
 * 
 * Outputs:
 *   - Customer records from the database.
 * 
 * Interacting Modules:
 *   - Prisma client from config/prisma.ts.
 *   - Called by customers.controller.ts.
 */

