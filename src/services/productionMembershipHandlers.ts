import crypto from "node:crypto";
import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import type { AuthenticatedRequest } from "../server/auth.js";
import { getMongoDb, getMongoClient } from "../server/mongodb.js";
import { writeAuditLog } from "../server/domainRepositories.js";

export const MEMBERSHIP_PLAN = { id: "MEMBERSHIP-3999", name: "Gaming Elite Membership", pricePaise: 399900, normalHours: 50, vipHours: 5, validityDays: 30 } as const;
function fail(res: Response, status: number, error: string) { return res.status(status).json({ success: false, error }); }
function actor(req: Request) { return (req as AuthenticatedRequest).user; }
function key(req: Request) { return String(req.header("Idempotency-Key") || req.body?.idempotencyKey || "").trim(); }
function membershipQuery(value: string) { return /^[a-f0-9]{24}$/i.test(value) ? [{ _id: new ObjectId(value) }, { id: value }] : [{ id: value }]; }
function safeMembership(m: any) { if (!m) return m; const { _id, ...safe } = m; return safe; }

export async function handleMembershipMe(req: Request, res: Response) {
  const u = actor(req); if (!u) return fail(res, 401, "Authentication required");
  const db = await getMongoDb(); const now = new Date();
  await db.collection("customer_memberships").updateMany({ customerId: u.id, status: "ACTIVE", expiresAt: { $lte: now } }, { $set: { status: "EXPIRED", updatedAt: now } });
  const membership = await db.collection("customer_memberships").findOne({ customerId: u.id, status: "ACTIVE", expiresAt: { $gt: now } }, { sort: { expiresAt: -1 } });
  return res.json({ success: true, membership: safeMembership(membership), plan: MEMBERSHIP_PLAN });
}

export async function handlePurchaseMembership(req: Request, res: Response) {
  const u = actor(req); if (!u) return fail(res, 401, "Authentication required");
  const idempotencyKey = key(req); if (idempotencyKey.length < 16 || idempotencyKey.length > 128) return fail(res, 400, "A valid Idempotency-Key is required");
  const requestedMethod = String(req.body?.paymentMethod || "UPI"); if (!["UPI", "Card", "Cash", "Wallet"].includes(requestedMethod)) return fail(res, 400, "Unsupported payment method");
  const db = await getMongoDb();
  const existing = await db.collection("customer_memberships").findOne({ customerId: u.id, purchaseIdempotencyKey: idempotencyKey });
  if (existing) {
    const samePlan = existing.planId === MEMBERSHIP_PLAN.id && Number(existing.pricePaise) === MEMBERSHIP_PLAN.pricePaise && String(existing.paymentMethod) === requestedMethod;
    if (!samePlan) return fail(res, 409, "Idempotency key was already used for a different membership purchase");
    return res.json({ success: true, membership: safeMembership(existing), duplicate: true });
  }
  const now = new Date();
  await db.collection("customer_memberships").updateMany({ customerId: u.id, status: "ACTIVE", expiresAt: { $lte: now } }, { $set: { status: "EXPIRED", updatedAt: now } });
  const active = await db.collection("customer_memberships").findOne({ customerId: u.id, status: "ACTIVE", expiresAt: { $gt: now } }); if (active) return fail(res, 409, "An active membership already exists");
  const membership = { id: `MEM-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`, customerId: u.id, planId: MEMBERSHIP_PLAN.id, planName: MEMBERSHIP_PLAN.name, pricePaise: MEMBERSHIP_PLAN.pricePaise, currency: "INR", normalHoursTotal: MEMBERSHIP_PLAN.normalHours, normalHoursRemaining: MEMBERSHIP_PLAN.normalHours, vipHoursTotal: MEMBERSHIP_PLAN.vipHours, vipHoursRemaining: MEMBERSHIP_PLAN.vipHours, status: "PENDING_PAYMENT", startsAt: null, expiresAt: null, paymentMethod: requestedMethod, paymentStatus: "PENDING", purchaseIdempotencyKey: idempotencyKey, createdAt: now, updatedAt: now };
  try { await db.collection("customer_memberships").insertOne(membership); } catch (e: any) { if (e?.code === 11000) { const duplicate = await db.collection("customer_memberships").findOne({ customerId: u.id, purchaseIdempotencyKey: idempotencyKey }); if (duplicate) return res.json({ success: true, membership: safeMembership(duplicate), duplicate: true }); } throw e; }
  await writeAuditLog({ actorId: u.id, actorRole: u.role, action: "MEMBERSHIP_PURCHASE_CREATED", entityType: "customer_membership", entityId: membership.id, metadata: { planId: MEMBERSHIP_PLAN.id, pricePaise: MEMBERSHIP_PLAN.pricePaise, paymentMethod: requestedMethod } });
  return res.status(201).json({ success: true, membership: safeMembership(membership), paymentRequired: true, paymentAmountPaise: MEMBERSHIP_PLAN.pricePaise });
}

export async function handleActivateMembership(membershipId: string, paymentId: string, actorId: string, actorRole?: string) {
  const db = await getMongoDb(); const now = new Date(); const expiresAt = new Date(now.getTime() + MEMBERSHIP_PLAN.validityDays * 86400000);
  const client = getMongoClient(); if (!client) throw new Error("MONGO_TX_UNAVAILABLE"); const session = client.startSession(); let membership: any = null;
  try { await session.withTransaction(async () => {
    const pending = await db.collection("customer_memberships").findOne({ $or: membershipQuery(membershipId), status: "PENDING_PAYMENT", paymentStatus: "PENDING" }, { session });
    if (!pending) { membership = await db.collection("customer_memberships").findOne({ $or: membershipQuery(membershipId), paymentId }, { session }); return; }
    const active = await db.collection("customer_memberships").findOne({ customerId: pending.customerId, status: "ACTIVE", expiresAt: { $gt: now } }, { session }); if (active) throw new Error("ACTIVE_MEMBERSHIP_EXISTS");
    membership = await db.collection("customer_memberships").findOneAndUpdate({ _id: pending._id, status: "PENDING_PAYMENT", paymentStatus: "PENDING" }, { $set: { status: "ACTIVE", paymentStatus: "PAID", paymentId, startsAt: now, expiresAt, updatedAt: now } }, { session, returnDocument: "after" });
  }); } finally { await session.endSession(); }
  if (!membership) return null;
  await writeAuditLog({ actorId, actorRole, action: "MEMBERSHIP_ACTIVATED", entityType: "customer_membership", entityId: membership.id, metadata: { paymentId, expiresAt: membership.expiresAt instanceof Date ? membership.expiresAt.toISOString() : String(membership.expiresAt) } }); return membership;
}

export async function handleConsumeMembershipHours(req: Request, res: Response) {
  const u = actor(req); if (!u) return fail(res, 401, "Authentication required");
  const membershipId = String(req.body?.membershipId || "").trim(); const hours = Number(req.body?.hours); const vip = Boolean(req.body?.vip); const idempotencyKey = key(req);
  if (!membershipId || !Number.isFinite(hours) || hours <= 0 || hours > 12 || hours % 0.5 !== 0) return fail(res, 400, "Invalid membership usage"); if (idempotencyKey.length < 16 || idempotencyKey.length > 128) return fail(res, 400, "A valid Idempotency-Key is required");
  const db = await getMongoDb(); const client = getMongoClient(); if (!client) return fail(res, 503, "MongoDB transaction support is unavailable"); const session = client.startSession(); const now = new Date(); let updated: any = null;
  try { await session.withTransaction(async () => { const existing = await db.collection("wallet_transactions").findOne({ customerId: u.id, idempotencyKey }, { session }); if (existing) { if (Number(existing.hours) !== hours || Boolean(existing.vip) !== vip || String(existing.membershipId) !== membershipId) throw new Error("IDEMPOTENCY_MISMATCH"); updated = await db.collection("customer_memberships").findOne({ $or: membershipQuery(membershipId), customerId: u.id }, { session }); return; }
    const membership = await db.collection("customer_memberships").findOne({ $or: membershipQuery(membershipId), customerId: u.id, status: "ACTIVE", expiresAt: { $gt: now } }, { session }); if (!membership) throw new Error("MEMBERSHIP_NOT_ACTIVE");
    const field = vip ? "vipHoursRemaining" : "normalHoursRemaining"; if (Number(membership[field] || 0) < hours) throw new Error("INSUFFICIENT_MEMBERSHIP_HOURS");
    updated = await db.collection("customer_memberships").findOneAndUpdate({ _id: membership._id, customerId: u.id, status: "ACTIVE", expiresAt: { $gt: now }, [field]: { $gte: hours } }, { $inc: { [field]: -hours }, $set: { updatedAt: now } }, { session, returnDocument: "after" }); if (!updated) throw new Error("MEMBERSHIP_USAGE_CONFLICT");
    await db.collection("wallet_transactions").insertOne({ id: `MEMUSE-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`, customerId: u.id, type: "MEMBERSHIP_USAGE", amountPaise: 0, hours, vip, membershipId: membership.id, source: "MEMBERSHIP", currency: "INR", idempotencyKey, createdAt: now }, { session });
  });
    await writeAuditLog({ actorId: u.id, actorRole: u.role, action: "MEMBERSHIP_HOURS_CONSUMED", entityType: "customer_membership", entityId: membershipId, metadata: { hours, vip } }); return res.json({ success: true, membership: safeMembership(updated) });
  } catch (e: any) { if (e.message === "IDEMPOTENCY_MISMATCH") return fail(res, 409, "Idempotency key was already used with different membership usage"); if (e.message === "MEMBERSHIP_NOT_ACTIVE") return fail(res, 409, "Membership is not active"); if (e.message === "INSUFFICIENT_MEMBERSHIP_HOURS") return fail(res, 409, "Insufficient membership hours"); if (e.message === "MEMBERSHIP_USAGE_CONFLICT") return fail(res, 409, "Membership usage conflict; retry"); console.error("membership/consume", e); return fail(res, 500, "Unable to consume membership hours"); } finally { await session.endSession(); }
}

export async function handleExpireMemberships(_req: Request, res: Response) { const db = await getMongoDb(); const now = new Date(); const result = await db.collection("customer_memberships").updateMany({ status: "ACTIVE", expiresAt: { $lte: now } }, { $set: { status: "EXPIRED", updatedAt: now } }); return res.json({ success: true, expired: result.modifiedCount }); }
