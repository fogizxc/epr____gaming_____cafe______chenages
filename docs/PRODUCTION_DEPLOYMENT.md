# Production Deployment Runbook

## Required production services

- Node.js 20 runtime/container
- MongoDB Atlas with replica set / transaction support
- Razorpay account and webhook endpoint
- Optional Brevo SMTP
- Optional Google Sheets / Forms Apps Script integrations

## Required environment

Set values from `.env.example` in the deployment platform. Never commit `.env` or provider secrets.

Minimum production values:

- `NODE_ENV=production`
- `PORT=3000`
- `APP_URL=https://<public-host>`
- `BUSINESS_TIMEZONE=Asia/Kolkata`
- `MONGODB_URI=<Atlas connection string>`
- `MONGODB_DB_NAME=bytes_brew_epr`
- `AUTH_SECRET=<long random secret>`
- `RAZORPAY_KEY_ID=<server key id>`
- `RAZORPAY_KEY_SECRET=<server secret>`
- `RAZORPAY_WEBHOOK_SECRET=<webhook secret>`

Set `TRUST_PROXY=true` only when the application is actually behind a trusted reverse proxy/load balancer.

## First deployment

1. Build the container with `docker build -t gaming-cafe-epr .`.
2. Configure production environment variables in the platform secret manager.
3. Run `npm run db:init` once against the production Atlas database.
4. Bootstrap the first administrator with `npm run db:bootstrap-admin` using secret environment variables.
5. Start the container.
6. Confirm `GET /api/ready` returns HTTP 200 and MongoDB is reported `ok`.
7. Configure Razorpay webhooks to the public webhook endpoint and verify the webhook secret.
8. Run `npm run financial:reconcile` after migration/imports and review the created/skipped counts.

## Health and readiness

`/api/health` is a basic process health endpoint.

`/api/ready` is the readiness endpoint and verifies MongoDB connectivity. Load balancers should use readiness for traffic routing.

## Database safety

- Use MongoDB Atlas backups / point-in-time recovery for production.
- Do not run destructive index or data migrations without a backup.
- Transactions require Atlas replica-set support.
- Keep production and CI databases separate.
- Monitor connection-pool saturation and transaction failures.

## Financial operations

The financial ledger is append-oriented and uses deterministic transaction IDs for idempotent recovery. Reconciliation is a recovery control, not a replacement for atomic payment transactions.

Run these during controlled maintenance windows when needed:

- `npm run financial:reconcile`
- `npm run financial:reconcile-razorpay`

Review refunds and provider captures before closing daily accounts.

## CI gates

The production workflow runs:

1. Type checking
2. Security contract checks
3. Production invariant tests
4. MongoDB concurrency/transaction tests against a replica set
5. Production build

A release should not be promoted when any gate fails.

## Rollback

Deploy the previous immutable container/image tag. Do not roll back MongoDB schema/data blindly. Database changes must remain backward-compatible with the application version during a rolling deployment.

## Monitoring

Alert on:

- readiness failures
- MongoDB connection/transaction errors
- repeated Razorpay webhook failures
- payment reconciliation mismatches
- refund reconciliation mismatches
- unusual booking conflict rates
- inventory reservation/release failures
- application 5xx rate

## Security checklist

- HTTPS at the edge
- provider secrets only in secret manager
- strong `AUTH_SECRET`
- admin bootstrap credentials removed/rotated after first use
- Razorpay webhook signatures verified against raw request bytes
- unknown `/api/*` routes fail closed
- admin routes require ADMIN/SUPER_ADMIN
- employee routes require EMPLOYEE/ADMIN/SUPER_ADMIN
- monetary values stored as integer paise
- idempotency keys required on money-changing mutations
