import crypto from "node:crypto";
import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import type { AuthenticatedRequest } from "../server/auth.js";
import { getMongoDb } from "../server/mongodb.js";
import { writeAuditLog } from "../server/domainRepositories.js";

function user(req: Request) { return (req as AuthenticatedRequest).user; }
function fail(res: Response, status: number, error: string) { return res.status(status).json({ success: false, error }); }
function idempotency(req: Request) { return String(req.header("Idempotency-Key") || req.body?.idempotencyKey || "").trim(); }
function moneyPaise(value: unknown) { const n = Number(value); return Number.isSafeInteger(n) && n > 0 ? n : 0; }
function makeId(prefix: string) { return `${prefix}-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`; }

async function bookingForCustomer(db: any, bookingId: string, customerId: string) {
  const clauses: any[] = [{ id: bookingId }];
  if (ObjectId.isValid(bookingId)) clauses.push({ _id: new ObjectId(bookingId) });
  return db.collection("bookings").findOne({ $or: clauses, customerId });
}

export async function handleProductionCreateInvoice(req: Request, res: Response) {
  const u = user(req); if (!u) return fail(res, 401, "Authentication required");
  const bookingId = String(req.body?.bookingId || "").trim();
  if (!bookingId) return fail(res, 400, "bookingId is required");
  const db = await getMongoDb();
  const booking = await bookingForCustomer(db, bookingId, u.id);
  if (!booking) return fail(res, 404, "Booking not found");
  if (booking.paymentStatus !== "PAID") return fail(res, 409, "Invoice can only be issued for a paid booking");
  const existing = await db.collection("invoices").findOne({ bookingId: booking.id, status: { $ne: "VOID" } });
  if (existing) return res.json({ success: true, invoice: existing, duplicate: true });
  const amountPaise = moneyPaise(booking.totalAmountPaise || Number(booking.totalAmount || 0) * 100);
  if (!amountPaise) return fail(res, 409, "Booking has no valid payable amount");
  const now = new Date();
  const invoice = { id: makeId("INV"), invoiceNumber: `BC-${now.getFullYear()}-${String(Date.now()).slice(-8)}`, bookingId: booking.id, customerId: u.id, status: "ISSUED", paymentStatus: "PAID", currency: "INR", subtotalPaise: amountPaise, taxPaise: 0, discountPaise: 0, totalPaise: amountPaise, issuedAt: now, createdAt: now, updatedAt: now, immutable: true, items: [{ description: `${booking.service || "Gaming"} session`, quantity: 1, amountPaise }] };
  await db.collection("invoices").insertOne(invoice);
  await writeAuditLog({ actorId: u.id, actorRole: u.role, action: "INVOICE_ISSUED", entityType: "invoice", entityId: invoice.id, metadata: { bookingId: booking.id, totalPaise: amountPaise } });
  return res.status(201).json({ success: true, invoice });
}

export async function handleProductionWalletBalance(req: Request, res: Response) {
  const u = user(req); if (!u) return fail(res, 401, "Authentication required");
  const db = await getMongoDb();
  const account = await db.collection("wallet_accounts").findOne({ customerId: u.id });
  return res.json({ success: true, balancePaise: Number(account?.balancePaise || 0), currency: "INR" });
}

export async function handleProductionWalletCredit(req: Request, res: Response) {
  const u = user(req); if (!u) return fail(res, 401, "Authentication required");
  const key = idempotency(req); if (key.length < 16 || key.length > 128) return fail(res, 400, "A valid Idempotency-Key is required");
  const amountPaise = moneyPaise(req.body?.amountPaise ?? Number(req.body?.amount || 0) * 100);
  if (!amountPaise || amountPaise > 10000000) return fail(res, 400, "Invalid wallet amount");
  const db = await getMongoDb();
  const existing = await db.collection("wallet_transactions").findOne({ customerId: u.id, idempotencyKey: key });
  if (existing) return res.json({ success: true, transaction: existing, duplicate: true });
  const now = new Date();
  const transaction = { id: makeId("WT"), customerId: u.id, type: "CREDIT", source: String(req.body?.source || "PAYMENT"), amountPaise, currency: "INR", idempotencyKey: key, createdAt: now };
  const session = db.client?.startSession?.();
  try {
    if (!session) { await db.collection("wallet_transactions").insertOne(transaction); }
    else {
      await session.withTransaction(async () => {
        const duplicate = await db.collection("wallet_transactions").findOne({ customerId: u.id, idempotencyKey: key }, { session });
        if (duplicate) return;
        await db.collection("wallet_transactions").insertOne(transaction, { session });
        await db.collection("wallet_accounts").updateOne({ customerId: u.id }, { $inc: { balancePaise: amountPaise }, $set: { updatedAt: now }, $setOnInsert: { customerId: u.id, currency: "INR", createdAt: now } }, { upsert: true, session });
      });
    }
  } finally { await session?.endSession(); }
  await writeAuditLog({ actorId: u.id, actorRole: u.role, action: "WALLET_CREDITED", entityType: "wallet_transaction", entityId: transaction.id, metadata: { amountPaise } });
  return res.status(201).json({ success: true, transaction });
}

export async function handleProductionRequestRefund(req: Request, res: Response) {
  const u = user(req); if (!u) return fail(res, 401, "Authentication required");
  const bookingId = String(req.body?.bookingId || "").trim();
  const amountPaise = moneyPaise(req.body?.amountPaise ?? Number(req.body?.amount || 0) * 100);
  if (!bookingId || !amountPaise) return fail(res, 400, "bookingId and amount are required");
  const db = await getMongoDb();
  const booking = await bookingForCustomer(db, bookingId, u.id);
  if (!booking) return fail(res, 404, "Booking not found");
  const paidPaise = moneyPaise(booking.totalAmountPaise || Number(booking.totalAmount || 0) * 100);
  if (amountPaise > paidPaise) return fail(res, 400, "Refund exceeds booking amount");
  const existing = await db.collection("refunds").findOne({ bookingId: booking.id, status: { $in: ["REQUESTED", "APPROVED", "PROCESSING", "COMPLETED"] } });
  if (existing) return res.json({ success: true, refund: existing, duplicate: true });
  const now = new Date();
  const refund = { id: makeId("REF"), bookingId: booking.id, customerId: u.id, amountPaise, currency: "INR", reason: String(req.body?.reason || "Customer refund request").slice(0, 250), status: "REQUESTED", createdAt: now, updatedAt: now };
  await db.collection("refunds").insertOne(refund);
  await writeAuditLog({ actorId: u.id, actorRole: u.role, action: "REFUND_REQUESTED", entityType: "refund", entityId: refund.id, metadata: { bookingId: booking.id, amountPaise } });
  return res.status(201).json({ success: true, refund });
}
