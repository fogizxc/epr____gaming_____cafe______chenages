import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { getMongoDb } from "./mongodb.js";

export type AppRole = "CUSTOMER" | "EMPLOYEE" | "ADMIN" | "SUPER_ADMIN";
export interface AuthenticatedRequest extends Request { user?: { id: string; email?: string; name?: string; role: AppRole; permissions: string[] } }
const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must be configured and at least 32 characters long");
  return value;
}
function b64url(input: string | Buffer) { return Buffer.from(input).toString("base64url"); }
function sign(payload: Record<string, unknown>) {
  const body = b64url(JSON.stringify(payload));
  const mac = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}
function verify(token: string): Record<string, any> | null {
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch { return null; }
}
export function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) { return { hash: crypto.scryptSync(password, salt, 64).toString("hex"), salt }; }
export function verifyPassword(password: string, hash: string, salt: string) {
  try { const actual = crypto.scryptSync(password, salt, 64).toString("hex"); return actual.length === hash.length && crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(hash)); } catch { return false; }
}
export function createAccessToken(user: { id: string; email?: string; name?: string; role: AppRole; permissions?: string[] }) {
  const now = Math.floor(Date.now() / 1000);
  return sign({ typ: "access", sub: user.id, email: user.email, name: user.name, role: user.role, permissions: user.permissions || [], iat: now, exp: now + ACCESS_TTL_SECONDS });
}
export async function createRefreshToken(userId: string) {
  const raw = b64url(crypto.randomBytes(48));
  const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
  const now = new Date();
  await (await getMongoDb()).collection("refresh_tokens").insertOne({ userId, tokenHash, createdAt: now, expiresAt: new Date(now.getTime() + REFRESH_TTL_SECONDS * 1000), revokedAt: null });
  return raw;
}
export async function rotateRefreshToken(raw: string) {
  const db = await getMongoDb();
  const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
  const collection = db.collection("refresh_tokens");
  const record = await collection.findOne({ tokenHash, revokedAt: null, expiresAt: { $gt: new Date() } });
  if (!record) return null;
  await collection.updateOne({ _id: record._id }, { $set: { revokedAt: new Date() } });
  const user = await db.collection("users").findOne({ legacyId: record.userId, isActive: { $ne: false } });
  if (!user) return null;
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  const accessToken = createAccessToken({ id: String(user._id), email: user.email, name: user.name, role: user.role, permissions });
  const refreshToken = await createRefreshToken(String(user._id));
  return { accessToken, refreshToken, user: { id: String(user._id), email: user.email, name: user.name, role: user.role, permissions } };
}
export async function revokeRefreshToken(raw: string) {
  const db = await getMongoDb();
  const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
  await db.collection("refresh_tokens").updateOne({ tokenHash }, { $set: { revokedAt: new Date() } });
}
function getBearerToken(req: Request) { const header = req.header("authorization"); return header?.startsWith("Bearer ") ? header.slice(7).trim() : undefined; }
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const token = getBearerToken(req); const payload = token ? verify(token) : null;
  if (payload?.typ === "access" && payload.sub && payload.role) req.user = { id: String(payload.sub), email: payload.email, name: payload.name, role: payload.role, permissions: payload.permissions || [] };
  next();
}
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) { optionalAuth(req, res, () => req.user ? next() : res.status(401).json({ success: false, error: "Authentication required" })); }
export function requireRole(...roles: AppRole[]) { return (req: AuthenticatedRequest, res: Response, next: NextFunction) => { if (!req.user) return res.status(401).json({ success: false, error: "Authentication required" }); if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, error: "Insufficient permissions" }); next(); }; }
export function requirePermission(permission: string) { return (req: AuthenticatedRequest, res: Response, next: NextFunction) => { if (!req.user) return res.status(401).json({ success: false, error: "Authentication required" }); if (req.user.role === "SUPER_ADMIN" || req.user.permissions.includes(permission)) return next(); return res.status(403).json({ success: false, error: "Insufficient permissions" }); }; }
export async function ensureAuthIndexes() { const db = await getMongoDb(); await db.collection("users").createIndex({ email: 1 }, { unique: true, sparse: true }); await db.collection("users").createIndex({ phone: 1 }, { unique: true, sparse: true }); await db.collection("refresh_tokens").createIndex({ tokenHash: 1 }, { unique: true }); await db.collection("refresh_tokens").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); }
