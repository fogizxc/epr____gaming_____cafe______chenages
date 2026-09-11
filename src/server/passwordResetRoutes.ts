import crypto from "node:crypto";
import type { Express, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getMongoDb } from "./mongodb.js";
import { hashPassword } from "./auth.js";

const RESET_TTL_MS = 15 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function tokenHash(token: string) { return crypto.createHash("sha256").update(token).digest("hex"); }
function resetUrl(token: string) {
  const base = (process.env.APP_URL || "").trim().replace(/\/$/, "");
  return `${base}/?resetToken=${encodeURIComponent(token)}`;
}

async function sendResetEmail(to: string, name: string | undefined, token: string) {
  const user = (process.env.BREVO_SMTP_USER || process.env.BREVO_USER || "").trim();
  const key = (process.env.BREVO_SMTP_KEY || process.env.BREVO_API_KEY || process.env.BREVO_PASSWORD || "").trim();
  const fromEmail = (process.env.BREVO_FROM_EMAIL || "").trim();
  const fromName = process.env.BREVO_FROM_NAME || "Bytes & Brew Gaming Café";
  if (!user || !key || !fromEmail) return false;
  const url = resetUrl(token);
  const safeName = String(name || "Gamer").replace(/[&<>\"]/g, "");
  const subject = "Reset your Bytes & Brew password";
  const htmlContent = `<!doctype html><html><body style="margin:0;padding:32px;background:#070707;color:#fff;font-family:Arial,sans-serif"><div style="max-width:560px;margin:auto;background:#111;border:1px solid #27272a;border-radius:18px;padding:32px"><h2><span style="color:#ef4444">BYTES</span> &amp; BREW</h2><h1>Password reset</h1><p>Hi ${safeName},</p><p>We received a request to reset your password. This link expires in 15 minutes and can only be used once.</p><p><a href="${url}" style="display:inline-block;padding:14px 22px;background:#e50914;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">Reset password</a></p><p style="color:#888;font-size:12px">If you did not request this, ignore this email. Your password will remain unchanged.</p></div></body></html>`;
  const textContent = `Reset your Bytes & Brew password: ${url}\n\nThis link expires in 15 minutes and can only be used once.`;
  const response = await fetch("https://api.brevo.com/v3/smtp/email", { method: "POST", headers: { accept: "application/json", "content-type": "application/json", "api-key": key }, body: JSON.stringify({ sender: { name: fromName, email: fromEmail }, to: [{ email: to }], subject, htmlContent, textContent }) });
  if (!response.ok) throw new Error(`Brevo delivery failed (${response.status})`);
  return true;
}

export function registerPasswordResetRoutes(app: Express) {
  app.post("/api/auth/password-reset/request", async (req: Request, res: Response) => {
    const generic = { success: true, message: "If an account matches that email, reset instructions have been sent." };
    try {
      const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
      if (!EMAIL_RE.test(email)) return res.status(200).json(generic);
      const db = await getMongoDb();
      const user = await db.collection("users").findOne({ email, isActive: { $ne: false } }, { projection: { _id: 1, name: 1, email: 1 } });
      if (!user) return res.status(200).json(generic);
      const rawToken = crypto.randomBytes(32).toString("base64url");
      const now = new Date();
      await db.collection("password_reset_tokens").deleteMany({ userId: String(user._id), usedAt: null });
      await db.collection("password_reset_tokens").insertOne({ userId: String(user._id), tokenHash: tokenHash(rawToken), createdAt: now, expiresAt: new Date(now.getTime() + RESET_TTL_MS), usedAt: null });
      try { await sendResetEmail(email, user.name, rawToken); } catch (error) { console.error("password-reset email delivery failed:", error); }
      return res.status(200).json(generic);
    } catch (error) {
      console.error("password-reset/request", error);
      return res.status(200).json(generic);
    }
  });

  app.post("/api/auth/password-reset/complete", async (req: Request, res: Response) => {
    try {
      const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      if (token.length < 20 || token.length > 256 || password.length < 8 || password.length > 128) return res.status(400).json({ success: false, error: "Invalid reset request" });
      const db = await getMongoDb();
      const record = await db.collection("password_reset_tokens").findOne({ tokenHash: tokenHash(token), usedAt: null, expiresAt: { $gt: new Date() } });
      if (!record) return res.status(400).json({ success: false, error: "Reset link is invalid or expired" });
      const userQuery = ObjectId.isValid(String(record.userId)) ? { _id: new ObjectId(String(record.userId)) } : { legacyId: String(record.userId) };
      const { hash, salt } = hashPassword(password);
      const result = await db.collection("users").updateOne(userQuery as any, { $set: { passwordHash: hash, passwordSalt: salt, updatedAt: new Date() } });
      if (!result.matchedCount) return res.status(400).json({ success: false, error: "Account is unavailable" });
      await db.collection("password_reset_tokens").updateOne({ _id: record._id, usedAt: null }, { $set: { usedAt: new Date() } });
      await db.collection("refresh_tokens").updateMany({ userId: String(record.userId), revokedAt: null }, { $set: { revokedAt: new Date(), revokedReason: "password_reset" } });
      return res.json({ success: true, message: "Password updated. Please sign in again." });
    } catch (error) {
      console.error("password-reset/complete", error);
      return res.status(500).json({ success: false, error: "Unable to reset password" });
    }
  });
}

export async function ensurePasswordResetIndexes() {
  const db = await getMongoDb();
  await db.collection("password_reset_tokens").createIndex({ tokenHash: 1 }, { unique: true });
  await db.collection("password_reset_tokens").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection("password_reset_tokens").createIndex({ userId: 1 });
}
