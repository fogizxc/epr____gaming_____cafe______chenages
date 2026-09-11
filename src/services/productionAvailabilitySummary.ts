import type { Request, Response } from "express";
import { getMongoDb } from "../server/mongodb.js";

const SLOT_MINUTES = 30;
const OPEN_MINUTES = 9 * 60;
const CLOSE_MINUTES = 24 * 60;
const ACTIVE_BOOKING_STATUSES = ["UPCOMING", "ACTIVE"];

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function timeToMinutes(value: string): number | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(value: number): string {
  if (value === CLOSE_MINUTES) return "24:00";
  const normalized = value % (24 * 60);
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

function businessNow() {
  const now = new Date();
  const timezone = String(process.env.BUSINESS_TIMEZONE || "Asia/Kolkata");
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

function categoryMatches(stationCategory: string, requested: string) {
  if (!requested) return true;
  const a = stationCategory.toLowerCase();
  const b = requested.toLowerCase();
  if (a === b) return true;
  if ((a === "ps5" || a === "playstation") && (b === "ps5" || b === "playstation")) return true;
  return false;
}

function sanitizeStation(station: any) {
  if (!station) return station;
  const { ipAddress, ...safe } = station;
  return safe;
}

export async function handleProductionAvailabilitySummary(req: Request, res: Response) {
  try {
    const date = typeof req.query.date === "string" ? req.query.date : businessNow().date;
    const duration = Number(req.query.duration ?? 1);
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
    if (!validDate(date) || !Number.isFinite(duration) || duration < 0.5 || duration > 12 || duration % 0.5 !== 0) {
      return res.status(400).json({ success: false, error: "Invalid availability parameters" });
    }

    const durationMinutes = Math.round(duration * 60);
    const db = await getMongoDb();
    const stations = await db.collection("gaming_systems").find({}).sort({ category: 1, name: 1 }).toArray();
    const filtered = stations.filter((station: any) => categoryMatches(String(station.category || ""), category));
    const bookingRows = await db.collection("bookings").find({
      date,
      bookingStatus: { $in: ACTIVE_BOOKING_STATUSES },
      ...(filtered.length ? { systemId: { $in: filtered.map((s: any) => s.id) } } : {}),
    }).project({ systemId: 1, startTime: 1, endTime: 1, bookingStatus: 1 }).toArray();

    const now = businessNow();
    const today = date === now.date;
    const byStation = new Map<string, any[]>();
    for (const booking of bookingRows) {
      const list = byStation.get(String(booking.systemId)) || [];
      list.push(booking);
      byStation.set(String(booking.systemId), list);
    }

    const stationResults = filtered.map((station: any) => {
      const stationBookings = byStation.get(String(station.id)) || [];
      const unavailable = ["MAINTENANCE", "OFFLINE"].includes(String(station.status));
      const activeEnd = Number(station.sessionEndTime || 0);
      const slots: any[] = [];
      for (let start = OPEN_MINUTES; start + durationMinutes <= CLOSE_MINUTES; start += SLOT_MINUTES) {
        const end = start + durationMinutes;
        const conflict = stationBookings.some((booking: any) => {
          const bs = timeToMinutes(String(booking.startTime));
          const be = timeToMinutes(String(booking.endTime));
          return bs !== null && be !== null && start < be && end > bs;
        });
        const past = today && start < now.minutes - 5;
        const activeCollision = today && String(station.status) === "ACTIVE" && activeEnd > 0 && start < activeEnd;
        if (!unavailable && !past && !activeCollision && !conflict) {
          slots.push({ startTime: minutesToTime(start), endTime: minutesToTime(end) });
        }
      }
      return {
        station: sanitizeStation(station),
        available: slots.length > 0,
        nextSlot: slots[0] || null,
        slots: slots.slice(0, 12),
      };
    });

    const availableStations = stationResults.filter((result: any) => result.available);
    return res.json({
      success: true,
      date,
      durationHours: duration,
      category: category || null,
      generatedAt: new Date().toISOString(),
      summary: {
        totalStations: stationResults.length,
        availableStations: availableStations.length,
        unavailableStations: stationResults.length - availableStations.length,
        nextAvailable: availableStations.length ? availableStations[0].nextSlot : null,
      },
      stations: stationResults,
    });
  } catch (error) {
    console.error("stations/availability-summary", error);
    return res.status(503).json({ success: false, error: "Live availability is temporarily unavailable" });
  }
}
