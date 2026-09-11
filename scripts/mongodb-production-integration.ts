import "dotenv/config";
import { strict as assert } from "node:assert";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI;
if (!uri) {
  console.log("MongoDB integration tests skipped: MONGODB_TEST_URI/MONGODB_URI is not configured");
  process.exit(0);
}

const dbName = process.env.MONGODB_TEST_DB_NAME || "bytes_brew_epr_test";
const client = new MongoClient(uri, { maxPoolSize: 20, serverSelectionTimeoutMS: 5000 });
const runId = `it-${Date.now()}-${Math.random().toString(16).slice(2)}`;

async function main() {
  await client.connect();
  const db = client.db(dbName);
  const collections = ["it_bookings", "it_payments", "it_wallets", "it_memberships", "it_inventory", "it_refunds"];
  await Promise.all(collections.map((name) => db.collection(name).drop().catch(() => undefined)));

  // Booking conflict: a unique active reservation must survive concurrent attempts.
  const bookings = db.collection("it_bookings");
  await bookings.createIndex({ systemId: 1, slot: 1, status: 1 }, { unique: true, partialFilterExpression: { status: "CONFIRMED" } });
  const attempts = await Promise.allSettled(Array.from({ length: 10 }, (_, i) => bookings.insertOne({ id: `${runId}-b-${i}`, systemId: "PS5-01", slot: "2030-01-01T10:00", status: "CONFIRMED" })));
  assert.equal(attempts.filter((r) => r.status === "fulfilled").length, 1, "exactly one concurrent booking may claim a unique slot");

  // Payment webhook idempotency: provider event key must be unique.
  const events = db.collection("it_payments");
  await events.createIndex({ key: 1 }, { unique: true });
  const eventAttempts = await Promise.allSettled(Array.from({ length: 10 }, () => events.insertOne({ key: `${runId}-razorpay-event`, receivedAt: new Date() })));
  assert.equal(eventAttempts.filter((r) => r.status === "fulfilled").length, 1, "duplicate webhook events must be idempotent");

  // Wallet debit: compare-and-set prevents concurrent overspend.
  const wallets = db.collection("it_wallets");
  await wallets.insertOne({ id: `${runId}-wallet`, balancePaise: 10000 });
  const debit = async () => wallets.updateOne({ id: `${runId}-wallet`, balancePaise: { $gte: 7000 } }, { $inc: { balancePaise: -7000 } });
  const debits = await Promise.all([debit(), debit(), debit(), debit()]);
  assert.equal(debits.filter((r) => r.modifiedCount === 1).length, 1, "wallet must never go negative under concurrent debits");
  assert.equal((await wallets.findOne({ id: `${runId}-wallet` }))?.balancePaise, 3000);

  // Membership activation: one active membership per customer.
  const memberships = db.collection("it_memberships");
  await memberships.createIndex({ customerId: 1, status: 1 }, { unique: true, partialFilterExpression: { status: "ACTIVE" } });
  const memberAttempts = await Promise.allSettled(Array.from({ length: 8 }, (_, i) => memberships.insertOne({ id: `${runId}-m-${i}`, customerId: `${runId}-customer`, status: "ACTIVE" })));
  assert.equal(memberAttempts.filter((r) => r.status === "fulfilled").length, 1, "only one active membership may exist");

  // F&B inventory: atomic conditional decrement prevents overselling.
  const inventory = db.collection("it_inventory");
  await inventory.insertOne({ id: `${runId}-drink`, stockQty: 3 });
  const consume = async () => inventory.updateOne({ id: `${runId}-drink`, stockQty: { $gte: 1 } }, { $inc: { stockQty: -1 } });
  const consumes = await Promise.all(Array.from({ length: 10 }, consume));
  assert.equal(consumes.filter((r) => r.modifiedCount === 1).length, 3, "inventory must not be oversold");
  assert.equal((await inventory.findOne({ id: `${runId}-drink` }))?.stockQty, 0);

  // Refund cap: atomic claim cannot move a payment beyond its captured amount.
  const refunds = db.collection("it_refunds");
  await refunds.insertOne({ paymentId: `${runId}-payment`, capturedPaise: 10000, refundedPaise: 0 });
  const refundClaim = async () => refunds.updateOne({ paymentId: `${runId}-payment`, $expr: { $lte: [{ $add: ["$refundedPaise", 7000] }, "$capturedPaise"] } }, { $inc: { refundedPaise: 7000 } });
  const refundAttempts = await Promise.all([refundClaim(), refundClaim()]);
  assert.equal(refundAttempts.filter((r) => r.modifiedCount === 1).length, 1, "refunds must be capped at captured payment amount");
  assert.equal((await refunds.findOne({ paymentId: `${runId}-payment` }))?.refundedPaise, 7000);

  console.log("MongoDB production integration checks passed");
}

main().catch((error) => {
  console.error("MongoDB production integration checks failed", error);
  process.exitCode = 1;
}).finally(async () => {
  await client.close();
});
