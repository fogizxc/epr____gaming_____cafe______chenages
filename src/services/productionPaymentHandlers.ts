import crypto from "node:crypto";
import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../server/auth.js";
import { getMongoDb } from "../server/mongodb.js";
import { writeAuditLog } from "../server/domainRepositories.js";

const RAZORPAY_BASE = "https://api.razorpay.com/v1";

function fail(res: Response, status: number, error: string) { return res.status(status).json({ success: false, error }); }
function actor(req: Request) { return (req as AuthenticatedRequest).user; }
function requiredEnv(name: string) { const value = process.env[name]?.trim(); if (!value) throw new Error(`${name}_NOT_CONFIGURED`); return value; }
function safeEqual(a: string, b: string) { const aa = Buffer.from(a, "utf8"); const bb = Buffer.from(b, "utf8"); return aa.length === bb.length && crypto.timingSafeEqual(aa, bb); }
function signature(orderId: string, paymentId: string, secret: string) { return crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex"); }

async function razorpay(path: string, init: RequestInit = {}) {
  const key = requiredEnv("RAZORPAY_KEY_ID");
  const secret = requiredEnv("RAZORPAY_KEY_SECRET");
  const response = await fetch(`${RAZORPAY_BASE}${path}`, { ...init, headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`, ...(init.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error("RAZORPAY_REQUEST_FAILED"); (error as any).status = response.status; (error as any).provider = body; throw error; }
  return body;
}

async function findCustomerBooking(db: any, bookingId: string, customerId: string) {
  const clauses: any[] = [{ id: bookingId }];
  if (/^[a-f0-9]{24}$/i.test(bookingId)) {
    const { ObjectId } = await import("mongodb");
    clauses.push({ _id: new ObjectId(bookingId) });
  }
  return db.collection("bookings").findOne({ $or: clauses, customerId });
}

export async function handleProductionCreatePaymentOrder(req: Request, res: Response) {
  const user = actor(req); if (!user) return fail(res, 401, "Authentication required");
  const bookingId = String(req.body?.bookingId || "").trim();
  const idempotencyKey = String(req.header("Idempotency-Key") || req.body?.idempotencyKey || "").trim();
  if (!bookingId) return fail(res, 400, "bookingId is required");
  if (idempotencyKey.length < 16 || idempotencyKey.length > 128) return fail(res, 400, "A valid Idempotency-Key is required");
  try {
    const db = await getMongoDb();
    const existing = await db.collection("payments").findOne({ customerId: user.id, idempotencyKey });
    if (existing?.providerOrderId) return res.json({ success: true, payment: existing, duplicate: true });
    const booking = await findCustomerBooking(db, bookingId, user.id);
    if (!booking) return fail(res, 404, "Booking not found");
    if (["CANCELLED", "NO-SHOW", "COMPLETED"].includes(String(booking.bookingStatus))) return fail(res, 409, "Booking is not payable");
    const amountPaise = Number(booking.totalAmountPaise ?? (Number(booking.totalAmount || 0) * 100));
    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) return fail(res, 409, "Booking does not have a payable amount");
    const providerOrder = await razorpay("/orders", { method: "POST", body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt: String(booking.id).slice(0, 40), notes: { bookingId: String(booking.id), customerId: user.id } }) });
    const now = new Date();
    const payment = { id: `PAY-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`, customerId: user.id, bookingId: booking.id, provider: "RAZORPAY", providerOrderId: providerOrder.id, amountPaise, currency: "INR", status: "CREATED", idempotencyKey, createdAt: now, updatedAt: now };
    try {
      await db.collection("payments").insertOne(payment);
    } catch (insertError: any) {
      if (insertError?.code === 11000) {
        const duplicate = await db.collection("payments").findOne({ customerId: user.id, idempotencyKey });
        if (duplicate) return res.json({ success: true, payment: duplicate, duplicate: true });
      }
      throw insertError;
    }
    await writeAuditLog({ actorId: user.id, actorRole: user.role, action: "PAYMENT_ORDER_CREATED", entityType: "payment", entityId: payment.id, metadata: { bookingId: booking.id, amountPaise, providerOrderId: providerOrder.id } });
    return res.status(201).json({ success: true, payment, razorpay: { keyId: requiredEnv("RAZORPAY_KEY_ID"), orderId: providerOrder.id, amount: amountPaise, currency: "INR" } });
  } catch (error: any) {
    if (error.message === "RAZORPAY_KEY_ID_NOT_CONFIGURED" || error.message === "RAZORPAY_KEY_SECRET_NOT_CONFIGURED") return fail(res, 503, "Payment provider is not configured");
    console.error("payment/create-order", error); return fail(res, 502, "Unable to create payment order");
  }
}

export async function handleProductionVerifyPayment(req: Request, res: Response) {
  const user = actor(req); if (!user) return fail(res, 401, "Authentication required");
  const orderId = String(req.body?.razorpay_order_id || req.body?.orderId || "").trim();
  const paymentId = String(req.body?.razorpay_payment_id || req.body?.paymentId || "").trim();
  const suppliedSignature = String(req.body?.razorpay_signature || req.body?.signature || "").trim();
  if (!orderId || !paymentId || !suppliedSignature) return fail(res, 400, "orderId, paymentId and signature are required");
  try {
    const secret = requiredEnv("RAZORPAY_KEY_SECRET");
    if (!safeEqual(signature(orderId, paymentId, secret), suppliedSignature)) return fail(res, 400, "Invalid payment signature");
    const db = await getMongoDb();
    const payment = await db.collection("payments").findOne({ provider: "RAZORPAY", providerOrderId: orderId, customerId: user.id });
    if (!payment) return fail(res, 404, "Payment order not found");
    if (payment.status === "CAPTURED") return res.json({ success: true, payment, duplicate: true });

    // Never trust the browser's amount. Confirm the provider-side payment belongs
    // to this order and is captured for the exact expected amount/currency.
    const providerPayment = await razorpay(`/payments/${encodeURIComponent(paymentId)}`);
    if (String(providerPayment.order_id) !== orderId) return fail(res, 400, "Payment does not belong to this order");
    if (String(providerPayment.currency) !== "INR") return fail(res, 400, "Unsupported payment currency");
    if (Number(providerPayment.amount) !== Number(payment.amountPaise)) return fail(res, 400, "Payment amount mismatch");
    if (!['captured', 'authorized'].includes(String(providerPayment.status))) return fail(res, 409, "Payment has not been captured");
    const updated = await db.collection("payments").findOneAndUpdate({ _id: payment._id, status: { $ne: "CAPTURED" } }, { $set: { status: "CAPTURED", providerPaymentId: paymentId, providerStatus: providerPayment.status, providerSignatureVerifiedAt: new Date(), capturedAt: new Date(), updatedAt: new Date() } }, { returnDocument: "after" });
    if (!updated) return fail(res, 409, "Payment state changed; refresh and retry");
    await db.collection("bookings").updateOne({ id: payment.bookingId, customerId: user.id, paymentStatus: { $ne: "PAID" } }, { $set: { paymentStatus: "PAID", paidAt: new Date().toISOString(), paymentId: updated.id, updatedAt: new Date() } });
    await writeAuditLog({ actorId: user.id, actorRole: user.role, action: "PAYMENT_CAPTURED", entityType: "payment", entityId: updated.id, metadata: { providerOrderId: orderId, providerPaymentId: paymentId } });
    return res.json({ success: true, payment: updated });
  } catch (error: any) {
    if (error.message === "RAZORPAY_KEY_SECRET_NOT_CONFIGURED") return fail(res, 503, "Payment provider is not configured");
    console.error("payment/verify", error); return fail(res, 502, "Unable to verify payment");
  }
}

export async function handleProductionPaymentWebhook(req: Request, res: Response) {
  try {
    const secret = requiredEnv("RAZORPAY_WEBHOOK_SECRET");
    const signatureHeader = req.header("X-Razorpay-Signature") || "";
    const rawBody = (req as any).rawBody as Buffer | undefined;
    if (!rawBody || rawBody.length === 0) return fail(res, 400, "Missing raw webhook body");
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (!safeEqual(expected, signatureHeader)) return fail(res, 400, "Invalid webhook signature");

    const event = String(req.body?.event || "");
    const entity = req.body?.payload?.payment?.entity;
    if (!entity?.id || !entity?.order_id) return res.json({ success: true, ignored: true });
    const webhookKey = String(req.body?.id || `${event}:${entity.id}:${entity.order_id}`).slice(0, 250);
    const db = await getMongoDb();
    try {
      await db.collection("razorpay_webhook_events").insertOne({ key: webhookKey, event, paymentId: entity.id, orderId: entity.order_id, receivedAt: new Date() });
    } catch (error: any) {
      if (error?.code === 11000) return res.json({ success: true, duplicate: true });
      throw error;
    }

    const update: any = { providerPaymentId: entity.id, providerStatus: entity.status, webhookEvent: event, webhookVerifiedAt: new Date(), updatedAt: new Date() };
    if (event === "payment.captured") update.status = "CAPTURED";
    else if (event === "payment.failed") update.status = "FAILED";
    const payment = await db.collection("payments").findOneAndUpdate({ provider: "RAZORPAY", providerOrderId: entity.order_id }, { $set: update }, { returnDocument: "after" });
    if (payment && update.status === "CAPTURED") await db.collection("bookings").updateOne({ id: payment.bookingId, paymentStatus: { $ne: "PAID" } }, { $set: { paymentStatus: "PAID", paidAt: new Date().toISOString(), paymentId: payment.id, updatedAt: new Date() } });
    return res.json({ success: true, processed: Boolean(payment) });
  } catch (error: any) {
    if (error.message === "RAZORPAY_WEBHOOK_SECRET_NOT_CONFIGURED") return fail(res, 503, "Webhook is not configured");
    console.error("payment/webhook", error); return fail(res, 500, "Webhook processing failed");
  }
}
