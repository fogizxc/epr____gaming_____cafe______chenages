# Bytes & Brew Gaming Café EPR — Production Readiness

## Current implementation assessment

The repository already contains three portal experiences (customer, employee, admin), booking/session flows, F&B, membership, wallet/rewards, support, maintenance, waitlist, invoices, tournaments, pricing and operational dashboards.

The critical architectural limitation is that business state is currently held in process memory. Restarting the Node process resets the authoritative arrays. The React context also contains demo accounts and role credentials. This is suitable for a prototype but is not safe for a live café.

## Production target

MongoDB Atlas is the system of record. React is a presentation/client layer. Express is the policy and transaction layer.

```text
React portals
    |
    | HTTPS / JSON
    v
Express API
    |
    +-- Authentication / RBAC
    +-- Booking transaction service
    +-- Session/POS transaction service
    +-- Membership/wallet ledger
    +-- Tournament service
    +-- F&B inventory service
    +-- Invoice/payment service
    +-- Audit service
    |
    v
MongoDB Atlas

External integrations stay server-side:
- Razorpay
- Brevo
- Google Sheets
- Gemini
```

## Non-negotiable production rules

1. Never store plaintext passwords. Store a strong password hash and verify it only on the server.
2. Never ship admin/employee credentials in React bundles.
3. Never trust role, price, membership balance, payment status, booking status or station availability supplied by the browser.
4. All booking/session mutations must be atomic and validated server-side.
5. Wallet and membership balances must be ledger-backed and idempotent.
6. Payment webhooks must be signature verified before changing payment state.
7. Admin-only pricing changes require authenticated RBAC and an audit record.
8. Customer responses must never expose station IP addresses, internal infrastructure data or secrets.
9. Operational/integration endpoints must not expose credentials, OTPs or infrastructure secrets.
10. Every important mutation needs an audit trail with actor, timestamp, entity, before/after state and request id.

## MongoDB collections

- users
- sessions
- refresh_tokens
- gaming_systems
- games
- game_media
- bookings
- active_sessions
- membership_plans
- customer_memberships
- wallet_accounts
- wallet_transactions
- invoices
- payments
- fnb_products
- fnb_orders
- tournaments
- tournament_teams
- tournament_matches
- waitlist
- maintenance_tickets
- support_tickets
- refunds
- employee_shifts
- cash_ledger
- pricing_rules
- price_history
- promotion_codes
- audit_logs
- business_settings

## Booking state machine

```text
UPCOMING -> ACTIVE       (check-in within valid window)
UPCOMING -> CANCELLED    (policy permits)
UPCOMING -> NO-SHOW      (automatic/manual after grace period)
UPCOMING -> UPCOMING     (reschedule to a valid slot)
ACTIVE   -> COMPLETED    (normal end)
ACTIVE   -> ACTIVE       (extension/transfer)
```

No browser action may directly set `ACTIVE`, `COMPLETED`, `REFUNDED` or payment states. The server performs the transition after validating the current state.

## Station state machine

```text
AVAILABLE -> RESERVED -> ACTIVE -> AVAILABLE
AVAILABLE -> ACTIVE   -> AVAILABLE
AVAILABLE -> MAINTENANCE -> AVAILABLE
AVAILABLE -> OFFLINE
OFFLINE   -> AVAILABLE
```

A station cannot have two overlapping active/reserved sessions.

## Money rules

All money values are represented as integer paise internally. Display values are converted to INR only at the UI boundary. A final invoice is immutable after payment except through a controlled refund/credit-note workflow.

## Existing high-priority issues

### P0 — persistence
The current customer and employee services keep authoritative data in arrays in memory. This must be replaced by repository/database operations.

### P0 — authentication
The React context contains demo account passwords and fixed employee/admin credentials. These must be removed from client code and replaced by server authentication.

### P0 — authorization
API handlers are mounted directly from the Express server. Each privileged mutation must enforce server-side role/permission checks rather than relying on portal visibility.

### P0 — payment integrity
Razorpay order creation, payment verification and webhook reconciliation need one server-side payment state machine with idempotency.

### P1 — integration endpoint exposure
Brevo status/send and AI endpoints currently live on the application server and need authentication/rate limits plus sanitized responses.

### P1 — concurrency
Booking conflict checks currently inspect process memory. MongoDB transactions/unique constraints are required to prevent race-condition double booking across multiple Node instances.

### P1 — auditability
Pricing, refunds, session overrides, membership adjustments, cash adjustments and administrative changes need durable audit logs.

### P1 — observability
Add structured logs, request IDs, health/readiness checks and error monitoring.

## Portal completion checklist

### Customer
- account registration/login/logout
- email/WhatsApp verification
- station discovery
- live availability
- game catalog and game detail
- booking
- squad booking
- cancellation
- rescheduling
- QR check-in
- active session timer
- session extension
- station transfer request
- call staff
- membership purchase/usage
- wallet recharge/ledger
- F&B ordering
- rewards/challenges
- referrals
- invoices
- support tickets
- tournament registration

### Employee
- secure employee login
- shift open/close
- live floor
- reservations
- walk-ins
- check-in
- session start/extend/transfer/end
- payment collection
- F&B POS
- customer search/create
- waitlist
- maintenance
- operational alerts
- refunds
- cash ledger
- invoice printing/PDF
- activity/audit history

### Admin
- secure admin login
- dashboard/revenue KPIs
- live station control
- pricing management
- price history
- game catalog/media management
- employees/roles
- customer management
- memberships
- tournaments
- F&B/inventory
- suppliers/purchase orders
- promotions
- refunds/financial controls
- business settings
- reports/export
- audit logs

## Recommended next implementation order

1. Server authentication + RBAC + session management.
2. MongoDB repositories and schema/index creation.
3. Migrate bookings and stations first.
4. Migrate active sessions and invoice/payment ledger.
5. Migrate users, memberships and wallet.
6. Migrate F&B, waitlist and maintenance.
7. Migrate tournaments/rewards/support.
8. Connect admin mutations to durable repositories and audit logs.
9. Replace React demo state with API-backed queries/mutations.
10. Add automated integration tests for every state transition and payment path.
11. Add production observability and deployment checks.
