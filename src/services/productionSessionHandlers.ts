import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import type { AuthenticatedRequest } from "../server/auth.js";
import { getMongoDb } from "../server/mongodb.js";
import { withTransaction, writeAuditLog } from "../server/domainRepositories.js";

const UPCOMING = "UPCOMING";
const ACTIVE = "ACTIVE";
const COMPLETED = "COMPLETED";
const CANCELLED = "CANCELLED";
const NO_SHOW = "NO-SHOW";
const STATION_AVAILABLE = "AVAILABLE";
const STATION_ACTIVE = "ACTIVE";
const STATION_RESERVED = "RESERVED";

function errorResponse(res: Response, status: number, error: string) {
  return res.status(status).json({ success: false, error });
}

function getUser(req: Request) {
  return (req as AuthenticatedRequest).user;
}

function parseId(req: Request) {
  return String(req.params.id || req.params.sessionId || "").trim();
}

function nowIso() { return new Date().toISOString(); }

async function findBooking(db: any, id: string, customerId: string) {
  return db.collection("bookings").findOne({ $or: [{ id }, ...(ObjectId.isValid(id) ? [{ _id: new ObjectId(id) }] : [])], customerId });
}

export async function handleProductionCheckInBooking(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return errorResponse(res, 401, "Authentication required");
  const bookingId = parseId(req);
  if (!bookingId) return errorResponse(res, 400, "Booking id is required");
  try {
    const result = await withTransaction(async (db, session) => {
      const booking = await findBooking(db, bookingId, user.id);
      if (!booking) throw new Error("BOOKING_NOT_FOUND");
      if (booking.bookingStatus === ACTIVE) return { booking, session: await db.collection("active_sessions").findOne({ bookingId: booking.id }, { session }), duplicate: true };
      if (booking.bookingStatus !== UPCOMING) throw new Error("BOOKING_NOT_CHECKINABLE");
      const station = await db.collection("gaming_systems").findOneAndUpdate({ id: booking.systemId, status: { $in: [STATION_AVAILABLE, STATION_RESERVED] } }, { $set: { status: STATION_ACTIVE, activeBookingId: booking.id, updatedAt: new Date() }, $inc: { bookingVersion: 1 } }, { session, returnDocument: "after" });
      if (!station) throw new Error("STATION_UNAVAILABLE");
      const now = new Date();
      const activeSession = { id: `SS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, bookingId: booking.id, customerId: user.id, systemId: booking.systemId, systemName: booking.systemName, service: booking.service, startedAt: now, scheduledEndAt: new Date(`${booking.date}T${booking.endTime}:00`), status: ACTIVE, extensionMinutes: 0, transferCount: 0, createdAt: now, updatedAt: now };
      await db.collection("active_sessions").insertOne(activeSession, { session });
      await db.collection("bookings").updateOne({ _id: booking._id }, { $set: { bookingStatus: ACTIVE, checkedInAt: now.toISOString(), updatedAt: now } }, { session });
      return { booking: { ...booking, bookingStatus: ACTIVE, checkedInAt: now.toISOString() }, session: activeSession, duplicate: false };
    });
    if (!result.duplicate) await writeAuditLog({ actorId: user.id, actorRole: user.role, action: "BOOKING_CHECKED_IN", entityType: "booking", entityId: result.booking.id, metadata: { sessionId: result.session?.id } });
    return res.json({ success: true, booking: result.booking, session: result.session, duplicate: result.duplicate });
  } catch (error: any) {
    if (error.message === "BOOKING_NOT_FOUND") return errorResponse(res, 404, "Booking not found");
    if (error.message === "BOOKING_NOT_CHECKINABLE") return errorResponse(res, 409, "Booking cannot be checked in from its current state");
    if (error.message === "STATION_UNAVAILABLE") return errorResponse(res, 409, "Station is no longer available");
    console.error("booking/check-in", error);
    return errorResponse(res, 500, "Unable to check in booking");
  }
}

export async function handleProductionCancelBooking(req: Request, res: Response) {
  const user = getUser(req); if (!user) return errorResponse(res, 401, "Authentication required");
  const bookingId = parseId(req); if (!bookingId) return errorResponse(res, 400, "Booking id is required");
  try {
    const result = await withTransaction(async (db, session) => {
      const booking = await findBooking(db, bookingId, user.id);
      if (!booking) throw new Error("BOOKING_NOT_FOUND");
      if (booking.bookingStatus === CANCELLED) return { booking, duplicate: true };
      if (![UPCOMING].includes(String(booking.bookingStatus))) throw new Error("BOOKING_NOT_CANCELLABLE");
      const updated = await db.collection("bookings").findOneAndUpdate({ _id: booking._id, bookingStatus: UPCOMING }, { $set: { bookingStatus: CANCELLED, cancelledAt: new Date().toISOString(), cancelReason: String(req.body?.reason || "Customer cancellation").slice(0, 250), updatedAt: new Date() } }, { session, returnDocument: "after" });
      if (!updated) throw new Error("BOOKING_STATE_RACE");
      return { booking: updated, duplicate: false };
    });
    if (!result.duplicate) await writeAuditLog({ actorId: user.id, actorRole: user.role, action: "BOOKING_CANCELLED", entityType: "booking", entityId: result.booking.id, metadata: { reason: result.booking.cancelReason } });
    return res.json({ success: true, booking: result.booking });
  } catch (error: any) {
    if (error.message === "BOOKING_NOT_FOUND") return errorResponse(res, 404, "Booking not found");
    if (error.message === "BOOKING_NOT_CANCELLABLE") return errorResponse(res, 409, "Only upcoming bookings can be cancelled");
    if (error.message === "BOOKING_STATE_RACE") return errorResponse(res, 409, "Booking was changed by another request");
    console.error("booking/cancel", error); return errorResponse(res, 500, "Unable to cancel booking");
  }
}

export async function handleProductionExtendSession(req: Request, res: Response) {
  const user = getUser(req); if (!user) return errorResponse(res, 401, "Authentication required");
  const sessionId = parseId(req); const minutes = Number(req.body?.minutes ?? req.body?.extensionMinutes);
  if (!sessionId || !Number.isInteger(minutes) || minutes < 30 || minutes > 360 || minutes % 30 !== 0) return errorResponse(res, 400, "Extension must be 30–360 minutes in 30-minute increments");
  try {
    const result = await withTransaction(async (db, session) => {
      const active = await db.collection("active_sessions").findOne({ id: sessionId, customerId: user.id, status: ACTIVE }, { session });
      if (!active) throw new Error("SESSION_NOT_FOUND");
      const currentEnd = new Date(active.scheduledEndAt);
      const newEnd = new Date(currentEnd.getTime() + minutes * 60000);
      const conflict = await db.collection("bookings").findOne({ systemId: active.systemId, date: newEnd.toISOString().slice(0, 10), bookingStatus: { $in: [UPCOMING, ACTIVE] }, startTime: { $lt: newEnd.toISOString().slice(11, 16) }, endTime: { $gt: currentEnd.toISOString().slice(11, 16) }, id: { $ne: active.bookingId } }, { session });
      if (conflict) throw new Error("EXTENSION_CONFLICT");
      const updated = await db.collection("active_sessions").findOneAndUpdate({ _id: active._id, status: ACTIVE }, { $set: { scheduledEndAt: newEnd, updatedAt: new Date() }, $inc: { extensionMinutes: minutes } }, { session, returnDocument: "after" });
      if (!updated) throw new Error("SESSION_STATE_RACE");
      return updated;
    });
    await writeAuditLog({ actorId: user.id, actorRole: user.role, action: "SESSION_EXTENDED", entityType: "active_session", entityId: result.id, metadata: { minutes } });
    return res.json({ success: true, session: result });
  } catch (error: any) {
    if (error.message === "SESSION_NOT_FOUND") return errorResponse(res, 404, "Active session not found");
    if (error.message === "EXTENSION_CONFLICT") return errorResponse(res, 409, "The requested extension conflicts with another booking");
    console.error("session/extend", error); return errorResponse(res, 500, "Unable to extend session");
  }
}

export async function handleProductionEndSession(req: Request, res: Response) {
  const user = getUser(req); if (!user) return errorResponse(res, 401, "Authentication required");
  const sessionId = parseId(req); if (!sessionId) return errorResponse(res, 400, "Session id is required");
  try {
    const result = await withTransaction(async (db, tx) => {
      const active = await db.collection("active_sessions").findOne({ id: sessionId, customerId: user.id, status: ACTIVE }, { session: tx });
      if (!active) throw new Error("SESSION_NOT_FOUND");
      const now = new Date();
      const updated = await db.collection("active_sessions").findOneAndUpdate({ _id: active._id, status: ACTIVE }, { $set: { status: COMPLETED, endedAt: now, updatedAt: now }, $setOnInsert: {} }, { session: tx, returnDocument: "after" });
      if (!updated) throw new Error("SESSION_STATE_RACE");
      await db.collection("bookings").updateOne({ id: active.bookingId, bookingStatus: ACTIVE }, { $set: { bookingStatus: COMPLETED, completedAt: now.toISOString(), updatedAt: now } }, { session: tx });
      await db.collection("gaming_systems").updateOne({ id: active.systemId, activeBookingId: active.bookingId }, { $set: { status: STATION_AVAILABLE, updatedAt: now }, $unset: { activeBookingId: "" }, $inc: { bookingVersion: 1 } }, { session: tx });
      return updated;
    });
    await writeAuditLog({ actorId: user.id, actorRole: user.role, action: "SESSION_ENDED", entityType: "active_session", entityId: result.id });
    return res.json({ success: true, session: result });
  } catch (error: any) {
    if (error.message === "SESSION_NOT_FOUND") return errorResponse(res, 404, "Active session not found");
    console.error("session/end", error); return errorResponse(res, 500, "Unable to end session");
  }
}

export async function handleProductionMyActiveSession(req: Request, res: Response) {
  const user = getUser(req); if (!user) return errorResponse(res, 401, "Authentication required");
  try {
    const active = await (await getMongoDb()).collection("active_sessions").findOne({ customerId: user.id, status: ACTIVE }, { sort: { startedAt: -1 } });
    if (!active) return res.json({ success: true, session: null });
    const remainingMs = Math.max(0, new Date(active.scheduledEndAt).getTime() - Date.now());
    return res.json({ success: true, session: active, remainingSeconds: Math.floor(remainingMs / 1000) });
  } catch (error) { console.error("session/me", error); return errorResponse(res, 503, "Session status temporarily unavailable"); }
}
