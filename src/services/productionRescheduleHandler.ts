import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../server/auth.js";
import { ObjectId } from "mongodb";
import { getMongoDb, getMongoClient } from "../server/mongodb.js";
import { writeAuditLog } from "../server/domainRepositories.js";

const UPCOMING = "UPCOMING";
const SLOT_MINUTES = 30;
const OPEN_MINUTES = 9 * 60;
const CLOSE_MINUTES = 24 * 60;
const RESCHEDULE_CUTOFF_MINUTES = Math.max(0, Number(process.env.BOOKING_RESCHEDULE_CUTOFF_MINUTES ?? 60));

function fail(res: Response, status: number, error: string) { return res.status(status).json({ success: false, error }); }
function timeToMinutes(value: string) { if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null; const [h,m] = value.split(":").map(Number); return h * 60 + m; }
function validDate(value: unknown): value is string { if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const d = new Date(`${value}T00:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10) === value; }
function businessDateTime(date: string, time: string) { const timezone = String(process.env.BUSINESS_TIMEZONE || "Asia/Kolkata"); return timezone === "Asia/Kolkata" ? new Date(`${date}T${time}:00+05:30`) : new Date(`${date}T${time}:00Z`); }
function minutesToTime(value: number) { return `${String(Math.floor(value / 60)).padStart(2,"0")}:${String(value % 60).padStart(2,"0")}`; }
function pricingFor(station: any, rule: any, date: string, startTime: string) {
  const fallback = Number(station.hourlyRate) || 0;
  if (!rule) return fallback;
  const day = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  const start = timeToMinutes(startTime) ?? 0;
  const peakStart = timeToMinutes(String(rule.peakHoursStart)) ?? 18 * 60;
  const peakEnd = timeToMinutes(String(rule.peakHoursEnd)) ?? 23 * 60;
  if ((day === "Saturday" || day === "Sunday") && Number(rule.weekendPrice) > 0) return Number(rule.weekendPrice);
  if (rule.isPeakEnabled !== false && start >= peakStart && start < peakEnd && Number(rule.peakPrice) > 0) return Number(rule.peakPrice);
  return Number(rule.normalPrice) > 0 ? Number(rule.normalPrice) : fallback;
}

export async function handleProductionRescheduleBooking(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return fail(res, 401, "Authentication required");
  const bookingId = String(req.params.id || "").trim();
  const date = req.body?.date;
  const startTime = String(req.body?.startTime || "");
  if (!bookingId || !validDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) return fail(res, 400, "Valid date and start time are required");

  try {
    const db = await getMongoDb();
    const client = getMongoClient();
    if (!client) return fail(res, 503, "MongoDB transaction support is unavailable");
    const session = client.startSession();
    let result: any;
    try {
      await session.withTransaction(async () => {
        const booking = await db.collection("bookings").findOne({ $or: [{ id: bookingId }, ...(ObjectId.isValid(bookingId) ? [{ _id: new ObjectId(bookingId) }] : [])], customerId: user.id }, { session });
        if (!booking) throw new Error("BOOKING_NOT_FOUND");
        if (booking.bookingStatus !== UPCOMING) throw new Error("BOOKING_NOT_RESCHEDULABLE");

        const originalStart = businessDateTime(String(booking.date), String(booking.startTime));
        const now = new Date();
        if (originalStart.getTime() - now.getTime() < RESCHEDULE_CUTOFF_MINUTES * 60000) throw new Error("RESCHEDULE_CUTOFF");

        const duration = Number(booking.durationHours);
        if (!Number.isFinite(duration) || duration < 0.5 || duration > 12 || duration % 0.5 !== 0) throw new Error("INVALID_DURATION");
        const start = timeToMinutes(startTime)!;
        const end = start + Math.round(duration * 60);
        if (start < OPEN_MINUTES || end > CLOSE_MINUTES || start % SLOT_MINUTES !== 0) throw new Error("OUTSIDE_HOURS");
        const targetStart = businessDateTime(String(date), startTime);
        if (targetStart.getTime() <= now.getTime()) throw new Error("TARGET_IN_PAST");

        const station = await db.collection("gaming_systems").findOne({ id: booking.systemId, status: { $nin: ["MAINTENANCE", "OFFLINE"] } }, { session });
        if (!station) throw new Error("STATION_UNAVAILABLE");
        if (String(date) === String(booking.date) && startTime === String(booking.startTime)) { result = booking; return; }

        const endTime = minutesToTime(end);
        const conflict = await db.collection("bookings").findOne({ systemId: booking.systemId, date: String(date), bookingStatus: { $in: ["UPCOMING", "ACTIVE"] }, id: { $ne: booking.id }, startTime: { $lt: endTime }, endTime: { $gt: startTime } }, { session });
        if (conflict) throw new Error("BOOKING_CONFLICT");

        const rule = await db.collection("pricing_rules").findOne({ service: station.category }, { session });
        const newRate = pricingFor(station, rule, String(date), startTime);
        const oldAmount = Number(booking.finalAmountPaise ?? Math.round(Number(booking.finalAmount || 0) * 100));
        const newAmount = Math.round(newRate * duration * 100);
        if (oldAmount !== newAmount) throw new Error("PRICE_CHANGED");

        result = await db.collection("bookings").findOneAndUpdate({ _id: booking._id, bookingStatus: UPCOMING }, { $set: { date: String(date), startTime, endTime, applicableRate: newRate, applicableRatePaise: Math.round(newRate * 100), updatedAt: new Date(), rescheduledAt: new Date().toISOString(), rescheduledFrom: { date: booking.date, startTime: booking.startTime } }, $inc: { rescheduleCount: 1 } }, { session, returnDocument: "after" });
        if (!result) throw new Error("STATE_RACE");
      });
    } finally { await session.endSession(); }

    if (!result) return fail(res, 500, "Unable to reschedule booking");
    await writeAuditLog({ actorId: user.id, actorRole: user.role, action: "BOOKING_RESCHEDULED", entityType: "booking", entityId: result.id, metadata: { date: result.date, startTime: result.startTime } });
    return res.json({ success: true, booking: result });
  } catch (error: any) {
    if (error.message === "BOOKING_NOT_FOUND") return fail(res, 404, "Booking not found");
    if (error.message === "BOOKING_NOT_RESCHEDULABLE") return fail(res, 409, "Only upcoming bookings can be rescheduled");
    if (error.message === "RESCHEDULE_CUTOFF") return fail(res, 409, `Rescheduling closes ${RESCHEDULE_CUTOFF_MINUTES} minutes before the original start time`);
    if (error.message === "INVALID_DURATION") return fail(res, 409, "This booking has an invalid duration");
    if (error.message === "OUTSIDE_HOURS") return fail(res, 400, "The new time is outside café operating hours");
    if (error.message === "TARGET_IN_PAST") return fail(res, 409, "The new booking time must be in the future");
    if (error.message === "STATION_UNAVAILABLE") return fail(res, 409, "The assigned station is unavailable");
    if (error.message === "BOOKING_CONFLICT") return fail(res, 409, "The selected time is already booked");
    if (error.message === "PRICE_CHANGED") return fail(res, 409, "That time has a different price; cancel and create a new booking instead");
    if (error.message === "STATE_RACE") return fail(res, 409, "The booking changed before it could be rescheduled");
    console.error("booking/reschedule", error);
    return fail(res, 500, "Unable to reschedule booking");
  }
}
