/**
 * @file apps/api/src/modules/invoices/invoices.service.ts
 * @summary Business logic for invoice generation, lifecycle transitions, and SEP-7 payment URI creation.
 * 
 * Purpose:
 *   - Generates unique short references (<= 28 bytes) for transaction memo matching.
 *   - Creates invoices in PENDING status with exact Decimal amounts.
 *   - Generates SEP-7 payment URIs for one-click wallet payments.
 *   - Handles invoice cancellation, status queries, and public invoice retrieval.
 * 
 * Inputs:
 *   - CreateInvoiceDTO, merchantId, status filters, reference string.
 * 
 * Outputs:
 *   - Invoice database models with associated line items and payments.
 * 
 * Interacting Modules:
 *   - utils/reference.util.ts for collision-resistant short reference codes.
 *   - stellar/paymentUri/paymentUri.service.ts for SEP-7 links.
 *   - config/prisma.ts for database persistence.
 *   - Called by invoices.controller.ts and matcher.service.ts.
 */

