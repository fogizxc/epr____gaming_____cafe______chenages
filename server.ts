import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { GoogleGenAI } from "@google/genai";
import { apiSecurityPolicy } from "./src/server/security.js";
import { applyProductionPreload } from "./src/server/preload.js";
import { closeMongoDb } from "./src/server/mongodb.js";

dotenv.config();

const PORT = Number(process.env.PORT || 3000);

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it in Secrets.");
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

interface BrevoEmailPayload { to: string; toName?: string; subject: string; htmlContent?: string; textContent?: string; type?: 'OTP_VERIFICATION' | 'PASSWORD_RESET' | 'BOOKING_CONFIRMATION' | 'CUSTOM'; otpCode?: string; }

function getBrevoConfig() {
  const host = (process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com").trim();
  const port = parseInt(process.env.BREVO_SMTP_PORT || "587", 10);
  const user = (process.env.BREVO_SMTP_USER || process.env.BREVO_USER || "").trim();
  const key = (process.env.BREVO_SMTP_KEY || process.env.BREVO_API_KEY || process.env.BREVO_PASSWORD || "").trim();
  const fromEmail = (process.env.BREVO_FROM_EMAIL || "").trim();
  const fromName = process.env.BREVO_FROM_NAME || "Bytes & Brew Gaming Café";
  return { host, port, user, key, fromEmail, fromName, isConfigured: Boolean(user && key && fromEmail) };
}

function createBrevoTransporter() {
  const config = getBrevoConfig();
  if (!config.isConfigured) return null;
  return nodemailer.createTransport({ host: config.host, port: config.port, secure: config.port === 465, auth: { user: config.user, pass: config.key }, connectionTimeout: 10000, greetingTimeout: 5000, socketTimeout: 15000 });
}

function generateEmailHtml(payload: BrevoEmailPayload): string {
  if (payload.htmlContent) return payload.htmlContent;
  const otp = payload.otpCode || "";
  const title = payload.type === "PASSWORD_RESET" ? "Password Recovery Verification" : payload.type === "BOOKING_CONFIRMATION" ? "Station Booking Confirmation" : "Gaming Arena Verification Code";
  return `<!DOCTYPE html><html lang="en"><body style="margin:0;padding:40px 10px;background:#080808;color:#fff;font-family:Arial,sans-serif"><table role="presentation" width="100%"><tr><td align="center"><table role="presentation" width="100%" style="max-width:580px;background:#111;border:1px solid #222;border-radius:20px"><tr><td style="padding:36px"><h2><span style="color:#ef4444">BYTES</span> &amp; <span style="color:#f59e0b">BREW</span></h2><h1>${title}</h1>${payload.toName ? `<p>Hi <strong>${payload.toName}</strong>,</p>` : ""}<p>Welcome to Bytes &amp; Brew Gaming Café.</p>${otp ? `<div style="text-align:center;background:#18181b;border:1px dashed #ef4444;border-radius:14px;padding:24px;font-size:34px;font-weight:900;letter-spacing:8px">${otp}</div>` : ""}<p style="color:#666;font-size:12px">If you did not initiate this request, you can safely disregard this email.</p></td></tr></table></td></tr></table></body></html>`;
}

async function sendViaBrevoApi(payload: BrevoEmailPayload, config: ReturnType<typeof getBrevoConfig>) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", { method: "POST", headers: { accept: "application/json", "content-type": "application/json", "api-key": config.key }, body: JSON.stringify({ sender: { name: config.fromName, email: config.fromEmail }, to: [{ email: payload.to, name: payload.toName || payload.to.split("@")[0] }], subject: payload.subject, htmlContent: generateEmailHtml(payload), textContent: payload.textContent || `Bytes & Brew notification${payload.otpCode ? `: ${payload.otpCode}` : ""}` }) });
  if (!response.ok) throw new Error(`Brevo HTTP API error (${response.status}): ${await response.text()}`);
  return response.json();
}

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "1mb" }));
  app.use(apiSecurityPolicy);
  applyProductionPreload(app);

  app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

  app.get("/api/brevo/status", async (_req, res) => {
    const config = getBrevoConfig(); let smtpVerified = false; let smtpError: string | null = null;
    if (config.isConfigured) { try { const transporter = createBrevoTransporter(); if (transporter) { await Promise.race([transporter.verify(), new Promise((_, reject) => setTimeout(() => reject(new Error("SMTP verification timeout (5s)")), 5000))]); smtpVerified = true; } } catch (err: any) { smtpError = err.message || "Unable to reach Brevo SMTP server"; } }
    res.json({ configured: config.isConfigured, service: "Brevo SMTP (smtp-relay.brevo.com)", host: config.host, port: config.port, user: config.user ? `${config.user.slice(0, 3)}***@${config.user.split("@")[1] || "..."}` : null, hasKey: Boolean(config.key), fromEmail: config.fromEmail || null, fromName: config.fromName, smtpVerified, smtpError, fallbackApiAvailable: Boolean(config.key) });
  });

  app.post("/api/brevo/send", async (req, res) => {
    try {
      const payload = req.body as BrevoEmailPayload;
      if (!payload?.to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.to)) return res.status(400).json({ success: false, error: "Valid recipient email address is required" });
      if (!payload.subject || typeof payload.subject !== "string") return res.status(400).json({ success: false, error: "Subject is required" });
      const config = getBrevoConfig();
      if (!config.isConfigured) return res.status(503).json({ success: false, error: "Brevo is not configured. Set BREVO_SMTP_USER, BREVO_SMTP_KEY and BREVO_FROM_EMAIL." });
      let messageId: string | null = null; let deliveryMethod = "Brevo SMTP Relay";
      try { const transporter = createBrevoTransporter(); if (!transporter) throw new Error("Brevo transporter unavailable"); const info = await transporter.sendMail({ from: `"${config.fromName}" <${config.fromEmail}>`, to: payload.toName ? `"${payload.toName}" <${payload.to}>` : payload.to, subject: payload.subject, text: payload.textContent, html: generateEmailHtml(payload) }); messageId = info.messageId; }
      catch { const result = await sendViaBrevoApi(payload, config); deliveryMethod = "Brevo Transactional API"; messageId = (result as { messageId?: string })?.messageId || "api-dispatched"; }
      res.json({ success: true, recipient: payload.to, deliveryMethod, messageId, timestamp: new Date().toISOString() });
    } catch (err: any) { res.status(500).json({ success: false, error: err.message || "Brevo delivery failed" }); }
  });

  app.post("/api/brevo/test", async (req, res) => {
    const targetEmail = typeof req.body?.testEmail === "string" ? req.body.testEmail : getBrevoConfig().fromEmail;
    if (!targetEmail) return res.status(400).json({ success: false, error: "Provide testEmail or configure BREVO_FROM_EMAIL." });
    try { const config = getBrevoConfig(); if (!config.isConfigured) return res.status(503).json({ success: false, error: "Brevo is not configured." }); const result = await sendViaBrevoApi({ to: targetEmail, subject: "Brevo Integration Test • Bytes & Brew Gaming Café", type: "CUSTOM" }, config); res.json({ success: true, message: `Test email successfully sent to ${targetEmail} via Brevo!`, result }); }
    catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to send test email" }); }
  });

  app.post("/api/env/status", (_req, res) => { const config = getBrevoConfig(); res.json({ geminiConfigured: Boolean(process.env.GEMINI_API_KEY), appUrl: process.env.APP_URL || null, brevoConfigured: config.isConfigured, brevoHost: config.host, brevoPort: config.port, brevoSender: config.fromEmail || null, brevoSenderName: config.fromName }); });

  app.post("/api/ai/concierge", async (req, res) => {
    try { const { prompt, systemInstruction } = req.body || {}; if (!prompt || typeof prompt !== "string") return res.status(400).json({ success: false, error: "Missing or invalid prompt string." }); const ai = getGeminiClient(); let lastError: any = null; for (const model of ["gemini-3.8-flash", "gemini-2.5-flash"]) { try { const response = await ai.models.generateContent({ model, contents: prompt, config: { systemInstruction: systemInstruction || "You are the gaming concierge for Bytes & Brew Gaming Café. Respond concisely and helpfully." } }); if (response.text) return res.json({ success: true, reply: response.text }); } catch (err) { lastError = err; } } throw lastError || new Error("AI provider returned no response"); }
    catch (err: any) { res.status(500).json({ success: false, error: err.message || "Failed to generate AI response" }); }
  });

  if (process.env.NODE_ENV !== "production") { const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" }); app.use(vite.middlewares); }
  else { const distPath = path.join(process.cwd(), "dist"); app.use(express.static(distPath, { maxAge: "1d", etag: true, index: "index.html" })); app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html"))); }

  const server = app.listen(PORT, "0.0.0.0", () => console.log(`Bytes & Brew Server listening on port ${PORT}`));
  const shutdown = async (signal: string) => {
    console.log(`[server] ${signal} received; starting graceful shutdown`);
    server.close(async () => {
      try { await closeMongoDb(); } catch (error) { console.error("[server] MongoDB shutdown error:", error); }
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.on("unhandledRejection", (reason) => console.error("[server] unhandledRejection", reason));
  process.on("uncaughtException", (error) => { console.error("[server] uncaughtException", error); void shutdown("uncaughtException"); });
}
startServer().catch((error) => { console.error("[server] startup failed", error); process.exit(1); });
