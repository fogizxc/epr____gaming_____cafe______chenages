import { getMongoDb } from "../server/mongodb.js";
import { recordFinancialTransaction } from "./financialLedger.js";

export async function reconcileFinancialLedger() {
  const db = await getMongoDb();
  const [payments, refunds, wallet, cash, memberships, fnb] = await Promise.all([
    db.collection("payments").find({ status: { $in: ["CAPTURED", "PAID"] } }).toArray(),
    db.collection("refunds").find({ status: "COMPLETED" }).toArray(),
    db.collection("wallet_transactions").find({}).toArray(),
    db.collection("cash_ledger").find({}).toArray(),
    db.collection("customer_memberships").find({ status: { $in: ["ACTIVE", "PAID"] } }).toArray(),
    db.collection("fnb_orders").find({ paymentStatus: "PAID" }).toArray(),
  ]);
  let created = 0;
  const record = async (entry: any) => { const result = await recordFinancialTransaction(entry); if (!result.duplicate) created++; };
  for (const p of payments) {
    const sourceType = p.tournamentTeamId ? "TOURNAMENT" : p.fnbOrderId ? "FNB" : p.membershipId ? "MEMBERSHIP" : "GAMING";
    const sourceId = String(p.tournamentTeamId || p.fnbOrderId || p.membershipId || p.bookingId || p.id);
    await record({ transactionId: `SALE:${p.id}`, type: "SALE", sourceType, sourceId, customerId: p.customerId, paymentId: p.id, amountPaise: Number(p.amountPaise), currency: "INR", occurredAt: p.capturedAt ? new Date(p.capturedAt) : new Date(p.createdAt), createdAt: new Date() });
  }
  for (const o of fnb) if (!(await db.collection("payments").findOne({ fnbOrderId: o.id, status: { $in: ["CAPTURED", "PAID"] } }))) await record({ transactionId: `SALE:FNB:${o.id}`, type: "SALE", sourceType: "FNB", sourceId: o.id, customerId: o.customerId, amountPaise: Number(o.totalPaise), currency: "INR", occurredAt: new Date(o.paidAt || o.createdAt), createdAt: new Date() });
  for (const m of memberships) if (!(await db.collection("payments").findOne({ membershipId: m.id, status: { $in: ["CAPTURED", "PAID"] } }))) await record({ transactionId: `SALE:MEMBERSHIP:${m.id}`, type: "SALE", sourceType: "MEMBERSHIP", sourceId: m.id, customerId: m.customerId, amountPaise: Number(m.pricePaise), currency: "INR", occurredAt: new Date(m.paidAt || m.createdAt), createdAt: new Date() });
  for (const r of refunds) await record({ transactionId: `REFUND:${r.id}`, type: "REFUND", sourceType: "REFUND", sourceId: r.id, customerId: r.customerId, amountPaise: Number(r.amountPaise), currency: "INR", occurredAt: new Date(r.completedAt || r.updatedAt || r.createdAt), createdAt: new Date(), metadata: { providerRefundId: r.providerRefundId, bookingId: r.bookingId, fnbOrderId: r.fnbOrderId } });
  for (const w of wallet) await record({ transactionId: `WALLET:${w.id}`, type: String(w.type).toUpperCase()==="DEBIT" ? "WALLET_DEBIT" : "WALLET_CREDIT", sourceType: "WALLET", sourceId: String(w.id), customerId: w.customerId, amountPaise: Number(w.amountPaise), currency: "INR", occurredAt: new Date(w.createdAt), createdAt: new Date(), metadata: { source: w.source, orderId: w.orderId } });
  for (const c of cash) await record({ transactionId: `CASH:${c.id || c._id}`, type: ["OUT","DEBIT","EXPENSE"].includes(String(c.type).toUpperCase()) ? "CASH_OUT" : "CASH_IN", sourceType: "CASH", sourceId: String(c.id || c._id), amountPaise: Number(c.amountPaise), currency: "INR", occurredAt: new Date(c.createdAt), createdAt: new Date(), metadata: { shiftId: c.shiftId, employeeId: c.employeeId } });
  return { created };
}
