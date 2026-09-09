import crypto from "node:crypto";
import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../server/auth.js";
import { getMongoDb, getMongoClient } from "../server/mongodb.js";
import { writeAuditLog } from "../server/domainRepositories.js";

const PLAN = { id: "MEMBERSHIP-3999", name: "Gaming Elite Membership", pricePaise: 399900, normalHours: 50, vipHours: 5, validityDays: 30 };
const VALID_STATUSES = ["ACTIVE", "EXPIRED", "CANCELLED"];
function fail(res: Response, status: number, error: string) { return res.status(status).json({ success: false, error }); }
function actor(req: Request) { return (req as AuthenticatedRequest).user; }
function key(req: Request) { return String(req.header("Idempotency-Key") || req.body?.idempotencyKey || "").trim(); }
function oidOrId(value: string) { return /^[a-f0-9]{24}$/i.test(value) ? [{ _id: new (requireMongoObjectId())(value) }, { id: value }] : [{ id: value }]; }
function requireMongoObjectId() { return (require("mongodb") as typeof import("mongodb")).ObjectId; }
function membershipProjection(m: any) { if (!m) return m; const { _id, ...safe } = m; return safe; }

export async function handleMembershipMe(req: Request, res: Response) {
  const u = actor(req); if (!u) return fail(res, 401, "Authentication required");
  const db = await getMongoDb(); const now = new Date();
  await db.collection("customer_memberships").updateMany({ customerId: u.id, status: "ACTIVE", expiresAt: { $lte: now } }, { $set: { status: "EXPIRED", updatedAt: now } });
  const membership = await db.collection("customer_memberships").findOne({ customerId: u.id, status: "ACTIVE" }, { sort: { expiresAt: -1 } });
  return res.json({ success: true, membership: membershipProjection(membership), plan: PLAN });
}

export async function handlePurchaseMembership(req: Request, res: Response) {
  const u = actor(req); if (!u) return fail(res, 401, "Authentication required");
  const idempotencyKey = key(req); if (idempotencyKey.length < 16 || idempotencyKey.length > 128) return fail(res, 400, "A valid Idempotency-Key is required");
  const paymentMethod = ["UPI", "Card", "Cash", "Wallet"].includes(String(req.body?.paymentMethod)) ? String(req.body.paymentMethod) : "UPI";
  const db = await getMongoDb(); const existing = await db.collection("customer_memberships").findOne({ customerId: u.id, purchaseIdempotencyKey: idempotencyKey }); if (existing) return res.json({ success: true, membership: membershipProjection(existing), duplicate: true });
  const active = await db.collection("customer_memberships").findOne({ customerId: u.id, status: "ACTIVE", expiresAt: { $gt: new Date() } }); if (active) return fail(res, 409, "An active membership already exists");
  const now = new Date(); const expiresAt = new Date(now.getTime() + PLAN.validityDays * 86400000); const membership = { id: `MEM-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`, customerId: u.id, planId: PLAN.id, planName: PLAN.name, pricePaise: PLAN.pricePaise, currency: "INR", normalHoursTotal: PLAN.normalHours, normalHoursRemaining: PLAN.normalHours, vipHoursTotal: PLAN.vipHours, vipHoursRemaining: PLAN.vipHours, status: "ACTIVE", startsAt: now, expiresAt, paymentMethod, paymentStatus: paymentMethod === "Cash" ? "PENDING" : "PENDING", purchaseIdempotencyKey: idempotencyKey, createdAt: now, updatedAt: now };
  await db.collection("customer_memberships").insertOne(membership);
  await writeAuditLog({ actorId: u.id, actorRole: u.role, action: "MEMBERSHIP_PURCHASE_CREATED", entityType: "customer_membership", entityId: membership.id, metadata: { planId: PLAN.id, pricePaise: PLAN.pricePaise, paymentMethod } });
  return res.status(201).json({ success: true, membership: membershipProjection(membership), paymentRequired: true, paymentAmountPaise: PLAN.pricePaise });
}

export async function handleConsumeMembershipHours(req: Request, res: Response) {
  const u = actor(req); if (!u) return fail(res, 401, "Authentication required");
  const membershipId = String(req.body?.membershipId || "").trim(); const hours = Number(req.body?.hours); const vip = Boolean(req.body?.vip); const idempotencyKey = key(req);
  if (!membershipId || !Number.isFinite(hours) || hours <= 0 || hours > 12 || hours % 0.5 !== 0) return fail(res, 400, "Invalid membership usage"); if (idempotencyKey.length < 16 || idempotencyKey.length > 128) return fail(res, 400, "A valid Idempotency-Key is required");
  const db = await getMongoDb(); const client = getMongoClient(); if (!client) return fail(res, 503, "MongoDB transaction support is unavailable"); const session = client.startSession(); const now = new Date();
  try { let updated: any = null; await session.withTransaction(async () => { const existing = await db.collection("wallet_transactions").findOne({ customerId: u.id, idempotencyKey }, { session }); if (existing) return;
    const membership = await db.collection("customer_memberships").findOne({ $or: oidOrId(membershipId), customerId: u.id, status: "ACTIVE", expiresAt: { $gt: now } }, { session }); if (!membership) throw new Error("MEMBERSHIP_NOT_ACTIVE");
    const field = vip ? "vipHoursRemaining" : "normalHoursRemaining"; const available = Number(membership[field] || 0); if (available < hours) throw new Error("INSUFFICIENT_MEMBERSHIP_HOURS");
    updated = await db.collection("customer_memberships").findOneAndUpdate({ _id: membership._id, [field]: { $gte: hours }, status: "ACTIVE" }, { $inc: { [field]: -hours }, $set: { updatedAt: now } }, { session, returnDocument: "after" });
    if (!updated) throw new Error("MEMBERSHIP_USAGE_CONFLICT");
    await db.collection("wallet_transactions").insertOne({ id: `MEMUSE-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`, customerId: u.id, type: "MEMBERSHIP_USAGE", amountPaise: 0, hours, vip, membershipId: membership.id, source: "MEMBERSHIP", currency: "INR", idempotencyKey, createdAt: now }, { session });
  }); await writeAuditLog({ actorId: u.id, actorRole: u.role, action: "MEMBERSHIP_HOURS_CONSUMED", entityType: "customer_membership", entityId: membershipId, metadata: { hours, vip } }); return res.json({ success: true, membership: membershipProjection(updated) });
  } catch (e: any) { if (e.message === "MEMBERSHIP_NOT_ACTIVE") return fail(res, 409, "Membership is not active"); if (e.message === "INSUFFICIENT_MEMBERSHIP_HOURS") return fail(res, 409, "Insufficient membership hours"); if (e.message === "MEMBERSHIP_USAGE_CONFLICT") return fail(res, 409, "Membership usage conflict; retry"); throw e; } finally { await session.endSession(); }
}

export async function handleExpireMemberships(_req: Request, res: Response) { const db = await getMongoDb(); const result = await db.collection("customer_memberships").updateMany({ status: "ACTIVE", expiresAt: { $lte: new Date() } }, { $set: { status: "EXPIRED", updatedAt: new Date() } }); return res.json({ success: true, expired: result.modifiedCount }); }
