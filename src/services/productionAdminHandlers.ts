import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getMongoDb } from "../server/mongodb.js";
import { withTransaction, writeAuditLog } from "../server/domainRepositories.js";
import { AuthenticatedRequest } from "../server/auth.js";

const asReq = (req: Request) => req as AuthenticatedRequest;
const actor = (req: Request) => ({ actorId: asReq(req).user?.id, actorRole: asReq(req).user?.role });
function bad(res: Response, message: string, code = 400) { return res.status(code).json({ success: false, error: message }); }
function idFilter(id: string) { return ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }; }
function safeLimit(value: unknown, fallback = 100) { const n = Number(value); return Number.isFinite(n) ? Math.min(Math.max(Math.floor(n), 1), 500) : fallback; }

const READ_ONLY_COLLECTIONS = new Set(["audit_logs", "financial_ledger", "payments", "refunds", "credit_notes", "wallet_transactions"]);
const GENERIC_MUTABLE = new Set(["customer_memberships", "fnb_products", "tournaments", "tournament_teams", "tournament_matches", "promotion_codes", "business_settings", "game_media", "maintenance_tickets", "support_tickets", "waitlist", "employee_shifts"]);
const SUPER_ADMIN_ONLY_COLLECTIONS = new Set(["business_settings", "promotion_codes"]);
const FORBIDDEN_FIELDS = new Set(["passwordHash", "passwordSalt", "balancePaise", "amountPaise", "totalPaise", "paymentStatus", "status", "role", "permissions", "providerPaymentId", "providerRefundId", "refundedAmountPaise", "transactionId", "immutable"]);

function ensureAdmin(req: Request, res: Response) {
  const role = String(asReq(req).user?.role || "");
  if (!["ADMIN", "SUPER_ADMIN"].includes(role)) { bad(res, "Admin access required", 403); return false; }
  return true;
}
function ensureSuperAdmin(req: Request, res: Response) {
  if (String(asReq(req).user?.role || "") !== "SUPER_ADMIN") { bad(res, "Super Admin access required", 403); return false; }
  return true;
}
function sanitizeGenericPatch(input: any) {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input || {})) if (!FORBIDDEN_FIELDS.has(key)) output[key] = value;
  return output;
}

export async function handleAdminDashboard(req: Request, res: Response) {
  if (!ensureAdmin(req, res)) return;
  const db = await getMongoDb();
  const today = new Date().toISOString().slice(0, 10);
  const [systems, active, bookings, payments, fnb, users, maintenance, refunds] = await Promise.all([
    db.collection("gaming_systems").find({}).toArray(), db.collection("active_sessions").countDocuments({ status: "ACTIVE" }),
    db.collection("bookings").countDocuments({ date: today }), db.collection("payments").find({ status: { $in: ["CAPTURED", "PAID"] } }).toArray(),
    db.collection("fnb_orders").find({ createdAt: { $gte: new Date(`${today}T00:00:00.000Z`) } }).toArray(), db.collection("users").countDocuments({}),
    db.collection("maintenance_tickets").countDocuments({ status: { $ne: "RESOLVED" } }), db.collection("refunds").countDocuments({ status: { $in: ["REQUESTED", "APPROVED", "PROCESSING"] } }),
  ]);
  const gamingRevenuePaise = payments.reduce((s: number, p: any) => s + Number(p.amountPaise || 0), 0);
  const fnbRevenuePaise = fnb.filter((o: any) => o.paymentStatus === "PAID").reduce((s: number, o: any) => s + Number(o.totalPaise ?? o.totalAmountPaise ?? 0), 0);
  return res.json({ success: true, data: { today, kpis: { gamingRevenuePaise, fnbRevenuePaise, totalRevenuePaise: gamingRevenuePaise + fnbRevenuePaise, activeSessions: active, todayBookings: bookings, customers: users, openMaintenance: maintenance, pendingRefunds: refunds }, stations: systems } });
}

export async function handleAdminStations(req: Request, res: Response) {
  if (!ensureAdmin(req, res)) return; const db = await getMongoDb();
  if (req.method === "GET") return res.json({ success: true, data: await db.collection("gaming_systems").find({}).sort({ category: 1, id: 1 }).toArray() });
  const id = String(req.params.id || ""); if (!id) return bad(res, "Station id is required");
  const patch = req.body || {}; const allowed = ["name", "category", "status", "hourlyRate", "location", "specs", "installedGames", "isActive"];
  const update: Record<string, unknown> = { updatedAt: new Date() }; for (const key of allowed) if (patch[key] !== undefined) update[key] = patch[key];
  if (Object.keys(update).length === 1) return bad(res, "No editable fields supplied");
  if (update.status !== undefined && !["AVAILABLE", "RESERVED", "ACTIVE", "MAINTENANCE", "OFFLINE"].includes(String(update.status))) return bad(res, "Invalid station status");
  const result = await db.collection("gaming_systems").updateOne(idFilter(id), { $set: update }); if (!result.matchedCount) return bad(res, "Station not found", 404);
  await writeAuditLog({ ...actor(req), action: "ADMIN_STATION_UPDATE", entityType: "gaming_system", entityId: id, metadata: update });
  return res.json({ success: true, data: await db.collection("gaming_systems").findOne(idFilter(id)) });
}

export async function handleAdminPricing(req: Request, res: Response) {
  if (!ensureAdmin(req, res)) return; const db = await getMongoDb();
  if (req.method === "GET") return res.json({ success: true, data: await db.collection("pricing_rules").find({}).sort({ service: 1 }).toArray() });
  const { service, normalPrice, peakPrice, weekendPrice } = req.body || {}; if (!service) return bad(res, "service is required");
  const values = { normalPrice: Number(normalPrice), peakPrice: Number(peakPrice), weekendPrice: Number(weekendPrice) };
  if (![values.normalPrice, values.peakPrice, values.weekendPrice].every(Number.isFinite)) return bad(res, "All prices must be numeric");
  if ([values.normalPrice, values.peakPrice, values.weekendPrice].some((v) => v < 0 || v > 1000000)) return bad(res, "Invalid price");
  const now = new Date(); await withTransaction(async (tx, session) => { const before = await tx.collection("pricing_rules").findOne({ service }, { session }); await tx.collection("pricing_rules").updateOne({ service }, { $set: { service, ...values, updatedAt: now } }, { upsert: true, session }); await tx.collection("price_history").insertOne({ service, before, after: values, changedBy: asReq(req).user?.id, createdAt: now }, { session }); });
  await writeAuditLog({ ...actor(req), action: "ADMIN_PRICING_UPDATE", entityType: "pricing_rule", entityId: service, metadata: values }); return res.json({ success: true, data: await db.collection("pricing_rules").findOne({ service }) });
}

export async function handleAdminUsers(req: Request, res: Response) {
  if (!ensureAdmin(req, res)) return; const db = await getMongoDb();
  if (req.method === "GET") { const q = String(req.query.q || "").trim(); const filter: any = {}; if (q) filter.$or = [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }, { phone: { $regex: q, $options: "i" } }, { staffCode: { $regex: q, $options: "i" } }]; const users = await db.collection("users").find(filter, { projection: { passwordHash: 0, passwordSalt: 0 } }).sort({ createdAt: -1 }).limit(safeLimit(req.query.limit)).toArray(); return res.json({ success: true, data: users }); }
  const id = String(req.params.id || ""); if (!id) return bad(res, "User id is required"); const patch = req.body || {};
  if (patch.role === "SUPER_ADMIN" && asReq(req).user?.role !== "SUPER_ADMIN") return bad(res, "Only a Super Admin can assign Super Admin", 403);
  if (String(id) === String(asReq(req).user?.id) && patch.isActive === false) return bad(res, "You cannot deactivate your own account", 409);
  const allowed = ["name", "phone", "role", "isActive", "permissions", "staffCode"]; const update: any = { updatedAt: new Date() }; for (const key of allowed) if (patch[key] !== undefined) update[key] = patch[key];
  if (update.role && !["CUSTOMER", "EMPLOYEE", "ADMIN", "SUPER_ADMIN"].includes(String(update.role))) return bad(res, "Invalid role");
  const result = await db.collection("users").updateOne(idFilter(id), { $set: update }); if (!result.matchedCount) return bad(res, "User not found", 404); await writeAuditLog({ ...actor(req), action: "ADMIN_USER_UPDATE", entityType: "user", entityId: id, metadata: update }); return res.json({ success: true, data: await db.collection("users").findOne(idFilter(id), { projection: { passwordHash: 0, passwordSalt: 0 } }) });
}

export async function handleAdminGames(req: Request, res: Response) {
  if (!ensureAdmin(req, res)) return; const db = await getMongoDb();
  if (req.method === "GET") return res.json({ success: true, data: await db.collection("games").find({}).sort({ title: 1 }).limit(safeLimit(req.query.limit, 500)).toArray() });
  if (req.method === "POST") { const { title, slug, category, description, coverUrl, isVisible = true } = req.body || {}; if (!title || !slug || !category) return bad(res, "title, slug and category are required"); const doc = { title: String(title).trim(), slug: String(slug).trim().toLowerCase(), category, description: String(description || ""), coverUrl: String(coverUrl || ""), isVisible: Boolean(isVisible), createdAt: new Date(), updatedAt: new Date() }; try { const result = await db.collection("games").insertOne(doc); await writeAuditLog({ ...actor(req), action: "ADMIN_GAME_CREATE", entityType: "game", entityId: String(result.insertedId) }); return res.status(201).json({ success: true, data: { ...doc, _id: result.insertedId } }); } catch (e: any) { if (e?.code === 11000) return bad(res, "Game slug already exists", 409); throw e; } }
  const id = String(req.params.id || ""); if (!id) return bad(res, "Game id is required"); const update: any = { updatedAt: new Date() }; for (const key of ["title", "slug", "category", "description", "coverUrl", "isVisible"]) if (req.body?.[key] !== undefined) update[key] = req.body[key]; const result = await db.collection("games").updateOne(idFilter(id), { $set: update }); if (!result.matchedCount) return bad(res, "Game not found", 404); await writeAuditLog({ ...actor(req), action: "ADMIN_GAME_UPDATE", entityType: "game", entityId: id, metadata: update }); return res.json({ success: true, data: await db.collection("games").findOne(idFilter(id)) });
}

export async function handleAdminGenericCollection(req: Request, res: Response) {
  if (!ensureAdmin(req, res)) return;
  const db = await getMongoDb(); const name = String(req.params.collection || "");
  if (READ_ONLY_COLLECTIONS.has(name)) return bad(res, "This collection is read-only and must be changed through its business workflow", 405);
  if (!GENERIC_MUTABLE.has(name)) return bad(res, "Collection not available", 404);
  if (SUPER_ADMIN_ONLY_COLLECTIONS.has(name) && !ensureSuperAdmin(req, res)) return;
  if (req.method === "GET") return res.json({ success: true, data: await db.collection(name).find({}).sort({ createdAt: -1 }).limit(safeLimit(req.query.limit)).toArray() });
  if (req.method === "POST") {
    const doc = sanitizeGenericPatch(req.body); doc.createdAt = new Date(); doc.updatedAt = new Date();
    const result = await db.collection(name).insertOne(doc); await writeAuditLog({ ...actor(req), action: "ADMIN_COLLECTION_CREATE", entityType: name, entityId: String(result.insertedId) }); return res.status(201).json({ success: true, data: { ...doc, _id: result.insertedId } });
  }
  const id = String(req.params.id || ""); if (!id) return bad(res, "id is required");
  if (req.method === "DELETE") return bad(res, "Destructive deletes are disabled; use the collection's lifecycle workflow", 405);
  const update = sanitizeGenericPatch(req.body); if (!Object.keys(update).length) return bad(res, "No editable fields supplied"); update.updatedAt = new Date();
  const result = await db.collection(name).updateOne(idFilter(id), { $set: update }); if (!result.matchedCount) return bad(res, "Record not found", 404);
  await writeAuditLog({ ...actor(req), action: "ADMIN_COLLECTION_UPDATE", entityType: name, entityId: id, metadata: update }); return res.json({ success: true, data: await db.collection(name).findOne(idFilter(id)) });
}

export async function handleAdminReports(req: Request, res: Response) {
  if (!ensureAdmin(req, res)) return; const db = await getMongoDb(); const from = String(req.query.from || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)); const to = String(req.query.to || new Date().toISOString().slice(0, 10));
  const [payments, invoices, refunds, sessions] = await Promise.all([db.collection("payments").find({ createdAt: { $gte: new Date(`${from}T00:00:00Z`), $lte: new Date(`${to}T23:59:59Z`) } }).toArray(), db.collection("invoices").find({ createdAt: { $gte: new Date(`${from}T00:00:00Z`), $lte: new Date(`${to}T23:59:59Z`) } }).toArray(), db.collection("refunds").find({ createdAt: { $gte: new Date(`${from}T00:00:00Z`), $lte: new Date(`${to}T23:59:59Z`) } }).toArray(), db.collection("active_sessions").find({ startedAt: { $gte: new Date(`${from}T00:00:00Z`), $lte: new Date(`${to}T23:59:59Z`) } }).toArray()]);
  const sum = (rows: any[], field = "amountPaise") => rows.reduce((n, x) => n + Number(x[field] || 0), 0);
  return res.json({ success: true, data: { from, to, payments, invoices, refunds, sessions, totals: { paymentPaise: sum(payments), refundPaise: sum(refunds), invoicePaise: sum(invoices, "totalPaise") } } });
}
export async function handleAdminAudit(req: Request, res: Response) { if (!ensureAdmin(req, res)) return; const db = await getMongoDb(); return res.json({ success: true, data: await db.collection("audit_logs").find({}).sort({ createdAt: -1 }).limit(safeLimit(req.query.limit, 200)).toArray() }); }

export function registerAdminRoutes(app: any) {
  app.get("/api/admin/dashboard", handleAdminDashboard); app.get("/api/admin/stations", handleAdminStations); app.patch("/api/admin/stations/:id", handleAdminStations); app.get("/api/admin/pricing", handleAdminPricing); app.put("/api/admin/pricing", handleAdminPricing); app.get("/api/admin/users", handleAdminUsers); app.patch("/api/admin/users/:id", handleAdminUsers); app.get("/api/admin/games", handleAdminGames); app.post("/api/admin/games", handleAdminGames); app.patch("/api/admin/games/:id", handleAdminGames); app.get("/api/admin/reports", handleAdminReports); app.get("/api/admin/audit-logs", handleAdminAudit); app.get("/api/admin/:collection", handleAdminGenericCollection); app.post("/api/admin/:collection", handleAdminGenericCollection); app.patch("/api/admin/:collection/:id", handleAdminGenericCollection); app.delete("/api/admin/:collection/:id", handleAdminGenericCollection);
}