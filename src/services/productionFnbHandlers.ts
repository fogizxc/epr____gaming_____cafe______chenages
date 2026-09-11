import crypto from "node:crypto";
import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import type { AuthenticatedRequest } from "../server/auth.js";
import { getMongoDb, getMongoClient } from "../server/mongodb.js";
import { writeAuditLog } from "../server/domainRepositories.js";

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`;
const actor = (req: Request) => (req as AuthenticatedRequest).user;
const fail = (res: Response, status: number, error: string) => res.status(status).json({ success: false, error });
const key = (req: Request) => String(req.header("Idempotency-Key") || req.body?.idempotencyKey || "").trim();
const money = (v: unknown) => { const n = Number(v); return Number.isSafeInteger(n) && n >= 0 ? n : 0; };
const oidOrId = (id: string) => ObjectId.isValid(id) ? { $or: [{ id }, { _id: new ObjectId(id) }] } : { id };

function normalizeItems(input: any) {
  if (!Array.isArray(input) || !input.length || input.length > 50) return null;
  const items = input.map((raw: any) => ({
    productId: String(raw?.productId || raw?.id || "").trim(),
    quantity: Number(raw?.quantity ?? raw?.qty ?? 0),
    variant: raw?.variant ? String(raw.variant).slice(0, 100) : undefined,
  }));
  if (items.some((x) => !x.productId || !Number.isInteger(x.quantity) || x.quantity < 1 || x.quantity > 50)) return null;
  return items;
}

async function createFnbInvoice(db: any, order: any, actorId: string, actorRole?: string) {
  const existing = await db.collection("invoices").findOne({ fnbOrderId: order.id, status: { $ne: "VOID" } });
  if (existing) return existing;
  const now = new Date();
  const invoice = {
    id: makeId("INV"), invoiceNumber: `BC-${now.getFullYear()}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`,
    fnbOrderId: order.id, bookingId: order.bookingId || null, sessionId: order.sessionId || null,
    customerId: order.customerId || null, status: "ISSUED", paymentStatus: order.paymentStatus || "PAID",
    currency: "INR", subtotalPaise: money(order.subtotalPaise), taxPaise: money(order.taxPaise), discountPaise: money(order.discountPaise), totalPaise: money(order.totalPaise),
    issuedAt: now, createdAt: now, updatedAt: now, immutable: true,
    items: (order.items || []).map((x: any) => ({ description: x.name, quantity: x.quantity, unitAmountPaise: money(x.unitPricePaise), amountPaise: money(x.amountPaise) })),
  };
  try { await db.collection("invoices").insertOne(invoice); }
  catch (e: any) { if (e?.code === 11000) return db.collection("invoices").findOne({ fnbOrderId: order.id }); throw e; }
  await writeAuditLog({ actorId, actorRole, action: "FNB_INVOICE_ISSUED", entityType: "invoice", entityId: invoice.id, metadata: { fnbOrderId: order.id, totalPaise: invoice.totalPaise } });
  return invoice;
}

export async function handleFnbProducts(req: Request, res: Response) {
  const db = await getMongoDb();
  const filter: any = { isActive: { $ne: false } };
  if (req.query.category) filter.category = String(req.query.category);
  const products = await db.collection("fnb_products").find(filter, { projection: { costPricePaise: 0 } }).sort({ category: 1, name: 1 }).limit(500).toArray();
  return res.json({ success: true, data: products });
}

export async function handleCustomerFnbOrder(req: Request, res: Response) {
  const u = actor(req); if (!u) return fail(res, 401, "Authentication required");
  const idempotencyKey = key(req); if (idempotencyKey.length < 16 || idempotencyKey.length > 128) return fail(res, 400, "A valid Idempotency-Key is required");
  const items = normalizeItems(req.body?.items); if (!items) return fail(res, 400, "Invalid order items");
  const db = await getMongoDb(); const existing = await db.collection("fnb_orders").findOne({ customerId: u.id, idempotencyKey });
  if (existing) return res.json({ success: true, data: { order: existing }, duplicate: true });
  const sessionId = req.body?.sessionId ? String(req.body.sessionId) : null;
  const bookingId = req.body?.bookingId ? String(req.body.bookingId) : null;
  const customerSession = sessionId ? await db.collection("active_sessions").findOne({ id: sessionId, customerId: u.id, status: "ACTIVE" }) : null;
  if (sessionId && !customerSession) return fail(res, 404, "Active gaming session not found");
  if (bookingId) { const booking = await db.collection("bookings").findOne({ id: bookingId, customerId: u.id }); if (!booking) return fail(res, 404, "Booking not found"); }
  const client = getMongoClient(); if (!client) return fail(res, 503, "MongoDB transaction support is unavailable");
  const tx = client.startSession(); let order: any;
  try {
    await tx.withTransaction(async () => {
      const productIds = [...new Set(items.map((x) => x.productId))];
      const products = await db.collection("fnb_products").find({ $or: productIds.map((id) => oidOrId(id)), isActive: { $ne: false } }, { session: tx }).toArray();
      const byId = new Map(products.map((p: any) => [String(p.id || p._id), p]));
      if (products.length !== productIds.length) throw new Error("PRODUCT_UNAVAILABLE");
      const lines: any[] = []; let subtotal = 0;
      for (const requested of items) {
        const p: any = byId.get(requested.productId); if (!p) throw new Error("PRODUCT_UNAVAILABLE");
        const unit = money(p.pricePaise ?? Number(p.price || 0) * 100); if (!unit) throw new Error("INVALID_PRODUCT_PRICE");
        const stock = Number(p.stockQty ?? p.inventoryQty ?? p.stock ?? 0); if (stock < requested.quantity) throw new Error("INSUFFICIENT_STOCK");
        const amount = unit * requested.quantity; subtotal += amount;
        lines.push({ productId: String(p.id || p._id), name: String(p.name || p.title || "Item"), quantity: requested.quantity, unitPricePaise: unit, amountPaise: amount, variant: requested.variant });
      }
      const taxPaise = money(req.body?.taxPaise); const discountPaise = money(req.body?.discountPaise); const totalPaise = Math.max(0, subtotal + taxPaise - discountPaise);
      const paymentMethod = String(req.body?.paymentMethod || "CASH").toUpperCase();
      if (!["CASH", "UPI", "CARD", "WALLET"].includes(paymentMethod)) throw new Error("INVALID_PAYMENT_METHOD");
      if (paymentMethod === "WALLET") {
        const debit = await db.collection("wallet_accounts").updateOne({ customerId: u.id, balancePaise: { $gte: totalPaise } }, { $inc: { balancePaise: -totalPaise }, $set: { updatedAt: new Date() } }, { session: tx });
        if (debit.modifiedCount !== 1) throw new Error("INSUFFICIENT_WALLET_BALANCE");
        await db.collection("wallet_transactions").insertOne({ id: makeId("WT"), customerId: u.id, type: "DEBIT", source: "FNB_ORDER", amountPaise: totalPaise, currency: "INR", idempotencyKey: `FNB:${idempotencyKey}`, orderId: `pending`, createdAt: new Date() }, { session: tx });
      }
      const now = new Date(); order = { id: makeId("FNB"), customerId: u.id, customerName: u.name || u.email || null, sessionId, bookingId, items: lines, subtotalPaise: subtotal, taxPaise, discountPaise, totalPaise, currency: "INR", paymentMethod, paymentStatus: "PAID", status: "PLACED", idempotencyKey, createdAt: now, updatedAt: now };
      await db.collection("fnb_orders").insertOne(order, { session: tx });
      for (const line of lines) {
        const stockFilter: any = { $or: [{ id: line.productId }, ...(ObjectId.isValid(line.productId) ? [{ _id: new ObjectId(line.productId) }] : [])], isActive: { $ne: false }, $expr: { $gte: [{ $ifNull: ["$stockQty", { $ifNull: ["$inventoryQty", "$stock"] }] }, line.quantity] } };
        const stockResult = await db.collection("fnb_products").updateOne(stockFilter, { $inc: { stockQty: -line.quantity }, $set: { updatedAt: now } }, { session: tx });
        if (stockResult.modifiedCount !== 1) throw new Error("INSUFFICIENT_STOCK");
        await db.collection("fnb_orders").updateOne({ id: order.id }, { $push: { inventoryMovements: { productId: line.productId, quantity: -line.quantity, at: now } } }, { session: tx });
      }
      if (paymentMethod === "WALLET") await db.collection("wallet_transactions").updateOne({ orderId: "pending", idempotencyKey: `FNB:${idempotencyKey}` }, { $set: { orderId: order.id } }, { session: tx });
    });
  } catch (e: any) {
    if (e.message === "PRODUCT_UNAVAILABLE") return fail(res, 409, "One or more F&B items are unavailable");
    if (e.message === "INVALID_PRODUCT_PRICE") return fail(res, 409, "One or more F&B prices are invalid");
    if (e.message === "INSUFFICIENT_STOCK") return fail(res, 409, "One or more F&B items are out of stock");
    if (e.message === "INSUFFICIENT_WALLET_BALANCE") return fail(res, 409, "Insufficient wallet balance");
    if (e.message === "INVALID_PAYMENT_METHOD") return fail(res, 400, "Invalid payment method");
    console.error("fnb/order", e); return fail(res, 500, "Unable to create F&B order");
  } finally { await tx.endSession(); }
  const invoice = await createFnbInvoice(db, order, u.id, u.role);
  await writeAuditLog({ actorId: u.id, actorRole: u.role, action: "FNB_ORDER_CREATED", entityType: "fnb_order", entityId: order.id, metadata: { totalPaise: order.totalPaise, itemCount: order.items.length, sessionId } });
  return res.status(201).json({ success: true, data: { order, invoice } });
}

export async function handleEmployeeFnbOrder(req: Request, res: Response) {
  const u = actor(req); if (!u) return fail(res, 401, "Authentication required");
  const idempotencyKey = key(req); if (idempotencyKey.length < 16 || idempotencyKey.length > 128) return fail(res, 400, "A valid Idempotency-Key is required");
  const items = normalizeItems(req.body?.items); if (!items) return fail(res, 400, "Invalid order items");
  const db = await getMongoDb(); const existing = await db.collection("fnb_orders").findOne({ idempotencyKey }); if (existing) return res.json({ success: true, data: { order: existing }, duplicate: true });
  const customerId = req.body?.customerId ? String(req.body.customerId) : null;
  const client = getMongoClient(); if (!client) return fail(res, 503, "MongoDB transaction support is unavailable"); const tx = client.startSession(); let order: any;
  try {
    await tx.withTransaction(async () => {
      const products = await db.collection("fnb_products").find({ $or: items.map((x) => oidOrId(x.productId)), isActive: { $ne: false } }, { session: tx }).toArray();
      const byId = new Map(products.map((p: any) => [String(p.id || p._id), p])); if (products.length !== new Set(items.map((x) => x.productId)).size) throw new Error("PRODUCT_UNAVAILABLE");
      const lines: any[] = []; let subtotal = 0;
      for (const requested of items) { const p: any = byId.get(requested.productId); const unit = money(p?.pricePaise ?? Number(p?.price || 0) * 100); const stock = Number(p?.stockQty ?? p?.inventoryQty ?? p?.stock ?? 0); if (!unit) throw new Error("INVALID_PRODUCT_PRICE"); if (stock < requested.quantity) throw new Error("INSUFFICIENT_STOCK"); const amount = unit * requested.quantity; subtotal += amount; lines.push({ productId: String(p.id || p._id), name: String(p.name || p.title || "Item"), quantity: requested.quantity, unitPricePaise: unit, amountPaise: amount }); }
      const taxPaise = money(req.body?.taxPaise); const discountPaise = money(req.body?.discountPaise); const totalPaise = Math.max(0, subtotal + taxPaise - discountPaise); const paymentMethod = String(req.body?.paymentMethod || "CASH").toUpperCase();
      const now = new Date(); order = { id: makeId("FNB"), customerId, customerName: String(req.body?.customerName || "Walk-in").slice(0,120), sessionId: req.body?.sessionId ? String(req.body.sessionId) : null, items: lines, subtotalPaise: subtotal, taxPaise, discountPaise, totalPaise, currency: "INR", paymentMethod, paymentStatus: paymentMethod === "PENDING" ? "PENDING" : "PAID", status: "PLACED", idempotencyKey, employeeId: u.id, createdAt: now, updatedAt: now };
      await db.collection("fnb_orders").insertOne(order, { session: tx });
      for (const line of lines) { const r = await db.collection("fnb_products").updateOne({ $or: [{ id: line.productId }, ...(ObjectId.isValid(line.productId) ? [{ _id: new ObjectId(line.productId) }] : [])], isActive: { $ne: false }, $expr: { $gte: [{ $ifNull: ["$stockQty", { $ifNull: ["$inventoryQty", "$stock"] }] }, line.quantity] } }, { $inc: { stockQty: -line.quantity }, $set: { updatedAt: now } }, { session: tx }); if (r.modifiedCount !== 1) throw new Error("INSUFFICIENT_STOCK"); }
    });
  } catch (e: any) { if (e.message === "PRODUCT_UNAVAILABLE") return fail(res,409,"One or more F&B items are unavailable"); if (e.message === "INVALID_PRODUCT_PRICE") return fail(res,409,"One or more F&B prices are invalid"); if (e.message === "INSUFFICIENT_STOCK") return fail(res,409,"One or more F&B items are out of stock"); console.error("employee/fnb/order",e); return fail(res,500,"Unable to create F&B order"); } finally { await tx.endSession(); }
  const invoice = order.paymentStatus === "PAID" ? await createFnbInvoice(db, order, u.id, u.role) : null;
  await writeAuditLog({ actorId:u.id, actorRole:u.role, action:"EMPLOYEE_FNB_ORDER_CREATED", entityType:"fnb_order", entityId:order.id, metadata:{totalPaise:order.totalPaise,customerId:order.customerId} });
  return res.status(201).json({success:true,data:{order,invoice}});
}

export async function handleFnbOrderStatus(req: Request, res: Response) {
  const u = actor(req); if (!u) return fail(res, 401, "Authentication required");
  const id = String(req.params.id || "").trim(); const next = String(req.body?.status || "").toUpperCase();
  const transitions: Record<string,string[]> = { PLACED:["PREPARING","CANCELLED"], PREPARING:["READY","CANCELLED"], READY:["DELIVERED"], DELIVERED:[], CANCELLED:[] };
  const db = await getMongoDb(); const order: any = await db.collection("fnb_orders").findOne(oidOrId(id)); if (!order) return fail(res,404,"F&B order not found");
  if (!transitions[order.status]?.includes(next)) return fail(res,409,"Invalid F&B order status transition");
  const updated = await db.collection("fnb_orders").findOneAndUpdate({ _id: order._id, status: order.status }, {$set:{status:next,updatedAt:new Date(), ...(next === "DELIVERED" ? {deliveredAt:new Date()} : {})}}, {returnDocument:"after"});
  await writeAuditLog({actorId:u.id,actorRole:u.role,action:"FNB_ORDER_STATUS_CHANGED",entityType:"fnb_order",entityId:order.id,metadata:{from:order.status,to:next}});
  return res.json({success:true,data:{order:updated}});
}
