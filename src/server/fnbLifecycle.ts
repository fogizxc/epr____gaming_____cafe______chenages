import { getMongoDb, getMongoClient } from "./mongodb.js";
import { writeAuditLog } from "./domainRepositories.js";

const intervalMs = Math.max(15_000, Number(process.env.FNB_LIFECYCLE_INTERVAL_MS || 30_000));
const paymentExpiryMs = Math.max(60_000, Number(process.env.FNB_PAYMENT_EXPIRY_MINUTES || 15) * 60_000);
let running = false;

async function releaseExpiredReservations(db: any) {
  const cutoff = new Date(Date.now() - paymentExpiryMs);
  const orders = await db.collection("fnb_orders").find({ paymentStatus: "PENDING", inventoryStatus: "RESERVED", createdAt: { $lte: cutoff }, status: { $nin: ["CANCELLED", "COMPLETED", "REFUNDED"] } }).limit(100).toArray();
  let released = 0;
  for (const order of orders) {
    const client = getMongoClient();
    if (!client) continue;
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const claim = await db.collection("fnb_orders").updateOne({ _id: order._id, paymentStatus: "PENDING", inventoryStatus: "RESERVED" }, { $set: { paymentStatus: "EXPIRED", inventoryStatus: "RELEASED", status: "CANCELLED", cancellationReason: "PAYMENT_TIMEOUT", updatedAt: new Date() } }, { session });
        if (claim.modifiedCount !== 1) return;
        for (const item of order.items || []) {
          const r = await db.collection("fnb_products").updateOne({ id: item.productId, reservedQty: { $gte: Number(item.quantity) } }, { $inc: { reservedQty: -Number(item.quantity) }, $set: { updatedAt: new Date() } }, { session });
          if (r.modifiedCount !== 1) throw new Error("RESERVATION_RELEASE_FAILED");
        }
      });
      released++;
      await writeAuditLog({ action: "FNB_PAYMENT_TIMEOUT", entityType: "fnb_order", entityId: order.id, metadata: { released: true } });
    } catch (error) {
      console.error("F&B reservation release failed:", order.id, error);
    } finally { await session.endSession(); }
  }
  return released;
}

async function repairCapturedOrders(db: any) {
  const orders = await db.collection("fnb_orders").find({ paymentStatus: "PAID", inventoryStatus: "RESERVED" }).limit(50).toArray();
  const client = getMongoClient();
  if (!client) return 0;
  let repaired = 0;
  for (const order of orders) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        for (const item of order.items || []) {
          const r = await db.collection("fnb_products").updateOne({ id: item.productId, reservedQty: { $gte: Number(item.quantity) }, stockQty: { $gte: Number(item.quantity) } }, { $inc: { reservedQty: -Number(item.quantity), stockQty: -Number(item.quantity) }, $set: { updatedAt: new Date() } }, { session });
          if (r.modifiedCount !== 1) throw new Error("INVENTORY_UNAVAILABLE");
        }
        const result = await db.collection("fnb_orders").updateOne({ _id: order._id, paymentStatus: "PAID", inventoryStatus: "RESERVED" }, { $set: { inventoryStatus: "CAPTURED", updatedAt: new Date() } }, { session });
        if (result.modifiedCount !== 1) throw new Error("ORDER_STATE_CHANGED");
      });
      repaired++;
    } catch {
      // Leave the order reserved for a later retry or operator reconciliation.
    } finally { await session.endSession(); }
  }
  return repaired;
}

export function startFnbLifecycle() {
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const db = await getMongoDb();
      await releaseExpiredReservations(db);
      await repairCapturedOrders(db);
    } catch (error) { console.error("F&B lifecycle error:", error); }
    finally { running = false; }
  };
  void tick();
  const timer = setInterval(() => void tick(), intervalMs);
  timer.unref?.();
}
