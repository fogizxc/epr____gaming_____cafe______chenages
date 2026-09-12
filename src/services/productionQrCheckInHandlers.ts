import crypto from "node:crypto";
import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import type { AuthenticatedRequest } from "../server/auth.js";
import { getMongoClient, getMongoDb } from "../server/mongodb.js";
import { writeAuditLog } from "../server/domainRepositories.js";

const QR_TTL_MS = 5 * 60 * 1000;
const CHECK_IN_EARLY_MINUTES = 15;
const CHECK_IN_LATE_MINUTES = 15;

function user(req: Request) { return (req as AuthenticatedRequest).user; }
function fail(res: Response, status: number, error: string) { return res.status(status).json({ success: false, error }); }
function tokenHash(token: string) { return crypto.createHash("sha256").update(token).digest("hex"); }
function makeToken() { return crypto.randomBytes(32).toString("base64url"); }
function appUrl(req: Request) { return (process.env.APP_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, ""); }
function bookingDateTime(date: string, time: string) { return new Date(`${date}T${time}:00+05:30`); }
function idValue(value: unknown) { return String(value ?? "").trim(); }

async function findCustomerBooking(db: any, bookingId: string, customerId: string) {
  const or: any[] = [{ id: bookingId }];
  if (ObjectId.isValid(bookingId)) or.push({ _id: new ObjectId(bookingId) });
  return db.collection("bookings").findOne({ $or: or, customerId });
}

export async function handleIssueBookingQr(req: Request, res: Response) {
  const currentUser = user(req);
  if (!currentUser) return fail(res, 401, "Authentication required");
  const bookingId = idValue(req.params.id);
  if (!bookingId) return fail(res, 400, "Booking id is required");

  try {
    const db = await getMongoDb();
    const booking = await findCustomerBooking(db, bookingId, currentUser.id);
    if (!booking) return fail(res, 404, "Booking not found");
    if (!["UPCOMING", "CONFIRMED"].includes(String(booking.bookingStatus))) return fail(res, 409, "QR check-in is only available for an upcoming booking");

    const now = new Date();
    const start = bookingDateTime(String(booking.date), String(booking.startTime));
    const end = bookingDateTime(String(booking.date), String(booking.endTime));
    if (now.getTime() >= end.getTime()) return fail(res, 409, "This booking has expired");
    if (now.getTime() < start.getTime() - CHECK_IN_EARLY_MINUTES * 60_000) {
      const minutes = Math.ceil((start.getTime() - now.getTime()) / 60_000);
      return res.status(409).json({ success: false, error: `QR check-in opens 15 minutes before your booking`, minutesUntilOpen: minutes });
    }

    await db.collection("qr_checkins").updateMany({ bookingId: booking.id, customerId: currentUser.id, status: "ACTIVE" }, { $set: { status: "REVOKED", revokedAt: now, updatedAt: now } });

    const rawToken = makeToken();
    const expiresAt = new Date(now.getTime() + QR_TTL_MS);
    await db.collection("qr_checkins").insertOne({ bookingId: booking.id, customerId: currentUser.id, tokenHash: tokenHash(rawToken), issuedAt: now, expiresAt, usedAt: null, status: "ACTIVE", checkedInBy: null, checkedInAt: null, createdAt: now, updatedAt: now });

    return res.json({ success: true, bookingId: booking.id, token: rawToken, qrValue: `${appUrl(req)}/check-in?t=${encodeURIComponent(rawToken)}`, issuedAt: now.toISOString(), expiresAt: expiresAt.toISOString(), ttlSeconds: Math.floor(QR_TTL_MS / 1000) });
  } catch (error) {
    console.error("booking/qr issue", error);
    return fail(res, 500, "Unable to issue QR check-in pass");
  }
}

async function consumeMembership(db: any, tx: any, booking: any) {
  if (String(booking.paymentMethod) !== "Membership") return null;
  const hours = Number(booking.durationHours || 0);
  const vip = /vip/i.test(String(booking.service || "")) || /vip/i.test(String(booking.systemName || ""));
  const membership = await db.collection("customer_memberships").findOne({ customerId: booking.customerId, status: "ACTIVE", expiresAt: { $gt: new Date() } }, { session: tx, sort: { expiresAt: -1 } });
  if (!membership) throw new Error("MEMBERSHIP_NOT_ACTIVE");
  const field = vip ? "vipHoursRemaining" : "normalHoursRemaining";
  const updated = await db.collection("customer_memberships").findOneAndUpdate({ _id: membership._id, customerId: booking.customerId, status: "ACTIVE", expiresAt: { $gt: new Date() }, [field]: { $gte: hours } }, { $inc: { [field]: -hours }, $set: { updatedAt: new Date() } }, { session: tx, returnDocument: "after" });
  if (!updated) throw new Error("INSUFFICIENT_MEMBERSHIP_HOURS");
  return { membershipId: String(membership.id || membership._id), hours, vip };
}

export async function handleEmployeeQrCheckIn(req: Request, res: Response) {
  const currentUser = user(req);
  if (!currentUser) return fail(res, 401, "Authentication required");
  const rawValue = idValue(req.body?.token || req.body?.qrValue || req.body?.value);
  if (!rawValue) return fail(res, 400, "QR token is required");

  let token = rawValue;
  try {
    if (rawValue.includes("/check-in")) {
      const url = new URL(rawValue);
      token = url.searchParams.get("t") || "";
    }
  } catch { /* treat input as a raw token */ }
  if (token.length < 40 || token.length > 200) return fail(res, 400, "Invalid QR pass");

  try {
    const db = await getMongoDb();
    const client = getMongoClient();
    if (!client) return fail(res, 503, "MongoDB transaction support is unavailable");
    const tx = client.startSession();
    let result: any;
    try {
      await tx.withTransaction(async () => {
        const now = new Date();
        const qr = await db.collection("qr_checkins").findOneAndUpdate({ tokenHash: tokenHash(token), status: "ACTIVE", expiresAt: { $gt: now } }, { $set: { status: "USED", usedAt: now, checkedInBy: currentUser.id, checkedInAt: now, updatedAt: now } }, { session: tx, returnDocument: "before" });
        if (!qr) throw new Error("QR_INVALID_OR_EXPIRED");

        const booking = await db.collection("bookings").findOne({ id: qr.bookingId, customerId: qr.customerId }, { session: tx });
        if (!booking) throw new Error("BOOKING_NOT_FOUND");
        if (booking.bookingStatus === "ACTIVE") {
          result = { booking, session: await db.collection("active_sessions").findOne({ bookingId: booking.id }, { session: tx }), duplicate: true };
          return;
        }
        if (!["UPCOMING", "CONFIRMED"].includes(String(booking.bookingStatus))) throw new Error("BOOKING_NOT_CHECKINABLE");

        const start = bookingDateTime(String(booking.date), String(booking.startTime));
        const end = bookingDateTime(String(booking.date), String(booking.endTime));
        if (now.getTime() < start.getTime() - CHECK_IN_EARLY_MINUTES * 60_000) throw new Error("TOO_EARLY");
        if (now.getTime() >= end.getTime() + CHECK_IN_LATE_MINUTES * 60_000) throw new Error("BOOKING_EXPIRED");
        const paid = ["PAID", "PAID_MEMBERSHIP"].includes(String(booking.paymentStatus)) || String(booking.paymentMethod) === "Membership";
        if (!paid) throw new Error("BOOKING_UNPAID");

        const station = await db.collection("gaming_systems").findOneAndUpdate({ id: booking.systemId, status: { $in: ["AVAILABLE", "RESERVED"] } }, { $set: { status: "ACTIVE", activeBookingId: booking.id, updatedAt: now }, $inc: { bookingVersion: 1 } }, { session: tx, returnDocument: "after" });
        if (!station) throw new Error("STATION_UNAVAILABLE");

        const membership = await consumeMembership(db, tx, booking);
        const scheduledEnd = new Date(Math.min(end.getTime(), now.getTime() + Number(booking.durationHours || 0) * 3_600_000));
        const sessionRecord = { id: `SS-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`, bookingId: booking.id, customerId: booking.customerId, systemId: booking.systemId, systemName: booking.systemName, service: booking.service, gameTitle: booking.gameTitle, startedAt: now, scheduledStartAt: start, scheduledEndAt: scheduledEnd, originalScheduledEndAt: end, status: "ACTIVE", extensionMinutes: 0, transferCount: 0, membershipId: membership?.membershipId || null, membershipHoursUsed: membership?.hours || 0, vipMembershipHoursUsed: membership?.vip ? membership.hours : 0, checkInMethod: "QR", checkedInBy: currentUser.id, createdAt: now, updatedAt: now };
        await db.collection("active_sessions").insertOne(sessionRecord, { session: tx });

        const bookingUpdate: any = { bookingStatus: "ACTIVE", checkedInAt: now.toISOString(), checkedInBy: currentUser.id, checkInMethod: "QR", updatedAt: now };
        if (membership) { bookingUpdate.paymentStatus = "PAID"; bookingUpdate.membershipId = membership.membershipId; bookingUpdate.membershipUsedHours = membership.vip ? 0 : membership.hours; bookingUpdate.vipMembershipUsedHours = membership.vip ? membership.hours : 0; }
        const updatedBooking = await db.collection("bookings").findOneAndUpdate({ _id: booking._id, bookingStatus: { $in: ["UPCOMING", "CONFIRMED"] } }, { $set: bookingUpdate }, { session: tx, returnDocument: "after" });
        if (!updatedBooking) throw new Error("BOOKING_STATE_RACE");
        result = { booking: updatedBooking, session: sessionRecord, duplicate: false };
      });
    } finally { await tx.endSession(); }

    if (!result) return fail(res, 409, "Check-in could not be completed");
    if (!result.duplicate) await writeAuditLog({ actorId: currentUser.id, actorRole: currentUser.role, action: "BOOKING_QR_CHECKED_IN", entityType: "booking", entityId: result.booking.id, metadata: { sessionId: result.session.id, checkInMethod: "QR", customerId: result.booking.customerId } });
    return res.json({ success: true, message: "QR check-in successful. Session started.", booking: result.booking, session: result.session, duplicate: result.duplicate });
  } catch (error: any) {
    const code = error?.message;
    if (code === "QR_INVALID_OR_EXPIRED") return fail(res, 410, "QR pass is invalid, expired, or already used");
    if (code === "BOOKING_NOT_FOUND") return fail(res, 404, "Booking linked to this QR was not found");
    if (code === "BOOKING_NOT_CHECKINABLE") return fail(res, 409, "Booking cannot be checked in from its current state");
    if (code === "TOO_EARLY") return fail(res, 409, "Check-in opens 15 minutes before the booking");
    if (code === "BOOKING_EXPIRED") return fail(res, 409, "The booking check-in window has expired");
    if (code === "BOOKING_UNPAID") return fail(res, 402, "Payment is required before check-in");
    if (code === "MEMBERSHIP_NOT_ACTIVE") return fail(res, 409, "Membership is not active");
    if (code === "INSUFFICIENT_MEMBERSHIP_HOURS") return fail(res, 409, "Insufficient membership hours");
    if (code === "STATION_UNAVAILABLE") return fail(res, 409, "The reserved station is currently unavailable");
    if (code === "BOOKING_STATE_RACE") return fail(res, 409, "Booking was changed by another request; please retry");
    console.error("employee/qr-check-in", error);
    return fail(res, 500, "Unable to complete QR check-in");
  }
}

export async function ensureQrCheckInIndexes() {
  const db = await getMongoDb();
  await db.collection("qr_checkins").createIndex({ tokenHash: 1 }, { unique: true });
  await db.collection("qr_checkins").createIndex({ bookingId: 1, status: 1 });
  await db.collection("qr_checkins").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}
