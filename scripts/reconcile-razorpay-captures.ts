import "dotenv/config";
import crypto from "node:crypto";
import { getMongoDb, closeMongoDb } from "../src/server/mongodb.js";
import { recordFinancialTransaction } from "../src/services/financialLedger.js";

const BASE = "https://api.razorpay.com/v1";
const env = (name: string) => { const v = process.env[name]?.trim(); if (!v) throw new Error(`${name}_NOT_CONFIGURED`); return v; };
async function razor(path: string) {
  const auth = Buffer.from(`${env("RAZORPAY_KEY_ID")}:${env("RAZORPAY_KEY_SECRET")}`).toString("base64");
  const r = await fetch(`${BASE}${path}`, { headers: { Authorization: `Basic ${auth}` } });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("RAZORPAY_REQUEST_FAILED");
  return body;
}

async function main() {
  const db = await getMongoDb();
  const candidates = await db.collection("payments").find({ provider: "RAZORPAY", status: { $in: ["CREATED", "PENDING", "FAILED"] }, providerOrderId: { $exists: true, $ne: "" } }).sort({ createdAt: 1 }).limit(500).toArray();
  let repaired = 0, skipped = 0, failed = 0;
  for (const payment of candidates) {
    try {
      const order = await razor(`/orders/${encodeURIComponent(String(payment.providerOrderId))}`);
      const captured = (order?.payments?.items || []).find((p: any) => p?.status === "captured" && Number(p.amount) === Number(payment.amountPaise) && String(p.currency) === "INR");
      if (!captured) { skipped++; continue; }
      const now = new Date();
      const updated = await db.collection("payments").findOneAndUpdate({ _id: payment._id, status: { $ne: "CAPTURED" } }, { $set: { status: "CAPTURED", providerPaymentId: String(captured.id), providerStatus: "captured", capturedAt: now, updatedAt: now, reconciliationRequired: false } }, { returnDocument: "after" });
      if (!updated) { skipped++; continue; }
      if (payment.bookingId) {
        await db.collection("bookings").updateOne({ id: String(payment.bookingId), paymentStatus: { $ne: "PAID" } }, { $set: { paymentStatus: "PAID", paidAt: now.toISOString(), paymentId: updated.id, updatedAt: now } });
        const booking = await db.collection("bookings").findOne({ id: String(payment.bookingId) });
        if (booking) {
          const existing = await db.collection("invoices").findOne({ paymentId: updated.id, status: { $ne: "VOID" } });
          const invoice = existing || { id: `INV-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`, invoiceNumber: `BC-${now.getFullYear()}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`, bookingId: booking.id, customerId: booking.customerId, paymentId: updated.id, status: "ISSUED", paymentStatus: "PAID", currency: "INR", subtotalPaise: Number(booking.subtotalPaise || updated.amountPaise), taxPaise: Number(booking.taxPaise || 0), discountPaise: Number(booking.discountPaise || 0), totalPaise: Number(updated.amountPaise), issuedAt: now, createdAt: now, updatedAt: now, immutable: true, items: [] };
          if (!existing) await db.collection("invoices").insertOne(invoice);
          await recordFinancialTransaction({ id: `SALE:${updated.id}`, type: "SALE", source: "GAMING", sourceId: String(booking.id), customerId: String(booking.customerId), paymentId: String(updated.id), invoiceId: String(invoice.id), amountPaise: Number(updated.amountPaise), currency: "INR", occurredAt: now, createdAt: now, metadata: { reconciliation: true, providerPaymentId: String(captured.id), providerOrderId: String(payment.providerOrderId) } });
        }
      } else {
        const source = payment.tournamentTeamId ? "TOURNAMENT" : payment.fnbOrderId ? "FNB" : payment.membershipId ? "MEMBERSHIP" : "GAMING";
        const sourceId = String(payment.tournamentTeamId || payment.fnbOrderId || payment.membershipId || payment.bookingId || payment.id);
        await recordFinancialTransaction({ id: `SALE:${updated.id}`, type: "SALE", source, sourceId, customerId: payment.customerId, paymentId: updated.id, amountPaise: Number(updated.amountPaise), currency: "INR", occurredAt: now, createdAt: now, metadata: { reconciliation: true, providerPaymentId: String(captured.id), providerOrderId: String(payment.providerOrderId) } });
      }
      repaired++;
    } catch (e) { failed++; console.error("reconcile payment", payment.id, e); }
  }
  console.log(JSON.stringify({ scanned: candidates.length, repaired, skipped, failed }));
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => closeMongoDb().catch(() => undefined));
