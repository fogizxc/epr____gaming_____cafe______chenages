import type { NextFunction, Request, Response } from "express";
import { requireAuth, requireRole, optionalAuth } from "./auth.js";

const PUBLIC_EXACT = new Set([
  "/api/health",
  "/api/ready",
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/payments/webhook",
]);

const CUSTOMER_PREFIXES = [
  "/api/me", "/api/stations", "/api/bookings", "/api/sessions", "/api/wallet",
  "/api/membership", "/api/rewards", "/api/referrals", "/api/fnb", "/api/support",
  "/api/payments",
];

const STAFF_PREFIXES = ["/api/employee/"];
const ADMIN_PREFIXES = ["/api/admin/"];

function startsWithAny(path: string, prefixes: string[]) { return prefixes.some((prefix) => path === prefix || path.startsWith(prefix)); }

export function apiSecurityPolicy(req: Request, res: Response, next: NextFunction) {
  if (PUBLIC_EXACT.has(req.path)) return next();
  if (!req.path.startsWith("/api/")) return next();
  if (startsWithAny(req.path, ADMIN_PREFIXES)) return requireRole("ADMIN", "SUPER_ADMIN")(req as any, res, next);
  if (req.path.startsWith("/api/brevo/") || req.path === "/api/env/status") return requireRole("ADMIN", "SUPER_ADMIN")(req as any, res, next);
  if (req.path === "/api/ai/concierge") return requireAuth(req as any, res, next);
  if (startsWithAny(req.path, STAFF_PREFIXES)) return requireRole("EMPLOYEE", "ADMIN", "SUPER_ADMIN")(req as any, res, next);
  if (startsWithAny(req.path, CUSTOMER_PREFIXES)) return requireAuth(req as any, res, next);
  return res.status(401).json({ success: false, error: "Authentication required" });
}

export function attachOptionalAuth(req: Request, res: Response, next: NextFunction) {
  return optionalAuth(req as any, res, next);
}
