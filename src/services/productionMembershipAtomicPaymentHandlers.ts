import crypto from "node:crypto";
import type { Request, Response } from "express";
import { getMongoClient, getMongoDb } from "../server/mongodb.js";
import type { AuthenticatedRequest } from "../server/auth.js";
import { MEMBERSHIP_PLAN } from "./productionMembershipHandlers.js";
import { recordFinancialTransaction } from "./financialLedger.js";
import { writeAuditLog } from "../server/domainRepositories.js";

const BASE = "https://api.razorpay.com/v1";
const fail = (res: Response, status: number, error: string) => res.status(status).json({ success: false, error });
const user = (req: Request) => (req as AuthenticatedRequest).user;
const env = (name: string) => { const value = process.env[name]?.trim(); if (!value) throw new Error(`${name}_NOT_CONFIGURED`); return value; };
const equal = (a: string, b: string) => { const aa = Buffer.from(a), bb = Buffer.from(b); return aa.length === bb.length && crypto.timingSafeEqual(aa, bb); };
async function razor(path: string) { const auth = Buffer.from(`${env("RAZORPAY_KEY_ID")}:${env("RAZORPAY_KEY_SECRET")}`).toString("base64"); const response = await fetch(`${BASE}${path}`, { headers: { Authorization: `Basic ${auth}` } }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error("RAZORPAY_REQUEST_FAILED"); return body; }

async function settleMembership(db: any, payment: any, providerPaymentId: string, actorId?: string, actorRole?: string) {
  const client = getMongoClient(); if (!client) throw new Error("MONGO_TX_UNAVAILABLE");
  const session = client.startSession(); let membership: any = null; let invoice: any = null;
  try {
    await session.withTransaction(async () => {
      const p = await db.collection("payments").findOne({ _id: payment._id }, { session });
      if (!p) throw new Error("PAYMENT_NOT_FOUND");
      if (Number(p.amountPaise) !== MEMBERSHIP_PLAN.pricePaise || String(p.currency) !== "INR") throw new Error("PAYMENT_AMOUNT_MISMATCH");
      const pending = await db.collection("customer_memberships").findOne({ id: String(p.membershipId), customerId: p.customerId }, { session });
      if (!pending) throw new Error("MEMBERSHIP_NOT_FOUND");
      const now = new Date();
      if (p.status !== "CAPTURED") await db.collection("payments").updateOne({ _id: p._id, status: { $ne: "CAPTURED" } }, { $set: { status: "CAPTURED", providerPaymentId, providerStatus: "captured", capturedAt: now, updatedAt: now } }, { session });
      else if (!p.providerPaymentId) await db.collection("payments").updateOne({ _id: p._id }, { $set: { providerPaymentId, providerStatus: "captured", updatedAt: now } }, { session });
      if (pending.status === "PENDING_PAYMENT" && pending.paymentStatus === "PENDING") {
        const active = await db.collection("customer_memberships").findOne({ customerId: pending.customerId, status: "ACTIVE", expiresAt: { $gt: now }, id: { $ne: pending.id } }, { session });
        if (active) throw new Error("ACTIVE_MEMBERSHIP_EXISTS");
        const expiresAt = new Date(now.getTime() + MEMBERSHIP_PLAN.validityDays * 86400000);
        membership = await db.collection("customer_memberships").findOneAndUpdate({ _id: pending._id, status: "PENDING_PAYMENT", paymentStatus: "PENDING" }, { $set: { status: "ACTIVE", paymentStatus: "PAID", paymentId: p.id, startsAt: now, expiresAt, updatedAt: now } }, { session, returnDocument: "after" });
        if (!membership) throw new Error("MEMBERSHIP_ACTIVATION_CONFLICT");
      } else if (pending.paymentId === p.id && pending.paymentStatus === "PAID") membership = pending;
      else throw new Error("MEMBERSHIP_STATE_INVALID");
      const invoiceId = `INV-MEMBERSHIP-${pending.id}`;
      invoice = await db.collection("invoices").findOne({ membershipId: pending.id }, { session });
      if (!invoice) {
        invoice = { id: invoiceId, invoiceNumber: `BC-M-${pending.id.slice(-16).toUpperCase()}`, membershipId: pending.id, customerId: pending.customerId, paymentId: p.id, status: "ISSUED", paymentStatus: "PAID", currency: "INR", subtotalPaise: MEMBERSHIP_PLAN.pricePaise, taxPaise: 0, discountPaise: 0, totalPaise: MEMBERSHIP_PLAN.pricePaise, issuedAt: now, createdAt: now, updatedAt: now, immutable: true, items: [{ description: MEMBERSHIP_PLAN.name, quantity: 1, amountPaise: MEMBERSHIP_PLAN.pricePaise }] };
        await db.collection("invoices").insertOne(invoice, { session });
      }
      await recordFinancialTransaction({ id: `SALE:MEMBERSHIP:${pending.id}`, type: "SALE", source: "MEMBERSHIP", sourceId: pending.id, customerId: pending.customerId, paymentId: p.id, invoiceId: invoice.id, amountPaise: MEMBERSHIP_PLAN.pricePaise, currency: "INR", occurredAt: now, createdAt: now, metadata: { planId: MEMBERSHIP_PLAN.id } }, { db, session });
    });
  } finally { await session.endSession(); }
  if (membership) await writeAuditLog({ actorId, actorRole, action: "MEMBERSHIP_PAYMENT_SETTLED", entityType: "customer_membership", entityId: String(membership.id), metadata: { paymentId: payment.id, providerPaymentId, invoiceId: invoice?.id } });
  return { membership, invoice };
}

export async function handleAtomicVerifyMembershipPayment(req: Request, res: Response) {
  const u = user(req); if (!u) return fail(res, 401, "Authentication required");
  const orderId = String(req.body?.razorpay_order_id || req.body?.orderId || "").trim(), paymentId = String(req.body?.razorpay_payment_id || req.body?.paymentId || "").trim(), signature = String(req.body?.razorpay_signature || req.body?.signature || "").trim();
  if (!orderId || !paymentId || !signature) return fail(res, 400, "orderId, paymentId and signature are required");
  try {
    const expected = crypto.createHmac("sha256", env("RAZORPAY_KEY_SECRET")).update(`${orderId}|${paymentId}`).digest("hex"); if (!equal(expected, signature)) return fail(res, 400, "Invalid payment signature");
    const db = await getMongoDb(); const payment = await db.collection("payments").findOne({ provider: "RAZORPAY", providerOrderId: orderId, customerId: u.id, membershipId: { $exists: true } }); if (!payment) return fail(res, 404, "Membership payment order not found");
    if (payment.status === "CAPTURED") { const membership = await db.collection("customer_memberships").findOne({ id: payment.membershipId, customerId: u.id }); const invoice = await db.collection("invoices").findOne({ membershipId: payment.membershipId }); return res.json({ success: true, payment, membership, invoice, duplicate: true }); }
    const provider = await razor(`/payments/${encodeURIComponent(paymentId)}`); if (String(provider.order_id) !== orderId || String(provider.currency) !== "INR" || Number(provider.amount) !== Number(payment.amountPaise)) return fail(res, 400, "Payment validation failed"); if (String(provider.status) !== "captured") return fail(res, 409, "Payment has not been captured");
    const result = await settleMembership(db, payment, paymentId, u.id, u.role); const finalPayment = await db.collection("payments").findOne({ _id: payment._id }); return res.json({ success: true, payment: finalPayment, membership: result.membership, invoice: result.invoice });
  } catch (e: any) { if (String(e.message).endsWith("_NOT_CONFIGURED")) return fail(res, 503, "Payment provider is not configured"); if (["ACTIVE_MEMBERSHIP_EXISTS","MEMBERSHIP_STATE_INVALID"].includes(e.message)) return fail(res, 409, e.message === "ACTIVE_MEMBERSHIP_EXISTS" ? "An active membership already exists" : "Membership is not awaiting payment"); console.error("membership/atomic-verify", e); return fail(res, 502, "Unable to settle membership payment"); }
}

export async function handleAtomicMembershipWebhook(req: Request, res: Response) {
  try {
    const secret = env("RAZORPAY_WEBHOOK_SECRET"), signature = String(req.header("X-Razorpay-Signature") || ""), raw = (req as any).rawBody as Buffer | undefined; if (!raw?.length) return fail(res, 400, "Missing raw webhook body");
    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex"); if (!equal(expected, signature)) return fail(res, 400, "Invalid webhook signature");
    const event = String(req.body?.event || ""), entity = req.body?.payload?.payment?.entity; if (!entity?.id || !entity?.order_id) return res.json({ success: true, ignored: true });
    const db = await getMongoDb(), eventKey = String(req.body?.id || `${event}:${entity.id}:${entity.order_id}`).slice(0, 250);
    const claim = await db.collection("razorpay_webhook_events").findOne({ key: `MEMBERSHIP:${eventKey}` }); if (claim) return res.json({ success: true, duplicate: true });
    const payment = await db.collection("payments").findOne({ provider: "RAZORPAY", providerOrderId: entity.order_id, membershipId: { $exists: true } }); if (!payment) return res.json({ success: true, processed: false });
    if (Number(entity.amount) !== Number(payment.amountPaise) || String(entity.currency) !== "INR") return fail(res, 400, "Webhook payment amount or currency mismatch");
    if (event === "payment.captured") { await settleMembership(db, payment, String(entity.id)); await db.collection("razorpay_webhook_events").insertOne({ key: `MEMBERSHIP:${eventKey}`, event, paymentId: entity.id, orderId: entity.order_id, receivedAt: new Date() }); return res.json({ success: true, processed: true }); }
    if (event === "payment.failed") { await db.collection("payments").updateOne({ _id: payment._id, status: { $ne: "CAPTURED" } }, { $set: { status: "FAILED", providerPaymentId: String(entity.id), providerStatus: String(entity.status || "failed"), updatedAt: new Date() } }); await db.collection("razorpay_webhook_events").insertOne({ key: `MEMBERSHIP:${eventKey}`, event, receivedAt: new Date() }); }
    return res.json({ success: true, processed: true });
  } catch (e: any) { if (String(e.message).endsWith("_NOT_CONFIGURED")) return fail(res, 503, "Webhook is not configured"); console.error("membership/atomic-webhook", e); return fail(res, 500, "Webhook processing failed"); }
}
