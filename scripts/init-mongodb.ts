import "dotenv/config";
import { getMongoDb, closeMongoDb } from "../src/server/mongodb.js";
import { INITIAL_SYSTEMS, INITIAL_PRICING_RULES } from "../src/data/initialData.js";

const indexPlan: Record<string, Array<{ key: Record<string, 1 | -1>; options?: Record<string, unknown> }>> = {
  users: [{ key: { email: 1 }, options: { unique: true, sparse: true } }, { key: { phone: 1 }, options: { unique: true, partialFilterExpression: { phone: { $type: "string", $ne: "" } } } }, { key: { role: 1, isActive: 1 } }],
  refresh_tokens: [{ key: { tokenHash: 1 }, options: { unique: true } }, { key: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } }, { key: { userId: 1, revokedAt: 1 } }],
  gaming_systems: [{ key: { id: 1 }, options: { unique: true, sparse: true } }, { key: { category: 1, status: 1 } }],
  games: [{ key: { slug: 1 }, options: { unique: true, sparse: true } }, { key: { category: 1, isVisible: 1 } }, { key: { title: "text" } as any }],
  bookings: [{ key: { systemId: 1, date: 1, startTime: 1, endTime: 1 } }, { key: { customerId: 1, bookingStatus: 1, date: -1 } }, { key: { bookingStatus: 1, date: 1 } }, { key: { customerId: 1, idempotencyKey: 1 }, options: { unique: true, sparse: true } }],
  active_sessions: [{ key: { systemId: 1, status: 1 } }, { key: { customerId: 1, status: 1 } }, { key: { systemId: 1, status: 1 }, options: { unique: true, partialFilterExpression: { status: "ACTIVE" } } }, { key: { customerId: 1, status: 1 }, options: { unique: true, partialFilterExpression: { status: "ACTIVE" } } }, { key: { bookingId: 1, status: 1 } }],
  invoices: [{ key: { invoiceNumber: 1 }, options: { unique: true, sparse: true } }, { key: { bookingId: 1 }, options: { unique: true, sparse: true } }, { key: { fnbOrderId: 1 }, options: { unique: true, sparse: true } }, { key: { customerId: 1, createdAt: -1 } }, { key: { paymentStatus: 1, createdAt: -1 } }],
  payments: [{ key: { provider: 1, providerPaymentId: 1 }, options: { unique: true, sparse: true } }, { key: { provider: 1, providerOrderId: 1 }, options: { unique: true, sparse: true } }, { key: { customerId: 1, membershipId: 1, idempotencyKey: 1 }, options: { unique: true, sparse: true } }, { key: { customerId: 1, fnbOrderId: 1, idempotencyKey: 1 }, options: { unique: true, sparse: true } }, { key: { customerId: 1, tournamentTeamId: 1, idempotencyKey: 1 }, options: { unique: true, sparse: true } }, { key: { customerId: 1, createdAt: -1 } }, { key: { customerId: 1, idempotencyKey: 1 }, options: { unique: true, sparse: true } }],
  razorpay_webhook_events: [{ key: { key: 1 }, options: { unique: true } }, { key: { receivedAt: -1 } }],
  wallet_transactions: [{ key: { customerId: 1, createdAt: -1 } }, { key: { customerId: 1, idempotencyKey: 1 }, options: { unique: true, sparse: true } }],
  customer_memberships: [{ key: { customerId: 1, status: 1 } }, { key: { expiresAt: 1, status: 1 } }, { key: { customerId: 1, purchaseIdempotencyKey: 1 }, options: { unique: true, sparse: true } }, { key: { customerId: 1, status: 1 }, options: { unique: true, partialFilterExpression: { status: "ACTIVE" } } }],
  fnb_orders: [{ key: { customerId: 1, createdAt: -1 } }, { key: { status: 1, createdAt: -1 } }, { key: { paymentStatus: 1, inventoryStatus: 1, createdAt: -1 } }, { key: { paymentStatus: 1, inventoryStatus: 1, createdAt: 1 } }, { key: { id: 1 }, options: { unique: true, sparse: true } }, { key: { idempotencyKey: 1 }, options: { unique: true, sparse: true } }],
  fnb_products: [{ key: { category: 1, isActive: 1, name: 1 } }, { key: { stockQty: 1, reservedQty: 1 } }],
  tournaments: [{ key: { status: 1, startAt: 1 } }, { key: { slug: 1 }, options: { unique: true, sparse: true } }],
  tournament_teams: [{ key: { tournamentId: 1, teamName: 1 }, options: { unique: true } }, { key: { tournamentId: 1, status: 1 } }, { key: { captainId: 1, createdAt: -1 } }, { key: { tournamentId: 1, registrationIdempotencyKey: 1 }, options: { unique: true, sparse: true } }, { key: { formResponseId: 1 }, options: { unique: true, sparse: true } }],
  waitlist: [{ key: { service: 1, status: 1, preferredTime: 1 } }],
  maintenance_tickets: [{ key: { status: 1, priority: -1, createdAt: -1 } }],
  support_tickets: [{ key: { customerId: 1, status: 1, createdAt: -1 } }],
  refunds: [{ key: { status: 1, createdAt: -1 } }, { key: { bookingId: 1, status: 1 } }, { key: { fnbOrderId: 1, status: 1 } }, { key: { providerRefundId: 1 }, options: { unique: true, sparse: true } }],
  credit_notes: [{ key: { creditNoteNumber: 1 }, options: { unique: true } }, { key: { refundId: 1 }, options: { unique: true } }, { key: { customerId: 1, createdAt: -1 } }],
  employee_shifts: [{ key: { employeeId: 1, status: 1, startedAt: -1 } }],
  cash_ledger: [{ key: { shiftId: 1, createdAt: 1 } }],
  pricing_rules: [{ key: { service: 1 }, options: { unique: true } }],
  price_history: [{ key: { service: 1, changedAt: -1 } }],
  promotion_codes: [{ key: { code: 1 }, options: { unique: true } }],
  audit_logs: [{ key: { actorId: 1, createdAt: -1 } }, { key: { entityType: 1, entityId: 1, createdAt: -1 } }],
  business_settings: [{ key: { key: 1 }, options: { unique: true } }],
  financial_ledger: [{ key: { transactionId: 1 }, options: { unique: true } }, { key: { occurredAt: -1 } }, { key: { sourceType: 1, sourceId: 1 } }],
};

async function seedOperationalData() { const db = await getMongoDb(); const now = new Date(); const systems = db.collection("gaming_systems"); for (const system of INITIAL_SYSTEMS as any[]) await systems.updateOne({ id: system.id }, { $setOnInsert: { ...system, bookingVersion: 0, status: system.status === "ACTIVE" ? "AVAILABLE" : system.status, createdAt: now }, $set: { updatedAt: now } }, { upsert: true }); const pricing = db.collection("pricing_rules"); for (const rule of INITIAL_PRICING_RULES as any[]) await pricing.updateOne({ service: rule.service }, { $setOnInsert: { ...rule, createdAt: now }, $set: { updatedAt: now } }, { upsert: true }); }
async function main() { const db = await getMongoDb(); for (const [collectionName, indexes] of Object.entries(indexPlan)) { const collection = db.collection(collectionName); for (const index of indexes) await collection.createIndex(index.key, index.options as any); console.log(`MongoDB: ${collectionName} indexes ready (${indexes.length})`); } await seedOperationalData(); console.log(`MongoDB Atlas bootstrap complete: ${Object.keys(indexPlan).length} collections prepared and operational seed data verified.`); }
main().catch((error) => { console.error("MongoDB bootstrap failed:", error); process.exitCode = 1; }).finally(() => closeMongoDb());
