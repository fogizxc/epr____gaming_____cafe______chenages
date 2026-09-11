import crypto from "node:crypto";
import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getMongoDb } from "../server/mongodb.js";
import { writeAuditLog, withTransaction } from "../server/domainRepositories.js";
import { recordFinancialTransaction } from "./financialLedger.js";
import type { AuthenticatedRequest } from "../server/auth.js";

const fail = (res: Response, status: number, error: string) => res.status(status).json({ success: false, error });
const actor = (req: Request) => (req as AuthenticatedRequest).user;
const idFilter = (id: string) => ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };
function env(name: string) { const v = process.env[name]?.trim(); if (!v) throw new Error(`${name}_NOT_CONFIGURED`); return v; }
async function razorpayRefund(paymentId: string, amountPaise: number, receipt: string) { const key = env("RAZORPAY_KEY_ID"); const secret = env("RAZORPAY_KEY_SECRET"); const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}` }, body: JSON.stringify({ amount: amountPaise, speed: "normal", receipt }) }); const body = await response.json().catch(() => ({})); if (!response.ok) { const e: any = new Error("RAZORPAY_REFUND_FAILED"); e.status = response.status; e.provider = body; throw e; } return body; }

async function validateRefundAmount(db: any, payment: any, amountPaise: number, excludeRefundId?: string) {
  const captured = Number(payment.amountPaise || 0); const already = Number(payment.refundedAmountPaise || 0);
  const rows = await db.collection("refunds").find({ paymentId: payment.id, status: { $in: ["COMPLETED", "PROCESSING"] }, ...(excludeRefundId ? { id: { $ne: excludeRefundId } } : {}) }).toArray();
  const requested = rows.reduce((n: number, r: any) => n + Number(r.amountPaise || 0), 0);
  if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) throw new Error("INVALID_REFUND_AMOUNT");
  if (amountPaise + Math.max(already, requested) > captured) throw new Error("REFUND_EXCEEDS_CAPTURED_AMOUNT");
}

export async function handleAdminProcessRefund(req: Request, res: Response) {
  const u = actor(req); if (!u || !["ADMIN", "SUPER_ADMIN"].includes(String(u.role))) return fail(res, 403, "Admin access required");
  const refundId = String(req.params.id || "").trim(); if (!refundId) return fail(res, 400, "Refund id is required"); const action = String(req.body?.action || "").toUpperCase(); if (!["APPROVE", "REJECT", "PROCESS"].includes(action)) return fail(res, 400, "Invalid refund action");
  const db = await getMongoDb(); const refund = await db.collection("refunds").findOne(idFilter(refundId)); if (!refund) return fail(res, 404, "Refund not found"); const now = new Date();
  if (action === "REJECT") { if (!["REQUESTED", "APPROVED"].includes(refund.status)) return fail(res, 409, "Refund cannot be rejected in its current state"); await db.collection("refunds").updateOne({ ...idFilter(refundId), status: refund.status }, { $set: { status: "REJECTED", rejectedBy: u.id, rejectedAt: now, updatedAt: now } }); await writeAuditLog({ actorId: u.id, actorRole: u.role, action: "REFUND_REJECTED", entityType: "refund", entityId: refund.id }); return res.json({ success: true, status: "REJECTED" }); }
  if (action === "APPROVE") { if (refund.status !== "REQUESTED") return fail(res, 409, "Refund is not awaiting approval"); await db.collection("refunds").updateOne({ ...idFilter(refundId), status: "REQUESTED" }, { $set: { status: "APPROVED", approvedBy: u.id, approvedAt: now, updatedAt: now } }); await writeAuditLog({ actorId: u.id, actorRole: u.role, action: "REFUND_APPROVED", entityType: "refund", entityId: refund.id }); return res.json({ success: true, status: "APPROVED" }); }
  if (refund.status !== "APPROVED") return fail(res, 409, "Refund must be approved before processing");
  const paymentQuery = refund.fnbOrderId ? { fnbOrderId: refund.fnbOrderId, provider: "RAZORPAY", status: "CAPTURED", providerPaymentId: { $exists: true } } : { bookingId: refund.bookingId, provider: "RAZORPAY", status: "CAPTURED", providerPaymentId: { $exists: true } };
  const payment = await db.collection("payments").findOne(paymentQuery); if (!payment?.providerPaymentId) return fail(res, 409, "No captured Razorpay payment is linked to this refund");
  const amountPaise = Number(refund.amountPaise); try { await validateRefundAmount(db, payment, amountPaise, refund.id); } catch (e: any) { return fail(res, 409, e.message === "REFUND_EXCEEDS_CAPTURED_AMOUNT" ? "Refund exceeds the captured payment amount" : "Invalid refund amount"); }
  if (refund.providerRefundId) return res.json({ success: true, refund, duplicate: true });
  const claim = await db.collection("refunds").findOneAndUpdate({ ...idFilter(refundId), status: "APPROVED", providerRefundId: { $exists: false } }, { $set: { status: "PROCESSING", processingBy: u.id, processingStartedAt: now, idempotencyKey: `refund:${refund.id}`, paymentId: payment.id, updatedAt: now } }, { returnDocument: "after" });
  if (!claim) return res.status(409).json({ success: false, error: "Refund is already being processed" });
  try {
    const providerRefund = await razorpayRefund(String(payment.providerPaymentId), amountPaise, String(refund.id).slice(0, 40)); const completedAt = new Date();
    await withTransaction(async (tx, session) => {
      const current = await tx.collection("refunds").findOne(idFilter(refundId), { session }); if (!current || current.status !== "PROCESSING") throw new Error("REFUND_STATE_CHANGED");
      const p = await tx.collection("payments").findOne({ _id: payment._id }, { session }); if (!p) throw new Error("PAYMENT_NOT_FOUND");
      await tx.collection("refunds").updateOne({ ...idFilter(refundId), status: "PROCESSING" }, { $set: { status: "COMPLETED", providerRefundId: providerRefund.id, providerStatus: providerRefund.status, completedAt, processedBy: u.id, updatedAt: completedAt } }, { session });
      await tx.collection("payments").updateOne({ _id: payment._id }, { $inc: { refundedAmountPaise: amountPaise }, $set: { refundedAt: completedAt, updatedAt: completedAt } }, { session });
      await recordFinancialTransaction({ id: `REFUND:${refund.id}`, type: "REFUND", source: refund.fnbOrderId ? "FNB" : "REFUND", sourceId: refund.fnbOrderId || refund.bookingId || refund.id, customerId: refund.customerId, paymentId: payment.id, amountPaise, currency: "INR", occurredAt: completedAt, createdAt: completedAt, metadata: { refundId: refund.id, providerRefundId: providerRefund.id } }, { db: tx, session });
    });
    await writeAuditLog({ actorId: u.id, actorRole: u.role, action: "REFUND_COMPLETED", entityType: "refund", entityId: refund.id, metadata: { amountPaise, providerRefundId: providerRefund.id } });
    const completed = await db.collection("refunds").findOne(idFilter(refundId)); return res.json({ success: true, refund: completed, providerRefund: { id: providerRefund.id, status: providerRefund.status, amount: providerRefund.amount } });
  } catch (error: any) {
    await db.collection("refunds").updateOne({ ...idFilter(refundId), status: "PROCESSING" }, { $set: { status: "APPROVED", processingError: "Provider refund succeeded or failed; reconciliation required", updatedAt: new Date() } });
    if (error.message === "RAZORPAY_KEY_ID_NOT_CONFIGURED" || error.message === "RAZORPAY_KEY_SECRET_NOT_CONFIGURED") return fail(res, 503, "Payment provider is not configured");
    if (error.message === "REFUND_STATE_CHANGED") return fail(res, 409, "Refund state changed; reconcile before retrying");
    console.error("refund/process", error); return fail(res, 502, "Refund processing requires reconciliation");
  }
}

export async function handleAdminCreditNote(req: Request, res: Response) {
  const u = actor(req); if (!u || !["ADMIN", "SUPER_ADMIN"].includes(String(u.role))) return fail(res, 403, "Admin access required");
  const refundId = String(req.params.id || "").trim(); const db = await getMongoDb(); const refund = await db.collection("refunds").findOne(idFilter(refundId)); if (!refund) return fail(res, 404, "Refund not found"); if (refund.status !== "COMPLETED") return fail(res, 409, "Credit note requires a completed refund");
  const existing = await db.collection("credit_notes").findOne({ refundId: refund.id }); if (existing) return res.json({ success: true, creditNote: existing, duplicate: true });
  const now = new Date(); const note = { id: `CN-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`, creditNoteNumber: `CN-${now.getFullYear()}-${crypto.randomBytes(5).toString("hex").toUpperCase()}`, refundId: refund.id, bookingId: refund.bookingId || null, fnbOrderId: refund.fnbOrderId || null, customerId: refund.customerId, amountPaise: refund.amountPaise, currency: "INR", reason: refund.reason, status: "ISSUED", issuedAt: now, immutable: true, createdAt: now };
  try { await db.collection("credit_notes").insertOne(note); } catch (e: any) { if (e?.code === 11000) { const duplicate = await db.collection("credit_notes").findOne({ refundId: refund.id }); if (duplicate) return res.json({ success: true, creditNote: duplicate, duplicate: true }); } throw e; }
  await writeAuditLog({ actorId: u.id, actorRole: u.role, action: "CREDIT_NOTE_ISSUED", entityType: "credit_note", entityId: note.id, metadata: { refundId: refund.id, amountPaise: refund.amountPaise } }); return res.status(201).json({ success: true, creditNote: note });
}
