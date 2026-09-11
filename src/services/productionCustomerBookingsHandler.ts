import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../server/auth.js";
import { getMongoDb } from "../server/mongodb.js";

export async function handleProductionCustomerBookings(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ success: false, error: "Authentication required" });
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
    const status = typeof req.query.status === "string" ? req.query.status.trim().toUpperCase() : "";
    const query: Record<string, any> = { customerId: user.id };
    if (status) query.bookingStatus = status;
    const db = await getMongoDb();
    const bookings = await db.collection("bookings").find(query).sort({ date: -1, startTime: -1, createdAt: -1 }).limit(limit).toArray();
    return res.json({ success: true, bookings, count: bookings.length });
  } catch (error) {
    console.error("bookings/me", error);
    return res.status(503).json({ success: false, error: "Booking history is temporarily unavailable" });
  }
}
