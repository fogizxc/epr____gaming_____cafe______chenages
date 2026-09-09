import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../server/auth.js";
import { ObjectId } from "mongodb";
import { getMongoDb } from "../server/mongodb.js";
import { withTransaction, writeAuditLog } from "../server/domainRepositories.js";
import { INITIAL_SYSTEMS, INITIAL_PRICING_RULES } from "../data/initialData.js";

const SLOT_MINUTES = 30;
const OPEN_MINUTES = 9 * 60;
const CLOSE_MINUTES = 24 * 60;
const ACTIVE_BOOKING_STATUSES = ["UPCOMING", "ACTIVE"];

function timeToMinutes(value: string): number | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTime(value: number): string {
  const normalized = value % (24 * 60);
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}
function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
function sanitizeStation(station: any) {
  if (!station) return station;
  const { ipAddress, ...safe } = station;
  return safe;
}
function pricingFor(station: any, rule: any, date: string, startTime: string): number {
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

async function ensureStationSeeded() {
  const db = await getMongoDb();
  if (await db.collection("gaming_systems").estimatedDocumentCount() === 0) {
    const now = new Date();
    const documents = INITIAL_SYSTEMS.map((s: any) => ({ ...s, bookingVersion: 0, status: s.status === "ACTIVE" ? "AVAILABLE" : s.status, createdAt: now, updatedAt: now }));
    if (documents.length) await db.collection("gaming_systems").insertMany(documents, { ordered: false });
  }
  if (await db.collection("pricing_rules").estimatedDocumentCount() === 0) {
    const now = new Date();
    await db.collection("pricing_rules").insertMany(INITIAL_PRICING_RULES.map((p: any) => ({ ...p, createdAt: now, updatedAt: now })));
  }
}

export async function handleProductionGetStations(_req: Request, res: Response) {
  try {
    await ensureStationSeeded();
    const db = await getMongoDb();
    const stations = await db.collection("gaming_systems").find({}).sort({ category: 1, name: 1 }).toArray();
    return res.json({ success: true, stations: stations.map(sanitizeStation) });
  } catch (error) {
    console.error("stations/list", error);
    return res.status(503).json({ success: false, error: "Gaming floor is temporarily unavailable" });
  }
}

export async function handleProductionAvailability(req: Request, res: Response) {
  try {
    const systemId = String(req.params.id || "").trim();
    const date = typeof req.query.date === "string" ? req.query.date : new Date().toISOString().slice(0, 10);
    const duration = Number(req.query.duration ?? 1);
    if (!systemId || !validDate(date) || !Number.isFinite(duration) || duration < 0.5 || duration > 12 || duration % 0.5 !== 0) return res.status(400).json({ success: false, error: "Invalid availability parameters" });
    const durationMinutes = Math.round(duration * 60);
    const db = await getMongoDb();
    const station = await db.collection("gaming_systems").findOne({ id: systemId });
    if (!station) return res.status(404).json({ success: false, error: "Station not found" });
    const bookings = await db.collection("bookings").find({ systemId, date, bookingStatus: { $in: ACTIVE_BOOKING_STATUSES } }).project({ startTime: 1, endTime: 1 }).toArray();
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const stationUnavailableForDate = ["MAINTENANCE", "OFFLINE"].includes(String(station.status));
    const activeNow = date === today && String(station.status) === "ACTIVE";
    const activeEnd = Number(station.sessionEndTime || 0);
    const slots = [];
    for (let start = OPEN_MINUTES; start + durationMinutes <= CLOSE_MINUTES; start += SLOT_MINUTES) {
      const end = start + durationMinutes;
      const conflict = bookings.some((b: any) => { const bs = timeToMinutes(String(b.startTime)); const be = timeToMinutes(String(b.endTime)); return bs !== null && be !== null && start < be && end > bs; });
      const past = date === today && start < nowMinutes - 5;
      const activeCollision = activeNow && activeEnd > 0 && new Date(`${date}T${minutesToTime(start)}:00`).getTime() < activeEnd;
      const unavailable = stationUnavailableForDate || activeCollision;
      slots.push({ slot: minutesToTime(start), endTime: minutesToTime(end), available: !conflict && !past && !unavailable, status: stationUnavailableForDate ? String(station.status) : past ? "PAST" : activeCollision ? "ACTIVE_SESSION" : conflict ? "BOOKED" : "AVAILABLE", reason: stationUnavailableForDate ? "Station is unavailable" : past ? "Time slot has passed" : activeCollision ? "Station is currently occupied" : conflict ? "Reserved by another customer" : undefined });
    }
    return res.json({ success: true, station: sanitizeStation(station), date, slots });
  } catch (error) {
    console.error("stations/availability", error);
    return res.status(503).json({ success: false, error: "Availability is temporarily unavailable" });
  }
}

export async function handleProductionCreateBooking(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;
  try {
    const body = req.body || {};
    const systemId = typeof body.systemId === "string" ? body.systemId.trim() : "";
    const date = body.date;
    const startTime = body.startTime;
    const duration = Number(body.durationHours);
    const paymentMethod = ["Cash", "UPI", "Card", "Wallet", "Membership"].includes(body.paymentMethod) ? body.paymentMethod : "UPI";
    const idempotencyKey = String(req.header("Idempotency-Key") || body.idempotencyKey || "").trim();
    if (!authReq.user) return res.status(401).json({ success: false, error: "Authentication required" });
    if (!systemId || !validDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(startTime)) || !Number.isFinite(duration) || duration < 0.5 || duration > 12 || duration % 0.5 !== 0) return res.status(400).json({ success: false, error: "Invalid booking parameters" });
    if (!idempotencyKey || idempotencyKey.length < 16 || idempotencyKey.length > 128) return res.status(400).json({ success: false, error: "A valid Idempotency-Key is required" });
    const start = timeToMinutes(String(startTime))!;
    const end = start + Math.round(duration * 60);
    if (start < OPEN_MINUTES || end > CLOSE_MINUTES || start % SLOT_MINUTES !== 0) return res.status(400).json({ success: false, error: "Booking is outside operating hours" });

    const result = await withTransaction(async (db, session) => {
      const bookings = db.collection("bookings");
      const systems = db.collection("gaming_systems");
      const existing = await bookings.findOne({ customerId: authReq.user!.id, idempotencyKey }, { session });
      if (existing) return { existing, duplicate: true };
      const station = await systems.findOneAndUpdate({ id: systemId, status: { $nin: ["MAINTENANCE", "OFFLINE", "ACTIVE"] } }, { $inc: { bookingVersion: 1 }, $set: { updatedAt: new Date() } }, { session, returnDocument: "after" });
      if (!station) throw new Error("STATION_UNAVAILABLE");
      const endTime = minutesToTime(end);
      const conflict = await bookings.findOne({ systemId, date, bookingStatus: { $in: ACTIVE_BOOKING_STATUSES }, startTime: { $lt: endTime }, endTime: { $gt: String(startTime) } }, { session });
      if (conflict) throw new Error("BOOKING_CONFLICT");
      const rule = await db.collection("pricing_rules").findOne({ service: station.category });
      const hourlyRate = pricingFor(station, rule, date, String(startTime));
      const subtotalPaise = Math.round(hourlyRate * duration * 100);
      const now = new Date();
      const customer = ObjectId.isValid(authReq.user!.id) ? await db.collection("users").findOne({ _id: new ObjectId(authReq.user!.id) }, { session }) : null;
      const booking = {
        id: `BK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        customerId: authReq.user!.id, customerName: customer?.name || authReq.user!.name || "Customer", customerPhone: String(customer?.phone || body.customerPhone || "").slice(0, 30),
        systemId, systemName: station.name, service: station.category, gameTitle: typeof body.gameTitle === "string" ? body.gameTitle.trim().slice(0, 150) : undefined,
        date, startTime: String(startTime), endTime, durationHours: duration, applicableRate: hourlyRate, applicableRatePaise: Math.round(hourlyRate * 100),
        membershipUsedHours: 0, vipMembershipUsedHours: 0, discount: 0, discountPaise: 0, foodTotal: 0, foodTotalPaise: 0, subtotalPaise,
        finalAmount: subtotalPaise / 100, finalAmountPaise: subtotalPaise, paymentStatus: "PENDING", paymentMethod, bookingStatus: "UPCOMING", qrCode: "", idempotencyKey,
        createdAt: now.toISOString(), updatedAt: now,
      };
      booking.qrCode = booking.id;
      await bookings.insertOne(booking, { session });
      return { existing: booking, duplicate: false };
    });
    if (!result.duplicate) await writeAuditLog({ actorId: authReq.user.id, actorRole: authReq.user.role, action: "BOOKING_CREATED", entityType: "booking", entityId: result.existing.id, metadata: { systemId, date, startTime, duration } });
    return res.status(result.duplicate ? 200 : 201).json({ success: true, booking: result.existing, duplicate: result.duplicate });
  } catch (error: any) {
    if (error?.message === "BOOKING_CONFLICT") return res.status(409).json({ success: false, error: "This station is no longer available for the selected time", conflict: true });
    if (error?.message === "STATION_UNAVAILABLE") return res.status(409).json({ success: false, error: "This station is currently unavailable" });
    console.error("bookings/create", error);
    return res.status(500).json({ success: false, error: "Unable to create booking" });
  }
}
