# Contributing to StellarInvoice 🤝

Welcome to StellarInvoice! We are excited to build an open-source, non-custodial crypto invoicing standard for the Stellar network.

Whether you are fixing a bug, adding new features, improving documentation, or working on a **Drips Wave** task, we appreciate your contributions.

---

## 1. Drips Wave Contributor Notice 🌊

StellarInvoice participates in the **Drips Wave** developer incentive program. If you are picking up an open issue for Wave points:
1. Browse issues marked with the **`wave-bounty`** label or consult [docs/ISSUES.md](file:///docs/ISSUES.md).
2. Comment on the issue you wish to claim before starting work.
3. **No untested or low-quality LLM-generated code**: PRs containing untested, unverified, or hallucinated AI code will be rejected immediately. Every contribution must include tests and maintain our high security and code quality standards.
4. Ensure you understand every line of code submitted. You may be asked to explain design decisions in code review.

---

## 2. Development Setup

Contributors should be able to get up and running locally in about 10 minutes:

1. **Fork and clone**:
   ```bash
   git clone https://github.com/<your-username>/stellar-invoice.git
   cd stellar-invoice
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start local PostgreSQL**:
   ```bash
   npm run db:up
   ```
4. **Setup environment variables**:
   ```bash
   cp .env.example .env
   ```
5. **Run Prisma migrations**:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```
6. **Start local services**:
   ```bash
   npm run dev:server   # Starts REST API on http://localhost:4000
   npm run dev:worker   # Starts payment listener & background jobs
   ```

---

## 3. Core Development Rules

Please adhere to these critical design principles:

1. **Non-Custodial Integrity**:
   - **NEVER** handle private keys (`S...` seeds). Only public addresses (`G...`) are stored or processed.
2. **Precision Accounting**:
   - **NEVER** use native JavaScript floating-point numbers (`number`) for financial sums or crypto amounts. Always use `Decimal` (from `decimal.js` or Prisma `Decimal`) to avoid IEEE 754 precision drift.
3. **Strict Asset Validation**:
   - For all non-native assets (e.g. USDC), validate **both** `asset_code` AND `asset_issuer`.
4. **Idempotency Guarantee**:
   - Multi-step payment matching and status updates must execute within atomic database transactions (`prisma.$transaction`).
   - Honor the `(tx_hash, operation_index)` unique constraint.
5. **Clean Code & Test Coverage**:
   - All new features and bug fixes require corresponding unit or integration tests in Vitest.
   - Code must pass ESLint, Prettier, and TypeScript checks without errors:
     ```bash
     npm run lint
     npm run typecheck
     npm run test
     ```

---

## 4. Submitting a Pull Request

1. Create a descriptive branch:
   ```bash
   git checkout -b feat/add-stellar-address-validator
   ```
2. Keep commits atomic and write clear commit messages:
   ```bash
   git commit -m "feat(utils): implement StrKey checksum validator for G... addresses"
   ```
3. Run the validation suite locally:
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   ```
4. Push to your fork and open a Pull Request against `main`.
5. Fill out the Pull Request template thoroughly.

---

## 5. Community & Conduct

All contributors are expected to uphold our [Code of Conduct](file:///CODE_OF_CONDUCT.md). Be respectful, constructive, and collaborative.
