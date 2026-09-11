# Production Launch Gates

This document records what can be validated in-repository and what requires the real deployment/integration environment.

## Code-side gates completed

- Server-side authentication with live MongoDB user-state recheck.
- Role-based API security and fail-closed unknown `/api/*` behavior.
- Security headers and configured-origin CORS.
- Idempotent financial mutations.
- Transactional employee walk-in and F&B settlement.
- Server-side walk-in payment-method validation: CASH, UPI, CARD.
- Durable Razorpay webhook claims and raw-body HMAC verification.
- MongoDB replica-set integration test workflow.
- Production Docker image runs as non-root `node` user and exposes `/api/ready` healthcheck.
- Production validation workflow is available for push, pull request and manual execution.
- Production container publishing workflow publishes immutable SHA tags and a `production` tag to GHCR.
- `.env.example` documents that `BREVO_FROM_EMAIL` must be an actual verified sender.
- `server.ts` requires Brevo sender configuration through environment variables; there is no hardcoded sender fallback.

## External gates that cannot be executed from repository access

### 1. GitHub branch protection

The `production-hardening` branch currently reports protection disabled. Enable branch protection/rulesets with the production validation job required before treating the branch as an approved release gate.

### 2. MongoDB Atlas smoke test

Run against the real Atlas deployment with production-like credentials and a safe test dataset. Confirm connection, transaction support, indexes, lifecycle jobs, and duplicate/race protections.

### 3. Razorpay live smoke test

Using production Razorpay credentials, perform a controlled payment and webhook delivery test. Confirm signature verification, idempotency, payment state, invoice creation, financial ledger entry, duplicate webhook handling, and refund reconciliation.

### 4. Brevo live smoke test

Using a verified Brevo sender and production credentials, send a controlled test message. Confirm SMTP/API delivery, sender verification, and error handling. Never commit credentials.

### 5. Deployment smoke test

After deployment, verify:

- `GET /api/health` returns healthy.
- `GET /api/ready` returns ready only when MongoDB is reachable.
- customer authentication works.
- employee/admin RBAC works.
- booking conflict protection works.
- payment webhook reaches the production gateway.
- invoices and financial ledger entries reconcile.
- lifecycle worker starts and releases/completes sessions correctly.

### 6. Backup and rollback rehearsal

Verify Atlas backup/PITR, restore procedure, immutable image rollback, and backward-compatible database/application rollout behavior before opening the system to real customers.

## Launch rule

Do not label the system live-production-certified until the external gates above have been completed in the actual deployment environment. Repository CI proves the application can build and pass its automated production contracts; it does not prove that external providers or the live deployment are configured correctly.
