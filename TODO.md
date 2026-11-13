# StellarInvoice Backend Implementation Roadmap & Build Checklist 📋

This document tracks the phased 100-step micro-implementation order for the standalone StellarInvoice backend.
For the complete granular breakdown, see [100_step_implementation_plan.md](file:///C:/Users/mhizd/.gemini/antigravity/brain/534763cf-6c2b-4fba-afb7-72a14afd2592/100_step_implementation_plan.md).

---

## 100-Step Incremental Build Plan

### Stage 1: Environment, Configuration & Utilities (Steps 1–12)
- [x] **Step 01**: Define `envSchema` in `src/config/env.ts` for server settings (`PORT`, `HOST`, `NODE_ENV`).
- [x] **Step 02**: Add database URLs (`DATABASE_URL`, `DIRECT_URL`) and auth variables to `src/config/env.ts`.
- [ ] **Step 03**: Add Stellar network variables (`STELLAR_NETWORK`, `HORIZON_URL`, `PLATFORM_WALLET_PUBLIC_ADDRESS`) to `src/config/env.ts`.
- [ ] **Step 04**: Implement `loadEnvConfig()` function in `src/config/env.ts` with fail-fast validation.
- [ ] **Step 05**: Implement structured pino logger in `src/utils/logger.util.ts`.
- [ ] **Step 06**: Implement sensitive field redaction in `src/utils/logger.util.ts` (masking Authorization tokens and API keys).
- [ ] **Step 07**: Implement Decimal arithmetic wrapper in `src/utils/amount.util.ts` for safe string-to-Decimal parsing (`toDecimal`).
- [ ] **Step 08**: Implement 7-decimal place string formatter `formatStellarAmount(val)` in `src/utils/amount.util.ts`.
- [ ] **Step 09**: Implement Decimal comparison helpers (`isEqualAmount`, `isLessThan`, `isGreaterThan`) in `src/utils/amount.util.ts`.
- [ ] **Step 10**: Write unit tests in `test/amount.test.ts` verifying zero floating-point rounding drift.
- [ ] **Step 11**: Implement 10-character collision-resistant random reference generator (`INV-XXXXXX`) in `src/utils/reference.util.ts`.
- [ ] **Step 12**: Write unit tests in `test/reference.test.ts` verifying UTF-8 byte length is strictly $\le 28$ bytes.

### Stage 2: Database, Prisma & Migrations (Steps 13–22)
- [ ] **Step 13**: Set up local PostgreSQL container via `docker-compose.yml` and test database connectivity.
- [ ] **Step 14**: Define `InvoiceStatus`, `PaymentMatchResult`, and `WebhookStatus` enums in `prisma/schema.prisma`.
- [ ] **Step 15**: Define `Merchant` model in `prisma/schema.prisma` with `authUserId` unique constraint.
- [ ] **Step 16**: Define `Customer` model in `prisma/schema.prisma` with cascade relation to `Merchant`.
- [ ] **Step 17**: Define `Invoice` and `InvoiceItem` models with `Decimal(20, 7)` precision and index on `(merchantId, status)`.
- [ ] **Step 18**: Define `Payment` model with composite unique constraint `@@unique([txHash, operationIndex])`.
- [ ] **Step 19**: Define `ListenerState` model for stream cursor tracking and `WebhookEvent` model for notifications.
- [ ] **Step 20**: Execute initial Prisma migration `npx prisma migrate dev --name init`.
- [ ] **Step 21**: Implement `PrismaClient` singleton with graceful disconnection hooks in `src/config/prisma.ts`.
- [ ] **Step 22**: Create database test helper in `test/setup.ts` to reset test tables between test suites.

### Stage 3: Stellar Core Utilities & StrKey Validation (Steps 23–30)
- [ ] **Step 23**: Implement `isValidStellarAddress(address)` in `src/utils/stellarAddress.util.ts` using `@stellar/stellar-sdk` `StrKey`.
- [ ] **Step 24**: Verify that secret seeds (`S...`) are strictly rejected by `isValidStellarAddress`.
- [ ] **Step 25**: Implement Stellar network passphrase resolver in `src/config/stellar.ts` (Public vs Testnet).
- [ ] **Step 26**: Register official Testnet USDC issuer in `src/config/stellar.ts`.
- [ ] **Step 27**: Write unit tests in `test/stellarAddress.test.ts` testing valid and corrupted public keys.
- [ ] **Step 28**: Implement SEP-7 URI builder helper in `src/stellar/paymentUri/paymentUri.service.ts` for native XLM.
- [ ] **Step 29**: Extend SEP-7 URI builder to support non-native assets (`asset_code` and `asset_issuer` query params).
- [ ] **Step 30**: Write unit tests verifying that SEP-7 links match the standard `web+stellar:pay?destination=...&amount=...&memo=...`.

### Stage 4: Authentication & Tenant Middleware (Steps 31–40)
- [ ] **Step 31**: Define `IAuthProvider` interface in `src/modules/auth/auth.interface.ts`.
- [ ] **Step 32**: Implement `ApiKeyAuthProvider` in `src/modules/auth/auth.service.ts` checking `DEV_API_KEY` or merchant API keys.
- [ ] **Step 33**: Implement `SupabaseAuthProvider` in `src/modules/auth/auth.service.ts` for JWT verification.
- [ ] **Step 34**: Implement auth provider factory in `src/modules/auth/auth.service.ts` switching based on `AUTH_MODE`.
- [ ] **Step 35**: Implement `authMiddleware` in `src/middleware/auth.middleware.ts` extracting Bearer token or `X-API-Key`.
- [ ] **Step 36**: Attach authenticated `merchantId` and `authUserId` to Express `req.user`.
- [ ] **Step 37**: Implement Zod validation middleware `validateBody(schema)` in `src/middleware/validate.middleware.ts`.
- [ ] **Step 38**: Implement centralized error handling middleware in `src/middleware/errorHandler.middleware.ts`.
- [ ] **Step 39**: Mount global middleware (helmet, cors, pino-http, errorHandler) in `src/server.ts`.
- [ ] **Step 40**: Write integration tests in `test/auth.test.ts` verifying protected endpoints reject missing/invalid tokens with 401.

### Stage 5: Merchants & Customers Modules (Steps 41–50)
- [ ] **Step 41**: Define `MerchantProfileSchema` and `UpdateWalletSchema` in `src/schemas/index.ts`.
- [ ] **Step 42**: Implement `getProfile(merchantId)` in `src/modules/merchants/merchants.service.ts`.
- [ ] **Step 43**: Implement `updateWalletAddress(merchantId, newAddress)` in `src/modules/merchants/merchants.service.ts`.
- [ ] **Step 44**: Implement `merchants.controller.ts` handling `GET /api/v1/merchants/profile` and `PUT /api/v1/merchants/wallet`.
- [ ] **Step 45**: Wire up `src/modules/merchants/merchants.routes.ts` with auth middleware.
- [ ] **Step 46**: Define `CreateCustomerSchema` in `src/schemas/index.ts`.
- [ ] **Step 47**: Implement `createCustomer(merchantId, data)` in `src/modules/customers/customers.service.ts`.
- [ ] **Step 48**: Implement `listCustomers(merchantId)` with pagination in `src/modules/customers/customers.service.ts`.
- [ ] **Step 49**: Implement `customers.controller.ts` and `customers.routes.ts`.
- [ ] **Step 50**: Write integration tests verifying Merchant A cannot view or edit Merchant B's customer records.

### Stage 6: Invoice Lifecycle & Public Checkout (Steps 51–62)
- [ ] **Step 51**: Define `CreateInvoiceSchema` in `src/schemas/index.ts` with line items and decimal amount validation.
- [ ] **Step 52**: Implement reference collision retry loop in `src/modules/invoices/invoices.service.ts`.
- [ ] **Step 53**: Implement `createInvoice(merchantId, dto)` creating invoice in `PENDING` status with line items.
- [ ] **Step 54**: Generate and attach SEP-7 `paymentLink` automatically on invoice creation.
- [ ] **Step 55**: Implement `getInvoiceById(merchantId, invoiceId)` in `src/modules/invoices/invoices.service.ts`.
- [ ] **Step 56**: Implement `listInvoices(merchantId, statusFilter)` in `src/modules/invoices/invoices.service.ts`.
- [ ] **Step 57**: Implement `cancelInvoice(merchantId, invoiceId)` allowing cancellation only for `PENDING` invoices.
- [ ] **Step 58**: Implement `getPublicInvoiceByReference(reference)` returning sanitized public invoice details (no secret data).
- [ ] **Step 59**: Implement `invoices.controller.ts` mapping request bodies to service calls.
- [ ] **Step 60**: Wire up authenticated merchant routes in `src/modules/invoices/invoices.routes.ts`.
- [ ] **Step 61**: Expose `GET /api/v1/invoices/public/:reference` with rate limiting.
- [ ] **Step 62**: Write tests in `test/invoices.test.ts` testing invoice creation, reference generation, and cancellation transitions.

### Stage 7: Pure Payment Matcher & Unit Tests (Steps 63–75)
- [ ] **Step 63**: Define pure evaluation input and output interfaces in `src/stellar/matcher/matcher.types.ts`.
- [ ] **Step 64**: Implement Rule 1 in `src/stellar/matcher/matcher.service.ts`: Return `NO_MEMO` if memo is missing or empty.
- [ ] **Step 65**: Implement Rule 2: Return `UNKNOWN` if memo does not match any known invoice reference.
- [ ] **Step 66**: Implement Rule 3: Return `WRONG_ASSET` if `payment.assetCode !== invoice.assetCode`.
- [ ] **Step 67**: Implement Rule 4: Return `WRONG_ASSET` if non-native asset issuer does not match `invoice.assetIssuer`.
- [ ] **Step 68**: Implement Rule 5: Calculate remaining balance `remaining = invoice.amount - invoice.amountPaid`.
- [ ] **Step 69**: Implement Rule 6: If `payment.amount == remaining`, return `MATCHED` with `newStatus: PAID`.
- [ ] **Step 70**: Implement Rule 7: If `payment.amount < remaining`, return `UNDERPAID` with `newStatus: PARTIALLY_PAID`.
- [ ] **Step 71**: Implement Rule 8: If `payment.amount > remaining`, return `OVERPAID` with `newStatus: OVERPAID`.
- [ ] **Step 72**: Implement Rule 9: Handle payments on `EXPIRED` invoices (flag for review, mark `PAID`).
- [ ] **Step 73**: Implement Rule 10: Handle payments on `CANCELLED` invoices (flag for manual merchant review/refund).
- [ ] **Step 74**: Write unit tests in `test/matcher.test.ts` for valid payments, underpayments, overpayments, and wrong assets.
- [ ] **Step 75**: Write unit tests in `test/matcher.test.ts` specifically verifying spoofed token issuer rejection.

### Stage 8: ChainReader Interface & Horizon SSE Driver (Steps 76–83)
- [ ] **Step 76**: Define `NormalizedChainPayment` and `IChainReader` interface in `src/stellar/chainReader/chainReader.interface.ts`.
- [ ] **Step 77**: Initialize `@stellar/stellar-sdk` `Horizon.Server` in `src/stellar/chainReader/horizonReader.ts`.
- [ ] **Step 78**: Implement payment extraction logic normalizing Horizon payment operations to `NormalizedChainPayment`.
- [ ] **Step 79**: Implement transaction memo extraction handling multi-operation transactions in `horizonReader.ts`.
- [ ] **Step 80**: Implement `streamPayments(accountAddress, cursor, onPayment, onError)` using Horizon SSE stream.
- [ ] **Step 81**: Implement `fetchRecentPayments(accountAddress, limit)` in `horizonReader.ts` for reconciliation queries.
- [ ] **Step 82**: Implement chain reader driver factory in `src/stellar/chainReader/index.ts` resolving `horizon` or `rpc`.
- [ ] **Step 83**: Add unit test mocks in `test/chainReader.test.ts` validating transaction memo and operation index normalization.

### Stage 9: Streaming Listener & Atomic Settlement (Steps 84–90)
- [ ] **Step 84**: Implement cursor retrieval `getLastCursor(streamName)` from `ListenerState` in `src/stellar/listener/listener.service.ts`.
- [ ] **Step 85**: Implement idempotency check querying `Payment` by `(txHash, operationIndex)`.
- [ ] **Step 86**: Wire incoming payment stream to `MatcherService.evaluate(invoice, payment)`.
- [ ] **Step 87**: Construct atomic database transaction: insert `Payment`, update `Invoice`, and update `ListenerState.lastCursor`.
- [ ] **Step 88**: Handle duplicate insertion constraint errors (`P2002`) gracefully without crashing the listener stream.
- [ ] **Step 89**: Implement reconnection backoff loop with exponential delays on SSE disconnects.
- [ ] **Step 90**: Implement health endpoint `GET /health/listener` in `src/server.ts` reporting active cursor and stream status.

### Stage 10: Fallback Reconciler & Background Jobs (Steps 91–96)
- [ ] **Step 91**: Implement `ReconcilerService.runSweep()` in `src/stellar/reconciler/reconciler.service.ts` querying recent ledgers.
- [ ] **Step 92**: Filter out already-persisted payments and process missed operations through the matcher pipeline.
- [ ] **Step 93**: Implement `runExpireInvoicesJob()` in `src/jobs/expireInvoices.job.ts` marking overdue invoices as `EXPIRED`.
- [ ] **Step 94**: Implement `runRemindersJob()` in `src/jobs/reminders.job.ts` logging invoices due within 24 hours.
- [ ] **Step 95**: Wire up background runner in `src/worker.ts` starting the listener, reconciler interval, and expiry cron.
- [ ] **Step 96**: Implement graceful shutdown (closing DB connections and stream subscriptions) on `SIGINT` / `SIGTERM`.

### Stage 11: Dashboard, Hardening & Verification (Steps 97–100)
- [ ] **Step 97**: Implement `getDashboardStats(merchantId)` in `src/modules/dashboard/dashboard.service.ts` (earned, pending, overdue).
- [ ] **Step 98**: Expose `GET /api/v1/dashboard/stats` in `src/modules/dashboard/dashboard.routes.ts`.
- [ ] **Step 99**: Implement manual payment assignment endpoint `POST /api/v1/payments/:id/assign` for unmatched payments.
- [ ] **Step 100**: Run full test suite (`npm test`), lint check (`npm run lint`), and verify `curl http://localhost:4000/health`.
