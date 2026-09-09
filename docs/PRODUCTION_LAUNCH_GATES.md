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
- Manual GitHub Actions dispatch enabled for production validation.
- `.env.example` documents that `BREVO_FROM_EMAIL` must be an actual verified sender.

## External gates that cannot be truthfully executed from repository access

### 1. GitHub branch protection

The `production-hardening` branch currently reports protection disabled. Branch protection must be enabled in repository settings with required CI checks before using the branch as a production release gate.

Recommended required check: `Production checks / validate`.

### 2. GitHub Actions execution

The workflow is configured for push, pull request, and manual dispatch. A successful run must still be observed in GitHub Actions; repository inspection alone cannot prove that the hosted runner completed successfully.

### 3. MongoDB Atlas smoke test

Run against the real Atlas deployment with production-like credentials and a safe test dataset. Confirm connection, transaction support, indexes, lifecycle jobs, and duplicate/race protections.

### 4. Razorpay live smoke test

Using production Razorpay credentials, perform a controlled payment and webhook delivery test. Confirm signature verification, idempotency, payment state, invoice creation, financial ledger entry, and duplicate webhook handling.

### 5. Brevo live smoke test

Using a verified Brevo sender and production credentials, send a controlled test message. Confirm SMTP/API delivery, sender verification, and error handling. Never commit credentials.

### 6. Deployment smoke test

After deployment, verify:

- `GET /api/health` returns healthy.
- `GET /api/ready` returns ready only when MongoDB is reachable.
- customer authentication works.
- employee/admin RBAC works.
- booking conflict protection works.
- payment webhook reaches the production gateway.
- invoices and financial ledger entries reconcile.
- lifecycle worker starts and releases/completes sessions correctly.

## Known code cleanup gate

`server.ts` still contains a legacy hardcoded Brevo sender fallback. It must be removed so the application requires `BREVO_FROM_EMAIL` from environment configuration rather than embedding a personal sender address in source code.

Do not mark the application production-certified until this source-level cleanup and all external gates above have been verified.
