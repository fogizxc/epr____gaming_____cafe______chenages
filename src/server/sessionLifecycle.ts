import crypto from "node:crypto";
import { getMongoDb, getMongoClient } from "./mongodb.js";

const TICK_MS = 30_000;
const CHECKIN_GRACE_MS = Math.max(0, Number(process.env.BOOKING_CHECKIN_GRACE_MINUTES ?? 15)) * 60_000;
const NO_SHOW_GRACE_MS = Math.max(0, Number(process.env.BOOKING_NO_SHOW_GRACE_MINUTES ?? 15)) * 60_000;
let started = false;

function businessDateTime(date: string, time: string) {
  // Current business default is India Standard Time. Keep the offset explicit so
  // booking date/time strings do not depend on the host machine timezone.
  const timezone = String(process.env.BUSINESS_TIMEZONE || "Asia/Kolkata");
  if (timezone === "Asia/Kolkata") return new Date(`${date}T${time}:00+05:30`);
  return new Date(`${date}T${time}:00Z`);
}

async function issueAutoSessionInvoice(db: any, sessionRecord: any, booking: any, now: Date) {
  const existing = await db.collection("invoices").findOne({ bookingId: booking.id, status: { $ne: "VOID" } });
  if (existing) return;
  const totalPaise = String(booking.paymentMethod) === "Membership"
    ? 0
    : Number(booking.finalAmountPaise ?? booking.totalAmountPaise ?? (Number(booking.finalAmount ?? 0) * 100));
  if (!Number.isSafeInteger(totalPaise) || totalPaise < 0) return;
  const invoice = {
    id: `INV-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`,
    invoiceNumber: `BC-${now.getFullYear()}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`,
    bookingId: booking.id,
    customerId: booking.customerId,
    paymentId: booking.paymentId || null,
    sessionId: sessionRecord.id,
    status: "ISSUED",
    paymentStatus: String(booking.paymentMethod) === "Membership" ? "PAID_MEMBERSHIP" : "PAID",
    currency: "INR",
    subtotalPaise: Number(booking.subtotalPaise || totalPaise),
    taxPaise: Number(booking.taxPaise || 0),
    discountPaise: Number(booking.discountPaise || 0),
    totalPaise,
    issuedAt: now,
    createdAt: now,
    updatedAt: now,
    immutable: true,
    items: [{
      description: `${booking.service || "Gaming"} session${booking.gameTitle ? ` — ${booking.gameTitle}` : ""}`,
      quantity: 1,
      unitAmountPaise: totalPaise,
      amountPaise: totalPaise,
      durationHours: Number(booking.durationHours || 0),
      stationId: booking.systemId,
      membershipUsedHours: Number(booking.membershipUsedHours || 0),
      vipMembershipUsedHours: Number(booking.vipMembershipUsedHours || 0)
    }]
  };
  try {
    await db.collection("invoices").insertOne(invoice);
  } catch (error: any) {
    if (error?.code !== 11000) throw error;
  }
}

async function lifecycleTick() {
  const db = await getMongoDb();
  const now = new Date();

  // A reservation becomes a NO-SHOW after its scheduled start plus the configured
  // check-in window. The update is conditional, so multiple app instances are safe.
  const upcoming = await db.collection("bookings")
    .find({ bookingStatus: "UPCOMING" })
    .project({ _id: 1, id: 1, date: 1, startTime: 1 })
    .limit(500)
    .toArray();
  const noShowIds = upcoming.filter((b: any) => {
    if (!b.date || !b.startTime) return false;
    const start = businessDateTime(String(b.date), String(b.startTime));
    return Number.isFinite(start.getTime()) && now.getTime() >= start.getTime() + NO_SHOW_GRACE_MS;
  }).map((b: any) => b._id);
  if (noShowIds.length) {
    await db.collection("bookings").updateMany(
      { _id: { $in: noShowIds }, bookingStatus: "UPCOMING" },
      { $set: { bookingStatus: "NO-SHOW", noShowAt: now.toISOString(), updatedAt: now } }
    );
  }

  // Automatically complete expired active sessions. Every mutation is conditional
  // and transactional, making this safe when several Node instances are running.
  const expired = await db.collection("active_sessions")
    .find({ status: "ACTIVE", scheduledEndAt: { $lte: now } })
    .project({ _id: 1, id: 1, bookingId: 1, systemId: 1 })
    .limit(500)
    .toArray();
  if (!expired.length) return;
  const client = getMongoClient();
  if (!client) return;

  for (const candidate of expired) {
    const tx = client.startSession();
    try {
      await tx.withTransaction(async () => {
        const active = await db.collection("active_sessions").findOneAndUpdate(
          { _id: candidate._id, status: "ACTIVE", scheduledEndAt: { $lte: now } },
          { $set: { status: "COMPLETED", endedAt: now, completedAutomatically: true, updatedAt: now } },
          { session: tx, returnDocument: "after" }
        );
        if (!active) return;

        const booking = await db.collection("bookings").findOne({ id: active.bookingId }, { session: tx });
        if (booking) {
          await db.collection("bookings").updateOne(
            { _id: booking._id, bookingStatus: "ACTIVE" },
            { $set: { bookingStatus: "COMPLETED", completedAt: now.toISOString(), actualEndAt: now.toISOString(), updatedAt: now } },
            { session: tx }
          );
          await issueAutoSessionInvoice(db, active, booking, now);
        }

        await db.collection("gaming_systems").updateOne(
          { id: active.systemId, activeBookingId: active.bookingId },
          { $set: { status: "AVAILABLE", updatedAt: now }, $unset: { activeBookingId: "", sessionEndTime: "" }, $inc: { bookingVersion: 1 } },
          { session: tx }
        );
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
