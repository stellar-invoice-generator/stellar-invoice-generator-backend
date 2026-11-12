# Security Policy 🛡️

At StellarInvoice, security is paramount. Because this software monitors and reconciles financial crypto transactions on the Stellar network, maintaining robust security standards and protecting user privacy is our top priority.

---

## 1. Non-Custodial Core Guarantee

StellarInvoice is **strictly non-custodial**:
* The software **never** accepts, generates, stores, transmits, or handles private keys, seed phrases, or secret keys (`S...`).
* The system only monitors public Stellar ledger accounts (`G...`).
* In the event of a total database breach, **no user funds can be stolen or compromised**, as no keys exist in the system.

---

## 2. Reporting a Vulnerability

If you discover a security vulnerability or potential threat within StellarInvoice, please report it privately. **Do NOT open a public GitHub issue.**

### How to Report:
* **Email**: Send detailed findings to **`security@stellarinvoice.org`**.
* **Include**:
  1. Detailed description of the vulnerability.
  2. Proof-of-concept (PoC) code or step-by-step reproduction instructions.
  3. Affected modules, routes, or files.
  4. Your suggested fix or mitigation (if available).

### Response SLA:
* **Initial Acknowledgement**: Within 24-48 hours.
* **Assessment & Severity Assignment**: Within 72 hours.
* **Coordinated Disclosure & Patch Release**: Typically within 14 days, depending on severity.

---

## 3. High-Priority Threat Scenarios

We place particular scrutiny on the following potential vulnerability vectors:
1. **Asset Spoofing / Counterfeit Tokens**:
   Bypassing the asset issuer verification check and crediting invoices with fake tokens bearing the same asset code (e.g. counterfeit "USDC").
2. **Double-Crediting / Race Conditions**:
   Manipulating concurrency or stream reconnection to credit an invoice multiple times for a single payment operation.
3. **Floating-Point Rounding Exploits**:
   Exploiting numerical rounding drift to settle an invoice underpaid by fractional stroops.
4. **Tenant Isolation Bypass**:
   Accessing another merchant's invoices, customer records, or financial statistics.
5. **SSRF via Webhooks**:
   Inducing the webhook dispatcher to query internal cloud metadata services (`169.254.169.254`) or private intranet hosts.

---

## 4. Security Best Practices for Contributors

* All input must be validated via Zod schemas at API boundaries.
* Outgoing webhooks must be cryptographically signed with HMAC-SHA256.
* Database mutations for payment crediting must always execute inside atomic transactions (`prisma.$transaction`).
* Never log sensitive tokens, API keys, or raw customer PII.

