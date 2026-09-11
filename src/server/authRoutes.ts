import type { Express, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getMongoDb } from "./mongodb.js";
import {
  type AppRole,
  type AuthenticatedRequest,
  createAccessToken,
  createRefreshToken,
  hashPassword,
  requireAuth,
  revokeRefreshToken,
  rotateRefreshToken,
  verifyPassword,
} from "./auth.js";
import { clearLoginFailures, isLoginBlocked, recordLoginFailure } from "./loginGuard.js";

const VALID_ROLES: AppRole[] = ["CUSTOMER", "EMPLOYEE", "ADMIN", "SUPER_ADMIN"];
const REFRESH_COOKIE = "nexus_refresh_token";
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const CLIENT_REFRESH_MARKER = "http-only-cookie";

function publicUser(user: any) {
  return {
    id: String(user._id), email: user.email, name: user.name, gamerTag: user.gamerTag,
    phone: user.phone, role: user.role, permissions: Array.isArray(user.permissions) ? user.permissions : [], avatar: user.avatar,
  };
}

function validatePassword(password: unknown) {
  return typeof password === "string" && password.length >= 8 && password.length <= 128;
}

function readCookie(req: Request, name: string) {
  const header = req.header("cookie") || "";
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    if (key !== name) continue;
    try { return decodeURIComponent(part.slice(index + 1).trim()); } catch { return part.slice(index + 1).trim(); }
  }
  return "";
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/auth" });
}

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { name, email, phone, password, gamerTag } = req.body || {};
      if (typeof name !== "string" || name.trim().length < 2 || name.length > 100) return res.status(400).json({ success: false, error: "A valid name is required" });
      if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, error: "A valid email is required" });
      if (!validatePassword(password)) return res.status(400).json({ success: false, error: "Password must be 8-128 characters" });
      if (phone !== undefined && (typeof phone !== "string" || phone.trim().length > 30)) return res.status(400).json({ success: false, error: "Invalid phone number" });
      const db = await getMongoDb();
      const normalizedEmail = email.trim().toLowerCase();
      const existing = await db.collection("users").findOne({ email: normalizedEmail });
      if (existing) return res.status(409).json({ success: false, error: "An account with this email already exists" });
      const { hash, salt } = hashPassword(password);
      const user = {
        name: name.trim(), email: normalizedEmail,
        phone: typeof phone === "string" ? phone.trim() : undefined,
        gamerTag: typeof gamerTag === "string" ? gamerTag.trim().slice(0, 50) : undefined,
        passwordHash: hash, passwordSalt: salt, role: "CUSTOMER" as const, permissions: [],
        isActive: true, isEmailVerified: false, createdAt: new Date(), updatedAt: new Date(),
      };
      const result = await db.collection("users").insertOne(user);
      const created = { ...user, _id: result.insertedId };
      const accessToken = createAccessToken({ id: String(result.insertedId), email: created.email, name: created.name, role: created.role, permissions: [] });
      const refreshToken = await createRefreshToken(String(result.insertedId));
      setRefreshCookie(res, refreshToken);
      return res.status(201).json({ success: true, accessToken, refreshToken: CLIENT_REFRESH_MARKER, user: publicUser(created) });
    } catch (error: any) {
      if (error?.code === 11000) return res.status(409).json({ success: false, error: "An account with that email or phone already exists" });
      console.error("auth/register", error);
      return res.status(500).json({ success: false, error: "Unable to create account" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, idOrUsername, password } = req.body || {};
      if (!validatePassword(password)) return res.status(400).json({ success: false, error: "Invalid credentials" });
      const identifier = String(email || idOrUsername || "").trim();
      if (!identifier) return res.status(400).json({ success: false, error: "Invalid credentials" });
      const db = await getMongoDb();
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      if (await isLoginBlocked(db, identifier, clientIp)) {
        return res.status(429).json({ success: false, error: "Too many failed login attempts. Try again later." });
      }
      const user = await db.collection("users").findOne({ $or: [{ email: identifier.toLowerCase() }, { gamerTag: identifier }, { phone: identifier }, { staffCode: identifier }], isActive: { $ne: false } });
      if (!user || !user.passwordHash || !user.passwordSalt || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
        await recordLoginFailure(db, identifier, clientIp);
        return res.status(401).json({ success: false, error: "Invalid credentials" });
      }
      const role = (user.role || "CUSTOMER") as AppRole;
      if (!VALID_ROLES.includes(role)) return res.status(403).json({ success: false, error: "Account role is not permitted" });
      await clearLoginFailures(db, identifier, clientIp);
      const permissions = Array.isArray(user.permissions) ? user.permissions : [];
      const accessToken = createAccessToken({ id: String(user._id), email: user.email, name: user.name, role, permissions });
      const refreshToken = await createRefreshToken(String(user._id));
      setRefreshCookie(res, refreshToken);
      await db.collection("users").updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date(), updatedAt: new Date() } });
      return res.json({ success: true, accessToken, refreshToken: CLIENT_REFRESH_MARKER, user: publicUser(user) });
    } catch (error) {
      console.error("auth/login", error);
      return res.status(500).json({ success: false, error: "Unable to authenticate" });
    }
  });

  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    try {
      const refreshToken = readCookie(req, REFRESH_COOKIE) || (typeof req.body?.refreshToken === "string" ? req.body.refreshToken : "");
      if (!refreshToken || refreshToken.length > 512) return res.status(401).json({ success: false, error: "Refresh token required" });
      const rotated = await rotateRefreshToken(refreshToken);
      if (!rotated) {
        clearRefreshCookie(res);
        return res.status(401).json({ success: false, error: "Refresh token expired or revoked" });
      }
      setRefreshCookie(res, rotated.refreshToken);
      return res.json({ success: true, accessToken: rotated.accessToken, refreshToken: CLIENT_REFRESH_MARKER, user: rotated.user });
    } catch (error) {
      console.error("auth/refresh", error);
      return res.status(500).json({ success: false, error: "Unable to refresh session" });
    }
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      const refreshToken = readCookie(req, REFRESH_COOKIE) || (typeof req.body?.refreshToken === "string" ? req.body.refreshToken : "");
      if (refreshToken && refreshToken !== CLIENT_REFRESH_MARKER) await revokeRefreshToken(refreshToken);
      clearRefreshCookie(res);
      return res.json({ success: true });
    } catch (error) {
      console.error("auth/logout", error);
      clearRefreshCookie(res);
      return res.status(500).json({ success: false, error: "Unable to log out" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.user!.id;
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { legacyId: id };
      const user = await getMongoDb().then((db) => db.collection("users").findOne(query));
      if (!user) return res.status(404).json({ success: false, error: "User not found" });
      return res.json({ success: true, user: publicUser(user) });
    } catch (error) {
      console.error("auth/me", error);
      return res.status(500).json({ success: false, error: "Unable to load account" });
    }
  });
}
