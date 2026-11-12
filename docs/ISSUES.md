# Drips Wave Contributor Issues Catalog 🌊

This document contains pre-scoped, production-ready issues designed for **Drips Wave** (Stellar Wave program) contributors. Each issue provides complete requirements, acceptance criteria, relevant files, and implementation hints so any open-source developer can start immediately without ambiguity.

---

## Issue Index

| ID | Title | Complexity | Wave Points | Category |
| :---: | :--- | :---: | :---: | :--- |
| **WAVE-01** | Add StrKey Checksum Validator Utility for Stellar Addresses | Trivial | 100 pts | Core Utility |
| **WAVE-02** | Comprehensive Zod Schema Validation Unit Test Suite | Trivial | 100 pts | Quality & Testing |
| **WAVE-03** | CSV Export Skeleton for Merchant Payment History | Trivial | 100 pts | Reporting |
| **WAVE-04** | Improve Setup Documentation & Postman / Bruno API Collection | Trivial | 100 pts | Developer Experience |
| **WAVE-05** | Implement Automatic Invoice Expiration Background Job | Medium | 150 pts | Background Jobs |
| **WAVE-06** | Support Partial and Installment Payments in Matcher & Invoices | Medium | 150 pts | Core Accounting |
| **WAVE-07** | Implement In-Memory & Redis-Ready Rate Limiting Middleware | Medium | 150 pts | Security & Middleware |
| **WAVE-08** | Server-Side PDF Receipt Generator for Paid Invoices | Medium | 150 pts | Merchant Tools |
| **WAVE-09** | Dynamic SEP-7 QR Code SVG / PNG Generator Endpoint | Medium | 150 pts | Public Payments |
| **WAVE-10** | Email Notification Service Skeleton for Payment Confirmation | Medium | 150 pts | Notifications |
| **WAVE-11** | Full Support for Path Payments (Strict Receive & Strict Send) | High | 200 pts | Stellar Protocol |
| **WAVE-12** | Multi-Merchant Wallet Architecture using Stellar Muxed Accounts (SEP-23) | High | 200 pts | Scalability & Architecture |
| **WAVE-13** | Webhook Notification System with HMAC-SHA256 Signing & SSRF Protection | High | 200 pts | Integrations & Security |
| **WAVE-14** | Recurring Subscription Invoices Engine | High | 200 pts | Business Automation |

---

## Trivial Complexity Issues (100 Wave Points)

### WAVE-01: Add StrKey Checksum Validator Utility for Stellar Addresses
* **Complexity**: Trivial (100 pts)
* **Estimated Effort**: 2-3 hours
* **Description**:
  Currently, basic address format checking uses a regex in Zod schemas. We need a robust cryptographic validation utility using `@stellar/stellar-sdk`'s `StrKey` module to ensure that all merchant wallet addresses and asset issuers have valid ed25519 public key version bytes and correct CRC16 checksums.
* **Acceptance Criteria**:
  - [ ] Implement `isValidStellarAddress(address: string): boolean` in `src/utils/stellarAddress.util.ts`.
  - [ ] Validates ed25519 public keys (`G...`, 56 characters) with valid checksums.
  - [ ] Handles malformed strings, null, undefined, and invalid lengths gracefully without throwing uncaught exceptions.
  - [ ] Unit tests added in `test/stellarAddress.test.ts` covering valid addresses, corrupted checksums, and secret key strings (`S...`, which must be rejected).
* **Files to Touch**:
  - `src/utils/stellarAddress.util.ts`
  - `test/stellarAddress.test.ts`
* **Hints**:
  Use `StrKey.isValidEd25519PublicKey(address)` from `@stellar/stellar-sdk`. Ensure secret keys (`StrKey.isValidEd25519SecretSeed`) return `false`.

---

### WAVE-02: Comprehensive Zod Schema Validation Unit Test Suite
* **Complexity**: Trivial (100 pts)
* **Estimated Effort**: 2-3 hours
* **Description**:
  The Zod schemas in `src/schemas/index.ts` define the runtime boundary for all API endpoints. We need complete unit test coverage to ensure invalid payloads (negative amounts, invalid date formats, asset codes > 12 characters, decimal overflow > 7 places) are rejected with clear error messages.
* **Acceptance Criteria**:
  - [ ] Create `test/schemas.test.ts`.
  - [ ] Test `CreateInvoiceSchema` with valid payloads, missing fields, malformed amounts, and non-ISO due dates.
  - [ ] Test decimal constraint: reject amounts with > 7 decimal places (e.g. `10.12345678`).
  - [ ] Test `MerchantProfileSchema` with invalid emails and malformed wallet keys.
  - [ ] All tests pass via `npm test`.
* **Files to Touch**:
  - `src/schemas/index.ts`
  - `test/schemas.test.ts`
* **Hints**:
  Use Vitest `expect(() => schema.parse(invalidInput)).toThrow()`. Check `error.errors[0].message`.

---

### WAVE-03: CSV Export Skeleton for Merchant Payment History
* **Complexity**: Trivial (100 pts)
* **Estimated Effort**: 3-4 hours
* **Description**:
  Merchants need to export payment records for accounting and tax reporting. Add a service function and endpoint to stream payment records as formatted CSV text for the authenticated merchant.
* **Acceptance Criteria**:
  - [ ] Add `exportPaymentsCsv(merchantId: string, filter?: PaymentFilterDTO): Promise<string>` in `src/modules/payments/payments.service.ts`.
  - [ ] Expose `GET /api/v1/payments/export/csv` with `Content-Type: text/csv` and `Content-Disposition: attachment; filename="payments-export.csv"`.
  - [ ] CSV columns: `id`, `invoice_reference`, `tx_hash`, `amount`, `asset_code`, `match_result`, `timestamp`.
  - [ ] Amounts formatted as 7-decimal strings; timestamps formatted as ISO-8601 strings.
  - [ ] Tenant isolated: verifies merchant only exports their own payments.
* **Files to Touch**:
  - `src/modules/payments/payments.service.ts`
  - `src/modules/payments/payments.controller.ts`
  - `src/modules/payments/payments.routes.ts`
* **Hints**:
  You can use a lightweight streaming CSV formatter or map over Prisma query records with proper comma escaping and quote wrapping.

---

### WAVE-04: Improve Setup Documentation & Postman / Bruno API Collection
* **Complexity**: Trivial (100 pts)
* **Estimated Effort**: 2-3 hours
* **Description**:
  Create an open-source API collection (Bruno or Postman v2.1) and update documentation to provide ready-to-test example requests for all endpoints.
* **Acceptance Criteria**:
  - [ ] Create `docs/api-collection.json` containing requests for Auth, Merchants, Invoices, Payments, and Dashboard stats.
  - [ ] Include environment variables for `baseUrl` (`http://localhost:4000`) and `apiKey` (`dev-secret-api-key-change-in-production`).
  - [ ] Add instructions to `README.md` explaining how to import and run the collection.
* **Files to Touch**:
  - `docs/api-collection.json`
  - `README.md`
* **Hints**:
  Export clean JSON without hardcoded sensitive tokens. Use standard Bruno or Postman environment variable templates `{{apiKey}}`.

---

## Medium Complexity Issues (150 Wave Points)

### WAVE-05: Implement Automatic Invoice Expiration Background Job
* **Complexity**: Medium (150 pts)
* **Estimated Effort**: 4-6 hours
* **Description**:
  Invoices in `PENDING` or `PARTIALLY_PAID` status must transition to `EXPIRED` once their `dueDate` has passed. Implement the background worker job that runs on a configured interval, updates database records in batch, and logs affected references.
* **Acceptance Criteria**:
  - [ ] Implement `runExpireInvoicesJob(prisma: PrismaClient): Promise<number>` in `src/jobs/expireInvoices.job.ts`.
  - [ ] Queries invoices where `status IN ('PENDING', 'PARTIALLY_PAID') AND dueDate < NOW()`.
  - [ ] Updates status to `EXPIRED` in batches with proper logging.
  - [ ] Emits an event / log entry for each expired invoice.
  - [ ] Unit tests in `test/expireInvoices.test.ts` verifying overdue invoices are marked expired while future invoices remain unchanged.
* **Files to Touch**:
  - `src/jobs/expireInvoices.job.ts`
  - `src/worker.ts`
  - `test/expireInvoices.test.ts`
* **Hints**:
  Use `prisma.invoice.updateMany` with a `where` condition on `dueDate: { lt: new Date() }`. Ensure execution time is tracked in pino logs.

---

### WAVE-06: Support Partial and Installment Payments in Matcher & Invoices
* **Complexity**: Medium (150 pts)
* **Estimated Effort**: 6-8 hours
* **Description**:
  Customers sometimes pay invoices in multiple installments or pay less than the requested amount. The matching engine and payment service must track cumulative amounts paid (`amountPaid`), calculate remaining balance, and update invoice status to `PARTIALLY_PAID` until the final installment completes the balance.
* **Acceptance Criteria**:
  - [ ] In `matcher.service.ts`, calculate `remaining = invoice.amount - invoice.amountPaid`.
  - [ ] If payment amount < remaining: matchResult is `UNDERPAID`, newStatus is `PARTIALLY_PAID`, `newTotalPaid = amountPaid + payment.amount`.
  - [ ] If subsequent payment == remaining: matchResult is `MATCHED`, newStatus is `PAID`.
  - [ ] If payment > remaining: matchResult is `OVERPAID`, newStatus is `OVERPAID`.
  - [ ] Comprehensive unit tests in `test/matcher.test.ts` verifying multiple partial payment sequences.
* **Files to Touch**:
  - `src/stellar/matcher/matcher.service.ts`
  - `src/modules/invoices/invoices.service.ts`
  - `test/matcher.test.ts`
* **Hints**:
  Always use `Decimal(invoice.amount).minus(Decimal(invoice.amountPaid))` rather than JS subtraction.

---

### WAVE-07: Implement In-Memory & Redis-Ready Rate Limiting Middleware
* **Complexity**: Medium (150 pts)
* **Estimated Effort**: 4-5 hours
* **Description**:
  Public endpoints (such as `GET /api/v1/invoices/public/:reference`) can be abused for enumeration or denial-of-service. Implement configurable IP rate-limiting middleware that provides standard headers (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`) and returns HTTP 429 when breached.
* **Acceptance Criteria**:
  - [ ] Configure `express-rate-limit` middleware in `src/middleware/rateLimit.middleware.ts`.
  - [ ] Set distinct limits: strict for unauthenticated public routes (e.g. 30 req/min), standard for merchant routes (e.g. 120 req/min).
  - [ ] Returns structured JSON error: `{ "error": "Too Many Requests", "retryAfter": ... }`.
  - [ ] Unit / integration test in `test/rateLimit.test.ts` validating that limit triggers HTTP 429.
* **Files to Touch**:
  - `src/middleware/rateLimit.middleware.ts`
  - `src/server.ts`
  - `test/rateLimit.test.ts`
* **Hints**:
  Use `express-rate-limit` standard configuration options with custom handlers returning structured JSON error payloads.

---

### WAVE-08: Server-Side PDF Receipt Generator for Paid Invoices
* **Complexity**: Medium (150 pts)
* **Estimated Effort**: 6-8 hours
* **Description**:
  Merchants and customers need professional downloadable PDF receipts for tax records once an invoice is marked `PAID`. Add a server-side PDF generator that outputs clean receipts including line items, transaction hash, Stellar ledger timestamp, and merchant branding.
* **Acceptance Criteria**:
  - [ ] Implement receipt generator in `src/modules/invoices/receipt.service.ts`.
  - [ ] Route `GET /api/v1/invoices/:id/receipt` returning `application/pdf`.
  - [ ] Includes: Merchant name, Customer name, Invoice reference, Issue date, Paid date, Stellar TX hash (with Stellar.expert explorer link), Line items, Total amount in crypto and asset code.
  - [ ] Returns 400 Bad Request if invoice is not yet in `PAID` or `OVERPAID` status.
* **Files to Touch**:
  - `src/modules/invoices/receipt.service.ts`
  - `src/modules/invoices/invoices.controller.ts`
  - `src/modules/invoices/invoices.routes.ts`
* **Hints**:
  Use `pdfkit` or `@react-pdf/renderer` in a headless Node environment. Keep bundle dependencies lightweight.

---

### WAVE-09: Dynamic SEP-7 QR Code SVG / PNG Generator Endpoint
* **Complexity**: Medium (150 pts)
* **Estimated Effort**: 4-5 hours
* **Description**:
  Mobile crypto wallets scan QR codes to pay. Create a fast server endpoint that generates QR code images encoding the invoice's SEP-7 URI (`web+stellar:pay?...`) for easy embedding into payment pages or emails.
* **Acceptance Criteria**:
  - [ ] Endpoint `GET /api/v1/invoices/public/:reference/qr` returns SVG or PNG image.
  - [ ] Encodes the exact SEP-7 payment URI with correct error correction level (Level M or Q).
  - [ ] Sets appropriate caching headers (`Cache-Control: public, max-age=3600`).
  - [ ] Rate-limited via public rate limiter.
  - [ ] Unit tests confirming valid SVG output string.
* **Files to Touch**:
  - `src/modules/invoices/invoices.controller.ts`
  - `src/modules/invoices/invoices.routes.ts`
  - `src/stellar/paymentUri/paymentUri.service.ts`
* **Hints**:
  Use `qrcode` npm package (`QRCode.toString(uri, { type: 'svg' })`).

---

### WAVE-10: Email Notification Service Skeleton for Payment Confirmation
* **Complexity**: Medium (150 pts)
* **Estimated Effort**: 5-6 hours
* **Description**:
  When an invoice is paid, merchants and customers need an email confirmation. Create an email notification service with an abstracted transport interface (e.g. SendGrid, Resend, or local SMTP console logger) triggered upon successful payment settlement.
* **Acceptance Criteria**:
  - [ ] Create `src/modules/notifications/email.service.ts` with `sendInvoicePaidEmail(...)`.
  - [ ] Abstract transport provider interface (`IEmailProvider`) with a `ConsoleEmailProvider` for local dev.
  - [ ] Clean HTML email template with invoice reference, amount, paid timestamp, and txHash link.
  - [ ] Hook into the payment matching database transaction or event emitter.
* **Files to Touch**:
  - `src/modules/notifications/email.service.ts`
  - `src/stellar/listener/listener.service.ts`
* **Hints**:
  Ensure email failures do NOT roll back or abort the database payment transaction. Use fire-and-forget or a resilient background queue.

---

## High Complexity Issues (200 Wave Points)

### WAVE-11: Full Support for Path Payments (Strict Receive & Strict Send)
* **Complexity**: High (200 pts)
* **Estimated Effort**: 10-14 hours
* **Description**:
  Stellar supports path payments where a sender pays with Asset A and the recipient receives Asset B through automated on-chain orderbook conversion. The chain reader and payment matcher must correctly extract the **destination asset**, **destination amount**, and receiving account from path payment operations (`pathPaymentStrictReceive` and `pathPaymentStrictSend`) rather than assuming plain payment operations.
* **Acceptance Criteria**:
  - [ ] Update `src/stellar/chainReader/horizonReader.ts` to parse `path_payment_strict_receive` and `path_payment_strict_send` operation types.
  - [ ] Extract destination asset code, issuer, and `dest_amount` as the normalized payment attributes.
  - [ ] Add unit test fixtures in `test/matcher.test.ts` simulating path payment operations.
  - [ ] Ensure matcher correctly validates destination asset against invoice asset requirements.
* **Files to Touch**:
  - `src/stellar/chainReader/horizonReader.ts`
  - `src/stellar/chainReader/rpcReader.ts`
  - `src/stellar/matcher/matcher.service.ts`
  - `test/matcher.test.ts`
* **Hints**:
  In Horizon, check `op.type === 'path_payment_strict_receive'` and read `op.dest_asset_code`, `op.dest_asset_issuer`, and `op.dest_amount`. Note that native XLM has `dest_asset_type === 'native'`.

---

### WAVE-12: Multi-Merchant Wallet Architecture using Stellar Muxed Accounts (SEP-23)
* **Complexity**: High (200 pts)
* **Estimated Effort**: 12-16 hours
* **Description**:
  Currently, invoices share a platform wallet or require distinct Stellar addresses. Stellar SEP-23 Muxed Accounts (`M...` addresses) allow a single base account to encode a 64-bit integer ID inside the address itself. This eliminates memo dependency for payment routing, freeing the memo for customer notes and preventing lost payments from missing memos.
* **Acceptance Criteria**:
  - [ ] Add utility in `src/utils/muxedAccount.util.ts` to derive `M...` addresses from base `G...` keys and 64-bit merchant/invoice IDs.
  - [ ] Update `paymentUri.service.ts` to support generating SEP-7 URIs pointing to muxed accounts.
  - [ ] Update `chainReader` to extract destination muxed account IDs.
  - [ ] Fallback routing: If muxed ID is present, route invoice by ID; if not, fallback to reference memo.
  - [ ] Comprehensive unit tests with valid SEP-23 test vectors.
* **Files to Touch**:
  - `src/utils/muxedAccount.util.ts`
  - `src/stellar/paymentUri/paymentUri.service.ts`
  - `src/stellar/chainReader/horizonReader.ts`
  - `test/muxedAccount.test.ts`
* **Hints**:
  Use `MuxedAccount` from `@stellar/stellar-sdk`. Verify med25519 encoding specification (SEP-0023).

---

### WAVE-13: Webhook Notification System with HMAC-SHA256 Signing & SSRF Protection
* **Complexity**: High (200 pts)
* **Estimated Effort**: 12-16 hours
* **Description**:
  Implement a production-grade webhook delivery system that dispatches HTTP events to merchant servers upon payment state transitions. Must include cryptographic HMAC-SHA256 signatures, exponential backoff retry schedules, and strict Server-Side Request Forgery (SSRF) defense.
* **Acceptance Criteria**:
  - [ ] Implement `webhooks.service.ts` with enqueue and dispatch methods.
  - [ ] Header `X-StellarInvoice-Signature` with `sha256=hex(HMAC_SHA256(secret, payload))`.
  - [ ] Header `X-StellarInvoice-Timestamp` to protect against replay attacks.
  - [ ] **SSRF Defense**: Reject URLs that resolve to loopback (`127.0.0.1`), private RFC1918 blocks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), or link-local/cloud metadata (`169.254.169.254`). Only HTTPS permitted in production.
  - [ ] Background retry job (`src/jobs/retryWebhooks.job.ts`) with exponential backoff (e.g. 1m, 5m, 15m, 1h).
  - [ ] Unit & security tests in `test/webhooks.test.ts`.
* **Files to Touch**:
  - `src/modules/webhooks/webhooks.service.ts`
  - `src/jobs/retryWebhooks.job.ts`
  - `src/worker.ts`
  - `test/webhooks.test.ts`
* **Hints**:
  Use `ipaddr.js` or `ip` to validate resolved DNS addresses before initiating HTTP requests to guard against DNS rebinding SSRF.

---

### WAVE-14: Recurring Subscription Invoices Engine
* **Complexity**: High (200 pts)
* **Estimated Effort**: 12-16 hours
* **Description**:
  Many merchants bill customers on a recurring cadence (monthly, quarterly, annually). Design and implement a recurring billing schedule engine that automatically generates new invoices before each billing cycle, notifies customers, and tracks subscription status.
* **Acceptance Criteria**:
  - [ ] Add Prisma models `Subscription` and `SubscriptionCadence` (`WEEKLY`, `MONTHLY`, `YEARLY`).
  - [ ] Background job in `src/jobs/recurringInvoices.job.ts` that triggers 3 days before renewal date to generate the next invoice.
  - [ ] Links child invoices to parent `subscriptionId`.
  - [ ] Automatically updates subscription status to `ACTIVE` upon payment, or `PAST_DUE` if previous invoice expires unpaid.
  - [ ] Integration tests verifying recurring invoice generation over time simulation.
* **Files to Touch**:
  - `prisma/schema.prisma`
  - `src/jobs/recurringInvoices.job.ts`
  - `src/modules/invoices/invoices.service.ts`
  - `test/recurring.test.ts`
* **Hints**:
  Ensure idempotency so the background job cannot generate duplicate invoices for the same billing period if run multiple times.
