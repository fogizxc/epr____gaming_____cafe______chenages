import { getMongoDb } from "./mongodb.js";
import { writeAuditLog } from "./domainRepositories.js";

const intervalMs = Math.max(15_000, Number(process.env.FNB_LIFECYCLE_INTERVAL_MS || 30_000));
const paymentExpiryMs = Math.max(60_000, Number(process.env.FNB_PAYMENT_EXPIRY_MINUTES || 15) * 60_000);
let running = false;

async function releaseExpiredReservations(db: any) {
  const cutoff = new Date(Date.now() - paymentExpiryMs);
  const orders = await db.collection("fnb_orders").find({
    paymentStatus: "PENDING",
    inventoryStatus: "RESERVED",
    createdAt: { $lte: cutoff },
    status: { $nin: ["CANCELLED", "COMPLETED", "REFUNDED"] },
  }).limit(100).toArray();

  let released = 0;
  for (const order of orders) {
    const result = await db.collection("fnb_orders").updateOne(
      { _id: order._id, paymentStatus: "PENDING", inventoryStatus: "RESERVED" },
      { $set: { paymentStatus: "EXPIRED", inventoryStatus: "RELEASED", status: "CANCELLED", cancellationReason: "PAYMENT_TIMEOUT", updatedAt: new Date() } },
    );
    if (result.modifiedCount !== 1) continue;
    for (const item of order.items || []) {
      await db.collection("fnb_products").updateOne(
        { id: item.productId, reservedQty: { $gte: Number(item.quantity) } },
        { $inc: { reservedQty: -Number(item.quantity) }, $set: { updatedAt: new Date() } },
      );
    }
    released++;
    await writeAuditLog({ action: "FNB_PAYMENT_TIMEOUT", entityType: "fnb_order", entityId: order.id, metadata: { released: true } });
  }
  return released;
}

async function repairCapturedOrders(db: any) {
  const orders = await db.collection("fnb_orders").find({ paymentStatus: "PAID", inventoryStatus: "RESERVED" }).limit(50).toArray();
  let repaired = 0;
  for (const order of orders) {
    const session = db.client?.startSession?.();
    try {
      // Re-acquire the reservation only when the order still owns it. This path is
      // intentionally conservative: it never guesses stock for an already released order.
      let ok = true;
      if (session) {
        await session.withTransaction(async () => {
          for (const item of order.items || []) {
            const r = await db.collection("fnb_products").updateOne(
              { id: item.productId, reservedQty: { $gte: Number(item.quantity) }, stockQty: { $gte: Number(item.quantity) } },
              { $inc: { reservedQty: -Number(item.quantity), stockQty: -Number(item.quantity) }, $set: { updatedAt: new Date() } },
              { session },
            );
            if (r.modifiedCount !== 1) throw new Error("INVENTORY_UNAVAILABLE");
          }
          await db.collection("fnb_orders").updateOne({ _id: order._id, paymentStatus: "PAID", inventoryStatus: "RESERVED" }, { $set: { inventoryStatus: "CAPTURED", updatedAt: new Date() } }, { session });
        });
      } else ok = false;
      if (ok) repaired++;
    } catch {
      // Keep the order in RESERVED state for an operator/reconciliation retry.
    } finally {
      await session?.endSession();
    }
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
    } catch (error) {
      console.error("F&B lifecycle error:", error);
    } finally {
      running = false;
    }
  };
  void tick();
  const timer = setInterval(() => void tick(), intervalMs);
  timer.unref?.();
}
