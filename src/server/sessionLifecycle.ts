import { getMongoDb, getMongoClient } from "./mongodb.js";

const TICK_MS = 30_000;
const GRACE_MS = 15 * 60_000;
let started = false;

async function lifecycleTick() {
  const db = await getMongoDb();
  const now = new Date();
  // Bookings that passed their end without check-in become no-shows.
  const upcoming = await db.collection("bookings").find({ bookingStatus: "UPCOMING" }).project({ _id: 1, date: 1, endTime: 1 }).limit(500).toArray();
  const noShowIds = upcoming.filter((b: any) => {
    if (!b.date || !b.endTime) return false;
    const end = new Date(`${b.date}T${b.endTime}:00+05:30`);
    return Number.isFinite(end.getTime()) && now.getTime() >= end.getTime() + GRACE_MS;
  }).map((b: any) => b._id);
  if (noShowIds.length) {
    await db.collection("bookings").updateMany({ _id: { $in: noShowIds }, bookingStatus: "UPCOMING" }, { $set: { bookingStatus: "NO-SHOW", noShowAt: now.toISOString(), updatedAt: now } });
  }

  const expired = await db.collection("active_sessions").find({ status: "ACTIVE", scheduledEndAt: { $lte: now } }).project({ _id: 1, id: 1, bookingId: 1, systemId: 1 }).limit(500).toArray();
  if (!expired.length) return;
  const client = getMongoClient();
  if (!client) return;
  for (const candidate of expired) {
    const tx = client.startSession();
    try {
      await tx.withTransaction(async () => {
        const active = await db.collection("active_sessions").findOneAndUpdate({ _id: candidate._id, status: "ACTIVE", scheduledEndAt: { $lte: now } }, { $set: { status: "COMPLETED", endedAt: now, completedAutomatically: true, updatedAt: now } }, { session: tx, returnDocument: "after" });
        if (!active) return;
        await db.collection("bookings").updateOne({ id: active.bookingId, bookingStatus: "ACTIVE" }, { $set: { bookingStatus: "COMPLETED", completedAt: now.toISOString(), actualEndAt: now.toISOString(), updatedAt: now } }, { session: tx });
        await db.collection("gaming_systems").updateOne({ id: active.systemId, activeBookingId: active.bookingId }, { $set: { status: "AVAILABLE", updatedAt: now }, $unset: { activeBookingId: "", sessionEndTime: "" }, $inc: { bookingVersion: 1 } }, { session: tx });
      });
    } catch (error) {
      console.error("session lifecycle tick", error);
    } finally {
      await tx.endSession();
    }
  }
}

export function startSessionLifecycle() {
  if (started) return;
  started = true;
  const run = () => void lifecycleTick().catch((error) => console.error("session lifecycle", error));
  run();
  setInterval(run, TICK_MS).unref();
}
