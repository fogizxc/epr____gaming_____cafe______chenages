import crypto from "node:crypto";
import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../server/auth.js";
import { getMongoDb } from "../server/mongodb.js";
import { writeAuditLog } from "../server/domainRepositories.js";
import { handleActivateMembership } from "./productionMembershipHandlers.js";

const BASE = "https://api.razorpay.com/v1";
function user(req: Request) { return (req as AuthenticatedRequest).user; }
function fail(res: Response, status: number, error: string) { return res.status(status).json({ success: false, error }); }
function env(name: string) { const v = process.env[name]?.trim(); if (!v) throw new Error(`${name}_NOT_CONFIGURED`); return v; }
function equal(a: string, b: string) { const aa = Buffer.from(a); const bb = Buffer.from(b); return aa.length === bb.length && crypto.timingSafeEqual(aa, bb); }
async function razor(path: string, init: RequestInit = {}) { const key = env("RAZORPAY_KEY_ID"), secret = env("RAZORPAY_KEY_SECRET"); const r = await fetch(`${BASE}${path}`, { ...init, headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`, ...(init.headers || {}) } }); const body = await r.json().catch(() => ({})); if (!r.ok) { const e = new Error("RAZORPAY_REQUEST_FAILED"); (e as any).provider = body; (e as any).status = r.status; throw e; } return body; }

async function activateCapturedMembership(db: any, payment: any, actorId?: string, actorRole?: string) {
  if (!payment?.membershipId) return null;
  const membership = await handleActivateMembership(String(payment.membershipId), String(payment.id), actorId || String(payment.customerId), actorRole);
  if (membership) await writeAuditLog({ actorId, actorRole, action: "MEMBERSHIP_PAYMENT_CAPTURED", entityType: "payment", entityId: String(payment.id), metadata: { membershipId: payment.membershipId, providerPaymentId: payment.providerPaymentId } });
  return membership;
}

export async function handleCreateMembershipPaymentOrder(req: Request, res: Response) {
  const u = user(req); if (!u) return fail(res, 401, "Authentication required");
  const membershipId = String(req.body?.membershipId || "").trim(); const key = String(req.header("Idempotency-Key") || req.body?.idempotencyKey || "").trim();
  if (!membershipId) return fail(res, 400, "membershipId is required"); if (key.length < 16 || key.length > 128) return fail(res, 400, "A valid Idempotency-Key is required");
  try { const db = await getMongoDb(); const membership = await db.collection("customer_memberships").findOne({ id: membershipId, customerId: u.id, status: "PENDING_PAYMENT", paymentStatus: "PENDING" }); if (!membership) return fail(res, 404, "Pending membership not found");
    const existing = await db.collection("payments").findOne({ customerId: u.id, membershipId, idempotencyKey: key }); if (existing?.providerOrderId) return res.json({ success: true, payment: existing, duplicate: true, razorpay: { keyId: env("RAZORPAY_KEY_ID"), orderId: existing.providerOrderId, amount: existing.amountPaise, currency: "INR" } });
    const order = await razor("/orders", { method: "POST", body: JSON.stringify({ amount: membership.pricePaise, currency: "INR", receipt: String(membership.id).slice(0, 40), notes: { membershipId: membership.id, customerId: u.id } }) });
    const now = new Date(); const payment = { id: `PAY-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`, customerId: u.id, membershipId: membership.id, provider: "RAZORPAY", providerOrderId: order.id, amountPaise: membership.pricePaise, currency: "INR", status: "CREATED", idempotencyKey: key, createdAt: now, updatedAt: now };
    try { await db.collection("payments").insertOne(payment); } catch (e: any) { if (e?.code === 11000) { const dup = await db.collection("payments").findOne({ customerId: u.id, membershipId, idempotencyKey: key }); if (dup) return res.json({ success: true, payment: dup, duplicate: true, razorpay: { keyId: env("RAZORPAY_KEY_ID"), orderId: dup.providerOrderId, amount: dup.amountPaise, currency: "INR" } }); } throw e; }
    await writeAuditLog({ actorId: u.id, actorRole: u.role, action: "MEMBERSHIP_PAYMENT_ORDER_CREATED", entityType: "payment", entityId: payment.id, metadata: { membershipId, amountPaise: membership.pricePaise, providerOrderId: order.id } });
    return res.status(201).json({ success: true, payment, razorpay: { keyId: env("RAZORPAY_KEY_ID"), orderId: order.id, amount: membership.pricePaise, currency: "INR" } });
  } catch (e: any) { if (String(e.message).endsWith("_NOT_CONFIGURED")) return fail(res, 503, "Payment provider is not configured"); console.error("membership/payment-order", e); return fail(res, 502, "Unable to create membership payment order"); }
}

export async function handleVerifyMembershipPayment(req: Request, res: Response) {
  const u = user(req); if (!u) return fail(res, 401, "Authentication required"); const orderId = String(req.body?.razorpay_order_id || req.body?.orderId || "").trim(); const paymentId = String(req.body?.razorpay_payment_id || req.body?.paymentId || "").trim(); const supplied = String(req.body?.razorpay_signature || req.body?.signature || "").trim(); if (!orderId || !paymentId || !supplied) return fail(res, 400, "orderId, paymentId and signature are required");
  try { const secret = env("RAZORPAY_KEY_SECRET"); const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex"); if (!equal(expected, supplied)) return fail(res, 400, "Invalid payment signature"); const db = await getMongoDb(); const payment = await db.collection("payments").findOne({ provider: "RAZORPAY", providerOrderId: orderId, customerId: u.id, membershipId: { $exists: true } }); if (!payment) return fail(res, 404, "Membership payment order not found"); if (payment.status === "CAPTURED") return res.json({ success: true, payment, membership: await db.collection("customer_memberships").findOne({ id: payment.membershipId }), duplicate: true }); const provider = await razor(`/payments/${encodeURIComponent(paymentId)}`); if (String(provider.order_id) !== orderId || String(provider.currency) !== "INR" || Number(provider.amount) !== Number(payment.amountPaise)) return fail(res, 400, "Payment validation failed"); if (String(provider.status) !== "captured") return fail(res, 409, "Payment has not been captured"); const now = new Date(); const captured = await db.collection("payments").findOneAndUpdate({ _id: payment._id, status: { $ne: "CAPTURED" } }, { $set: { status: "CAPTURED", providerPaymentId: paymentId, providerStatus: provider.status, capturedAt: now, updatedAt: now } }, { returnDocument: "after" }); const finalPayment = captured || await db.collection("payments").findOne({ _id: payment._id }); const membership = await activateCapturedMembership(db, finalPayment, u.id, u.role); if (!membership && finalPayment?.status !== "CAPTURED") return fail(res, 409, "Membership activation could not be completed"); return res.json({ success: true, payment: finalPayment, membership: membership || await db.collection("customer_memberships").findOne({ id: payment.membershipId }) });
  } catch (e: any) { if (String(e.message).endsWith("_NOT_CONFIGURED")) return fail(res, 503, "Payment provider is not configured"); console.error("membership/payment-verify", e); return fail(res, 502, "Unable to verify membership payment"); }
}

export async function handleMembershipPaymentWebhook(req: Request, res: Response) {
  try {
    const secret = env("RAZORPAY_WEBHOOK_SECRET"); const signatureHeader = req.header("X-Razorpay-Signature") || ""; const rawBody = (req as any).rawBody as Buffer | undefined;
    if (!rawBody?.length) return fail(res, 400, "Missing raw webhook body");
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex"); if (!equal(expected, signatureHeader)) return fail(res, 400, "Invalid webhook signature");
    const event = String(req.body?.event || ""); const entity = req.body?.payload?.payment?.entity; if (!entity?.id || !entity?.order_id) return res.json({ success: true, ignored: true });
    const db = await getMongoDb(); const webhookKey = String(req.body?.id || `${event}:${entity.id}:${entity.order_id}`).slice(0, 250);
    try { await db.collection("razorpay_webhook_events").insertOne({ key: `MEMBERSHIP:${webhookKey}`, event, paymentId: entity.id, orderId: entity.order_id, receivedAt: new Date() }); } catch (e: any) { if (e?.code === 11000) return res.json({ success: true, duplicate: true }); throw e; }
    const payment = await db.collection("payments").findOne({ provider: "RAZORPAY", providerOrderId: entity.order_id, membershipId: { $exists: true } }); if (!payment) return res.json({ success: true, processed: false });
    if (Number(entity.amount) !== Number(payment.amountPaise) || String(entity.currency) !== "INR") return fail(res, 400, "Webhook payment amount or currency mismatch");
    if (event === "payment.captured") {
      const now = new Date(); const captured = await db.collection("payments").findOneAndUpdate({ _id: payment._id, status: { $ne: "CAPTURED" } }, { $set: { status: "CAPTURED", providerPaymentId: String(entity.id), providerStatus: String(entity.status || "captured"), capturedAt: now, updatedAt: now } }, { returnDocument: "after" });
      const finalPayment = captured || await db.collection("payments").findOne({ _id: payment._id }); const membership = await activateCapturedMembership(db, finalPayment);
      return res.json({ success: true, processed: true, membershipId: membership?.id || payment.membershipId });
    }
    if (event === "payment.failed") { await db.collection("payments").updateOne({ _id: payment._id, status: { $ne: "CAPTURED" } }, { $set: { status: "FAILED", providerPaymentId: String(entity.id), providerStatus: String(entity.status || "failed"), updatedAt: new Date() } }); return res.json({ success: true, processed: true }); }
    return res.json({ success: true, processed: true, ignoredEvent: event });
  } catch (e: any) { if (String(e.message).endsWith("_NOT_CONFIGURED")) return fail(res, 503, "Webhook is not configured"); console.error("membership/payment-webhook", e); return fail(res, 500, "Webhook processing failed"); }
}
