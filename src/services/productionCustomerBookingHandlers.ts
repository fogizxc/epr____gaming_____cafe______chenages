import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../server/auth.js";
import { getMongoDb } from "../server/mongodb.js";

function user(req: Request) { return (req as AuthenticatedRequest).user; }

/** Server-authoritative customer booking feed. The UI should use this instead of localStorage as its source of truth. */
export async function handleProductionMyBookings(req: Request, res: Response) {
  const actor = user(req);
  if (!actor) return res.status(401).json({ success: false, error: "Authentication required" });

  const requestedLimit = Number(req.query.limit ?? 100);
  const limit = Number.isFinite(requestedLimit) ? Math.min(200, Math.max(1, Math.floor(requestedLimit))) : 100;
  const status = typeof req.query.status === "string" ? req.query.status.trim().toUpperCase() : "";

  try {
    const db = await getMongoDb();
    const query: Record<string, unknown> = { customerId: actor.id };
    if (status && ["UPCOMING", "CONFIRMED", "ACTIVE", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO-SHOW"].includes(status)) query.bookingStatus = status;

    const bookings = await db.collection("bookings")
      .find(query)
      .sort({ createdAt: -1, date: -1, startTime: -1 })
      .limit(limit)
      .toArray();

    return res.json({ success: true, bookings, count: bookings.length, source: "mongodb" });
  } catch (error) {
    console.error("customer bookings feed", error);
    return res.status(500).json({ success: false, error: "Unable to load bookings right now." });
  }
}
