# Final Production Readiness Checklist

## Completed in production-hardening

- [x] MongoDB Atlas connection pooling and timeout controls
- [x] Transaction-aware domain repositories
- [x] Booking concurrency protection
- [x] Session lifecycle worker
- [x] F&B inventory reservation/release lifecycle
- [x] Integer-paise monetary model
- [x] Idempotency on money-changing APIs
- [x] Razorpay raw-body webhook signature verification
- [x] Durable webhook claim/retry state
- [x] Tournament payment atomic settlement
- [x] Membership payment atomic settlement
- [x] Employee walk-in gaming invoice + ledger settlement
- [x] Employee session completion invoice + ledger settlement
- [x] Employee F&B invoice + ledger settlement
- [x] Financial reconciliation/backfill
- [x] Refund cumulative-cap protection
- [x] Admin/employee/customer RBAC policy enforcement
- [x] Read-only protection for financial/audit collections
- [x] Security contract tests
- [x] MongoDB transaction integration tests
- [x] CI configured with a MongoDB replica set
- [x] Production Docker image
- [x] Container readiness health check
- [x] Production deployment/operations runbook

## Release gates

Before exposing the service to real customers, the deployment environment must provide real secrets and an Atlas replica set. CI must report green for type checking, security contracts, production invariants, MongoDB integration tests, and the production build.

## Operational verification

- Confirm `/api/ready` returns HTTP 200 with MongoDB `ok`.
- Confirm Razorpay webhook deliveries return 2xx and claims reach `PROCESSED`.
- Confirm a successful gaming payment has payment, invoice, and ledger records.
- Confirm a successful membership payment has membership, invoice, and ledger records.
- Confirm a tournament payment has team, payment, and ledger records.
- Confirm employee walk-in creates session, invoice, and ledger records.
- Confirm employee F&B sale creates order, inventory movement, invoice, and ledger records.
- Run financial reconciliation after any historical data import or migration.
- Verify Atlas backup/PITR and restore procedures before launch.
