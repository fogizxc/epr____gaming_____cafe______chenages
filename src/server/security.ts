import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { requireAuth, requireRole, optionalAuth } from "./auth.js";

const PUBLIC_EXACT = new Set([
  "/api/health",
  "/api/ready",
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/payments/webhook",
  "/api/membership/payment-webhook",
  "/api/fnb/payment-webhook",
  "/api/tournaments/payment-webhook",
  "/api/integrations/google-forms/tournament-response",
  "/api/games",
]);
const PUBLIC_PREFIXES = ["/api/games/"];
const CUSTOMER_PREFIXES = ["/api/me", "/api/stations", "/api/bookings", "/api/sessions", "/api/wallet", "/api/membership", "/api/rewards", "/api/referrals", "/api/fnb", "/api/support", "/api/payments", "/api/tournaments"];
const STAFF_PREFIXES = ["/api/employee/"];
const ADMIN_PREFIXES = ["/api/admin/"];

type RateBucket = { windowStartedAt: number; count: number };
const authRateBuckets = new Map<string, RateBucket>();
const AUTH_RATE_WINDOW_MS = 60_000;
const AUTH_RATE_LIMIT = 20;
const MAX_RATE_BUCKETS = 10_000;

function startsWithAny(path: string, prefixes: string[]) {
  return prefixes.some(prefix => path === prefix || path.startsWith(prefix));
}

function clientKey(req: Request) {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function isRateLimited(req: Request) {
  if (!startsWithAny(req.path, ["/api/auth/login", "/api/auth/register", "/api/auth/refresh"])) return false;
  const now = Date.now();
  const key = `${req.method}:${req.path}:${clientKey(req)}`;
  const current = authRateBuckets.get(key);
  if (!current || now - current.windowStartedAt >= AUTH_RATE_WINDOW_MS) {
    if (authRateBuckets.size >= MAX_RATE_BUCKETS) authRateBuckets.clear();
    authRateBuckets.set(key, { windowStartedAt: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > AUTH_RATE_LIMIT;
}

function applyRequestId(_req: Request, res: Response) {
  const requestId = randomUUID();
  res.locals.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
}

function applyApiSecurityHeaders(req: Request, res: Response) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  const configuredOrigin = process.env.APP_URL?.trim().replace(/\/$/, "");
  const origin = req.header("origin");
  if (configuredOrigin && origin === configuredOrigin) {
    res.setHeader("Access-Control-Allow-Origin", configuredOrigin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Idempotency-Key, X-Razorpay-Signature, X-Google-Forms-Secret, X-Request-ID");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  }
}

export function apiSecurityPolicy(req: Request, res: Response, next: NextFunction) {
  applyRequestId(req, res);
  if (req.path.startsWith("/api/")) applyApiSecurityHeaders(req, res);
  if (req.method === "OPTIONS" && req.path.startsWith("/api/")) return res.sendStatus(204);
  if (isRateLimited(req)) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({ success: false, error: "Too many authentication attempts. Please try again later.", requestId: res.locals.requestId });
  }
  if (PUBLIC_EXACT.has(req.path) || startsWithAny(req.path, PUBLIC_PREFIXES)) return next();
  if (!req.path.startsWith("/api/")) return next();
  if (startsWithAny(req.path, ADMIN_PREFIXES)) return requireRole("ADMIN", "SUPER_ADMIN")(req as any, res, next);
  if (req.path.startsWith("/api/brevo/") || req.path === "/api/env/status") return requireRole("ADMIN", "SUPER_ADMIN")(req as any, res, next);
  if (req.path === "/api/ai/concierge") return requireAuth(req as any, res, next);
  if (startsWithAny(req.path, STAFF_PREFIXES)) return requireRole("EMPLOYEE", "ADMIN", "SUPER_ADMIN")(req as any, res, next);
  if (startsWithAny(req.path, CUSTOMER_PREFIXES)) return requireAuth(req as any, res, next);
  return res.status(401).json({ success: false, error: "Authentication required", requestId: res.locals.requestId });
}

export function attachOptionalAuth(req: Request, res: Response, next: NextFunction) {
  return optionalAuth(req as any, res, next);
}
