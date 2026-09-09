import "dotenv/config";
import { getMongoDb, closeMongoDb } from "../src/server/mongodb.js";
import { recordFinancialTransaction } from "../src/services/financialLedger.js";

const money = (v: unknown) => Number.isSafeInteger(Number(v)) && Number(v) >= 0 ? Number(v) : 0;

async function reconcile() {
  const db = await getMongoDb();
  let created = 0;
  let skipped = 0;

  const payments = await db.collection("payments").find({ status: { $in: ["CAPTURED", "PAID"] } }).toArray();
  for (const p of payments) {
    const source = p.bookingId ? "GAMING" : p.fnbOrderId ? "FNB" : p.membershipId ? "MEMBERSHIP" : p.tournamentTeamId ? "TOURNAMENT" : null;
    if (!source) { skipped++; continue; }
    const result = await recordFinancialTransaction({
      id: `SALE:${p.id}`,
      type: "SALE",
      source,
      sourceId: String(p.bookingId || p.fnbOrderId || p.membershipId || p.tournamentTeamId),
      customerId: p.customerId,
      paymentId: p.id,
      amountPaise: money(p.amountPaise),
      currency: "INR",
      occurredAt: p.capturedAt ? new Date(p.capturedAt) : new Date(p.createdAt),
      createdAt: new Date(),
      metadata: { reconciliation: true, provider: p.provider, providerPaymentId: p.providerPaymentId }
    });
    result.duplicate ? skipped++ : created++;
  }

  const refunds = await db.collection("refunds").find({ status: "COMPLETED" }).toArray();
  for (const r of refunds) {
    const result = await recordFinancialTransaction({
      id: `REFUND:${r.id}`,
      type: "REFUND",
      source: "REFUND",
      sourceId: String(r.id),
      customerId: r.customerId,
      amountPaise: money(r.amountPaise),
      currency: "INR",
      occurredAt: r.completedAt ? new Date(r.completedAt) : new Date(r.updatedAt || r.createdAt),
      createdAt: new Date(),
      metadata: { reconciliation: true, bookingId: r.bookingId, fnbOrderId: r.fnbOrderId, providerRefundId: r.providerRefundId }
    });
    result.duplicate ? skipped++ : created++;
  }

  const wallet = await db.collection("wallet_transactions").find({}).toArray();
  for (const w of wallet) {
    const type = String(w.type).toUpperCase();
    if (type !== "CREDIT" && type !== "DEBIT") { skipped++; continue; }
    const result = await recordFinancialTransaction({
      id: `WALLET:${w.id}`,
      type: type === "CREDIT" ? "WALLET_CREDIT" : "WALLET_DEBIT",
      source: "WALLET",
      sourceId: String(w.id),
      customerId: w.customerId,
      amountPaise: money(w.amountPaise),
      currency: "INR",
      occurredAt: new Date(w.createdAt),
      createdAt: new Date(),
      metadata: { reconciliation: true, walletSource: w.source, idempotencyKey: w.idempotencyKey }
    });
    result.duplicate ? skipped++ : created++;
  }

  console.log(JSON.stringify({ success: true, created, skipped }, null, 2));
}

reconcile().catch((error) => { console.error("Financial ledger reconciliation failed", error); process.exitCode = 1; }).finally(() => closeMongoDb());
