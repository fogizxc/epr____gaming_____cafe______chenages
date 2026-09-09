import crypto from "node:crypto";
import type { Express, Request, Response } from "express";
import { getDb } from "./mongodb.js";
import {
  AppRole,
  AuthenticatedRequest,
  createAccessToken,
  createRefreshToken,
  hashPassword,
  requireAuth,
  revokeRefreshToken,
  rotateRefreshToken,
  verifyPassword,
} from "./auth.js";

const PUBLIC_ROLES: AppRole[] = ["CUSTOMER"];

function publicUser(user: any) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    gamerTag: user.gamerTag,
    phone: user.phone,
    role: user.role,
    permissions: Array.isArray(user.permissions) ? user.permissions : [],
    avatar: user.avatar,
  };
}

function validatePassword(password: unknown) {
  return typeof password === "string" && password.length >= 8 && password.length <= 128;
}

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { name, email, phone, password, gamerTag } = req.body || {};
      if (typeof name !== "string" || name.trim().length < 2 || name.length > 100) {
        return res.status(400).json({ success: false, error: "A valid name is required" });
      }
      if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, error: "A valid email is required" });
      }
      if (!validatePassword(password)) return res.status(400).json({ success: false, error: "Password must be 8-128 characters" });
      if (phone !== undefined && (typeof phone !== "string" || phone.length > 30)) {
        return res.status(400).json({ success: false, error: "Invalid phone number" });
      }

      const db = getDb();
      const normalizedEmail = email.trim().toLowerCase();
      const existing = await db.collection("users").findOne({ email: normalizedEmail });
      if (existing) return res.status(409).json({ success: false, error: "An account with this email already exists" });

      const { hash, salt } = hashPassword(password);
      const user = {
        name: name.trim(),
        email: normalizedEmail,
        phone: typeof phone === "string" ? phone.trim() : undefined,
        gamerTag: typeof gamerTag === "string" ? gamerTag.trim().slice(0, 50) : undefined,
        passwordHash: hash,
        passwordSalt: salt,
        role: "CUSTOMER" as const,
        permissions: [],
        isActive: true,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await db.collection("users").insertOne(user);
      const created = { ...user, _id: result.insertedId };
      const accessToken = createAccessToken({ id: String(result.insertedId), email: created.email, name: created.name, role: created.role, permissions: [] });
      const refreshToken = await createRefreshToken(String(result.insertedId));
      return res.status(201).json({ success: true, accessToken, refreshToken, user: publicUser(created) });
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

      const db = getDb();
      const user = await db.collection("users").findOne({
        $or: [{ email: identifier.toLowerCase() }, { gamerTag: identifier }, { phone: identifier }, { staffCode: identifier }],
        isActive: { $ne: false },
      });
      if (!user || !user.passwordHash || !user.passwordSalt || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
        return res.status(401).json({ success: false, error: "Invalid credentials" });
      }

      const role = (user.role || "CUSTOMER") as AppRole;
      if (!PUBLIC_ROLES.includes(role) && !["EMPLOYEE", "ADMIN", "SUPER_ADMIN"].includes(role)) {
        return res.status(403).json({ success: false, error: "Account role is not permitted" });
      }
      const permissions = Array.isArray(user.permissions) ? user.permissions : [];
      const accessToken = createAccessToken({ id: String(user._id), email: user.email, name: user.name, role, permissions });
      const refreshToken = await createRefreshToken(String(user._id));
      await db.collection("users").updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date(), updatedAt: new Date() } });
      return res.json({ success: true, accessToken, refreshToken, user: publicUser(user) });
    } catch (error) {
      console.error("auth/login", error);
      return res.status(500).json({ success: false, error: "Unable to authenticate" });
    }
  });

  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    try {
      const refreshToken = typeof req.body?.refreshToken === "string" ? req.body.refreshToken : "";
      if (!refreshToken) return res.status(401).json({ success: false, error: "Refresh token required" });
      const rotated = await rotateRefreshToken(refreshToken);
      if (!rotated) return res.status(401).json({ success: false, error: "Refresh token expired or revoked" });
      return res.json({ success: true, ...rotated });
    } catch (error) {
      console.error("auth/refresh", error);
      return res.status(500).json({ success: false, error: "Unable to refresh session" });
    }
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      if (typeof req.body?.refreshToken === "string") await revokeRefreshToken(req.body.refreshToken);
      return res.json({ success: true });
    } catch (error) {
      console.error("auth/logout", error);
      return res.status(500).json({ success: false, error: "Unable to log out" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await getDb().collection("users").findOne({ _id: req.user!.id as any });
      if (!user) return res.status(404).json({ success: false, error: "User not found" });
      return res.json({ success: true, user: publicUser(user) });
    } catch {
      // IDs are intentionally accepted as strings by the access token; resolve through string id fallback.
      const user = await getDb().collection("users").findOne({ legacyId: req.user!.id });
      if (!user) return res.status(404).json({ success: false, error: "User not found" });
      return res.json({ success: true, user: publicUser(user) });
    }
  });
}
