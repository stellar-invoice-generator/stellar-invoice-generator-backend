# StellarInvoice 🌟🧾

> **Non-custodial, open-source crypto invoicing and automated payment settlement backend for the Stellar network.**

[![CI](https://github.com/stellar-invoice/stellar-invoice/actions/workflows/ci.yml/badge.svg)](https://github.com/stellar-invoice/stellar-invoice/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Stellar](https://img.shields.io/badge/Stellar-Testnet%20%7C%20Public-informational)](https://stellar.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org)

---

## 🔒 Non-Custodial Guarantee
> **CRITICAL SECURITY PROMISE**: StellarInvoice **NEVER** generates, requests, stores, or handles private keys, seed phrases, or custodial secret seeds (`S...`). 
> 
> The platform operates strictly by watching public Stellar addresses (`G...`) on-chain. Customers pay directly from their own self-custodial wallets (e.g. Freighter, LOBSTR) to the destination wallet. The backend acts solely as an automated observer, reconciler, and state coordinator.

---

## 1. Overview & Problem Statement

### The Problem
Accepting cryptocurrency for e-commerce, software subscriptions, or freelance services on traditional blockchains often suffers from:
1. **High transaction fees and slow finality**: Bitcoin and Ethereum settlement times and gas fees make micro-payments and small invoices impractical.
2. **Custodial risk**: Centralized processors hold merchant funds, introduce KYC friction, freeze accounts, and charge 1-3% processing cuts.
3. **Manual payment reconciliation**: Merchants frequently waste hours matching raw wallet transactions against customer orders, prone to human error and accounting discrepancies.

### The Solution: StellarInvoice Backend
StellarInvoice leverages the high-speed (3-5 second finality) and near-zero fees (~0.00001 XLM) of the **Stellar network**:
* **Instant Invoice Generation**: Creates an invoice with a cryptographically unique 28-byte short reference code (e.g. `INV-8F3K2A`).
* **SEP-7 Direct Payment Links**: Generates standardized `web+stellar:pay` links and QR codes pre-filling destination, amount, and the invoice reference in the transaction memo.
* **Automated On-Chain Streaming Listener**: Subscribes to incoming payments via a pluggable chain reader interface, detects the payment in real time, and runs deterministic matching rules.
* **Atomic State Updates & Idempotency**: Updates invoices from `PENDING` to `PAID` within a single database transaction, guarding against double-counting via `(tx_hash, operation_index)` unique constraints.
* **Safety Net Reconciler**: Runs periodic sweeps over recent ledgers to catch any transactions dropped during network disruptions or stream reconnections.

---

## 2. System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer["Client & Wallet Layer"]
        Merchant["Merchant Client / Dashboard"]
        Customer["Customer Wallet (Freighter / LOBSTR / xBull)"]
    end

    subgraph StellarNetwork["Stellar Network (Testnet / Mainnet)"]
        Ledger["Stellar Ledger Consensus"]
        Horizon["Horizon REST / SSE Stream"]
        RPC["Stellar RPC (JSON-RPC)"]
    end

    subgraph BackendAPI["StellarInvoice Backend Core"]
        API["Express REST API (src/server.ts)"]
        Worker["Background Worker (src/worker.ts)"]
        
        subgraph WorkerEngine["Payment Detection Engine"]
            ChainReader["chainReader (Horizon / RPC Driver)"]
            Listener["Streaming Listener"]
            Reconciler["Fallback Reconciler"]
            Matcher["Pure Payment Matcher"]
        end
        
        Jobs["Background Jobs (Expiry, Reminders, Webhooks)"]
    end

    subgraph DataStore["Database Layer (PostgreSQL)"]
        DB[("PostgreSQL / Prisma ORM<br/>Merchants, Invoices, Payments, ListenerState")]
    end

    Merchant -->|1. Create Invoice| API
    API -->|Save Invoice & Memo| DB
    API -->|2. Return SEP-7 URI| Merchant
    Merchant -.->|Share Payment Link| Customer
    Customer -->|3. Submit TX with Memo| Ledger
    
    Ledger --> Horizon
    Ledger --> RPC
    
    Horizon & RPC --> ChainReader
    ChainReader --> Listener
    ChainReader --> Reconciler
    
    Listener & Reconciler -->|4. Normalize Operation| Matcher
    Matcher -->|5. Atomic Payment Record & Status Update| DB
    Worker --> Jobs
    Jobs -->|Expire overdue invoices| DB
```

---

## 3. End-to-End Payment Detection Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer (Wallet)
    participant Stellar as Stellar Network
    participant Listener as Chain Listener
    participant Matcher as Pure Matcher
    participant DB as PostgreSQL (Prisma)
    participant Merchant as Merchant System

    Customer->>Stellar: Submit Payment (Amount, Asset, Memo: "INV-8F3K2A")
    Stellar-->>Listener: Emit Payment Operation (txHash, opIndex, asset, amount, memo)
    
    critical Atomic Database Transaction
        Listener->>DB: Check idempotency (txHash + opIndex)
        alt Already processed
            Listener-->>Listener: Skip (Idempotent bypass)
        else New payment operation
            Listener->>DB: Query Invoice by Memo Reference ("INV-8F3K2A")
            Listener->>Matcher: Evaluate(Invoice, Payment)
            Matcher-->>Listener: Result (MATCHED / UNDERPAID / WRONG_ASSET)
            Listener->>DB: Insert Payment record
            Listener->>DB: Update Invoice Status (PENDING -> PAID)
            Listener->>DB: Update ListenerState cursor
        end
    end

    opt Merchant Webhooks Configured
        Listener->>Merchant: POST /webhook (event: "invoice.paid", HMAC-signed)
    end
```

---

## 4. Repository Layout (Standalone Backend)

```
├── prisma/
│   ├── schema.prisma             → PostgreSQL database schema
│   └── migrations/               → Prisma migration history
├── src/
│   ├── config/                   → Zod env validation, Stellar network config, Prisma singleton
│   ├── modules/
│   │   ├── auth/                 → Merchant auth (pluggable: API key or Supabase JWT)
│   │   ├── merchants/            → Profiles, Stellar wallet addresses (G...)
│   │   ├── customers/            → Customer records
│   │   ├── invoices/             → Invoice lifecycle, 28-byte reference, SEP-7 links
│   │   ├── payments/             → Payment auditing & manual reassignment
│   │   ├── dashboard/            → Financial stats & asset volume metrics
│   │   └── webhooks/             → Outgoing signed webhooks with SSRF guard
│   ├── stellar/
│   │   ├── chainReader/          → Pluggable chain reader (Horizon SSE / Stellar RPC)
│   │   ├── listener/             → Live payment streaming daemon
│   │   ├── matcher/              → Pure deterministic payment matching engine
│   │   ├── paymentUri/           → SEP-7 link builder (web+stellar:pay)
│   │   └── reconciler/           → Periodic missed payment sweeper
│   ├── jobs/                     → Expiration sweeps, reminders, webhook retries
│   ├── middleware/               → Auth guard, Zod validator, rate limiters, error handling
│   ├── types/                    → Core TypeScript interfaces & domain enums
│   ├── schemas/                  → Shared Zod request schemas
│   ├── utils/                    → Reference generator, Decimal math, pino logger
│   ├── server.ts                 → REST API entry point
│   └── worker.ts                 → Listener, reconciler, and background jobs entry point
├── test/                         → Vitest test suites (matcher, math, auth, reference)
├── docs/                         → Architecture docs, matching guide, Wave issues
├── .github/workflows/            → CI automation
├── docker-compose.yml            → Local PostgreSQL container
└── package.json, tsconfig.json
```

---

## 5. Getting Started (Local Setup in 10 Minutes)

StellarInvoice is designed so any open-source contributor can run the full backend locally in under 10 minutes without external accounts or third-party paid subscriptions.

### Prerequisites
* [Node.js](https://nodejs.org/) (v20 LTS or higher)
* [Docker Desktop](https://www.docker.com/) (for PostgreSQL)

### Step-by-Step Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/stellar-invoice/stellar-invoice.git
   cd stellar-invoice
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure local environment**:
   ```bash
   cp .env.example .env
   ```
   *(The default `.env.example` comes pre-configured with local PostgreSQL credentials and Testnet defaults.)*

4. **Start local PostgreSQL database**:
   ```bash
   npm run db:up
   ```

5. **Generate Prisma client and run migrations**:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

6. **Start development services**:
   * In Terminal 1 (REST API server):
     ```bash
     npm run dev:server
     ```
   * In Terminal 2 (Stellar Listener & Worker):
     ```bash
     npm run dev:worker
     ```

7. **Verify local setup**:
   ```bash
   curl http://localhost:4000/health
   # Response: {"status":"ok","timestamp":"..."}
   ```

---

## 6. Environment Variables Reference

See [.env.example](file:///.env.example) for the full configuration template.

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/stellar_invoice` |
| `DIRECT_URL` | Direct DB connection (for migrations/pooling) | `postgresql://postgres:postgres@localhost:5432/stellar_invoice` |
| `AUTH_MODE` | Pluggable auth driver (`api_key` or `supabase`) | `api_key` |
| `DEV_API_KEY` | Secret key used when `AUTH_MODE=api_key` | `dev-secret-api-key-change-in-production` |
| `STELLAR_NETWORK` | Stellar network mode (`TESTNET` or `PUBLIC`) | `TESTNET` |
| `HORIZON_URL` | Stellar Horizon REST endpoint | `https://horizon-testnet.stellar.org` |
| `STELLAR_RPC_URL` | Stellar RPC endpoint | `https://soroban-testnet.stellar.org` |
| `CHAIN_READER_DRIVER`| Chain ingestion driver (`horizon` or `rpc`) | `horizon` |
| `PLATFORM_WALLET_PUBLIC_ADDRESS` | Public receiving account (`G...`) | Testnet receiving public key |

---

## 7. Open Source & Community

* **Contributing**: Please review [CONTRIBUTING.md](file:///CONTRIBUTING.md) for pull request guidelines, coding conventions, and testing instructions.
* **Architecture Deep Dive**: Read [ARCHITECTURE.md](file:///ARCHITECTURE.md) for detailed state machine diagrams, cursor handling, and security models.
* **Payment Matching Rules**: See [docs/MATCHING_GUIDE.md](file:///docs/MATCHING_GUIDE.md).
* **Wave Contributor Issues**: Browse [docs/ISSUES.md](file:///docs/ISSUES.md) for 100-200 pt bounty issues.
* **Security Policy**: See [SECURITY.md](file:///SECURITY.md).

---

## 8. License

This project is licensed under the [Apache License 2.0](file:///LICENSE).
