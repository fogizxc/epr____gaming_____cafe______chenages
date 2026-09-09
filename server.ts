import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { GoogleGenAI } from "@google/genai";
import { apiSecurityPolicy } from "./src/server/security.js";
import { applyProductionPreload } from "./src/server/preload.js";

dotenv.config();

const PORT = Number(process.env.PORT || 3000);

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

interface BrevoEmailPayload {
  to: string;
  toName?: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  type?: "OTP_VERIFICATION" | "PASSWORD_RESET" | "BOOKING_CONFIRMATION" | "CUSTOM";
  otpCode?: string;
}

function getBrevoConfig() {
  const host = (process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com").trim();
  const port = Number(process.env.BREVO_SMTP_PORT || 587);
  const user = (process.env.BREVO_SMTP_USER || process.env.BREVO_USER || "").trim();
  const key = (process.env.BREVO_SMTP_KEY || process.env.BREVO_API_KEY || process.env.BREVO_PASSWORD || "").trim();
  const fromEmail = (process.env.BREVO_FROM_EMAIL || "").trim();
  const fromName = (process.env.BREVO_FROM_NAME || "Bytes & Brew Gaming Café").trim();
  return { host, port, user, key, fromEmail, fromName, isConfigured: Boolean(user && key && fromEmail) };
}

function createBrevoTransporter() {
  const config = getBrevoConfig();
  if (!config.isConfigured) return null;
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.key },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 15000,
  });
}

function generateEmailHtml(payload: BrevoEmailPayload): string {
  if (payload.htmlContent) return payload.htmlContent;
  const otp = payload.otpCode || "";
  const title = payload.type === "PASSWORD_RESET"
    ? "Password Recovery Verification"
    : payload.type === "BOOKING_CONFIRMATION"
      ? "Station Booking Confirmation"
      : "Gaming Arena Verification Code";
  return `<!DOCTYPE html><html><body style="margin:0;background:#080808;color:#fff;font-family:Arial,sans-serif;padding:40px 10px"><div style="max-width:580px;margin:auto;background:#111;border:1px solid #222;border-radius:20px;padding:36px"><h2><span style="color:#ef4444">BYTES</span> &amp; <span style="color:#f59e0b">BREW</span></h2><h1 style="font-size:20px">${title}</h1>${payload.toName ? `<p>Hi <strong>${payload.toName}</strong>,</p>` : ""}<p style="color:#aaa">Welcome to Bytes &amp; Brew Gaming Café. Use the authorized code below if one was requested.</p>${otp ? `<div style="text-align:center;background:#18181b;border:1px dashed #ef4444;border-radius:14px;padding:24px"><div style="color:#ef4444;font-size:11px;letter-spacing:2px">ONE-TIME PASSCODE</div><div style="font-size:34px;font-weight:900;letter-spacing:8px;margin-top:8px">${otp}</div></div>` : ""}<p style="color:#666;font-size:12px;margin-top:28px">If you did not initiate this request, you can safely disregard this email.</p></div></body></html>`;
}

async function sendViaBrevoApi(payload: BrevoEmailPayload, config: ReturnType<typeof getBrevoConfig>) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json", "api-key": config.key },
    body: JSON.stringify({
      sender: { name: config.fromName, email: config.fromEmail },
      to: [{ email: payload.to, name: payload.toName || payload.to.split("@")[0] }],
      subject: payload.subject,
      htmlContent: generateEmailHtml(payload),
      textContent: payload.textContent || `Bytes & Brew notification${payload.otpCode ? `: ${payload.otpCode}` : ""}`,
    }),
  });
  if (!response.ok) throw new Error(`Brevo HTTP API error (${response.status}): ${await response.text()}`);
  return response.json();
}

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(apiSecurityPolicy);
  applyProductionPreload(app);

  app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

  app.get("/api/brevo/status", async (_req, res) => {
    const config = getBrevoConfig();
    let smtpVerified = false;
    let smtpError: string | null = null;
    if (config.isConfigured) {
      try {
        const transporter = createBrevoTransporter();
        if (transporter) {
          await Promise.race([transporter.verify(), new Promise((_, reject) => setTimeout(() => reject(new Error("SMTP verification timeout")), 5000))]);
          smtpVerified = true;
        }
      } catch (err) { smtpError = err instanceof Error ? err.message : "SMTP verification failed"; }
    }
    res.json({ configured: config.isConfigured, service: "Brevo SMTP", host: config.host, port: config.port, hasKey: Boolean(config.key), fromEmail: config.fromEmail || null, fromName: config.fromName, smtpVerified, smtpError });
  });

  app.post("/api/brevo/send", async (req, res) => {
    try {
      const payload = req.body as BrevoEmailPayload;
      if (!payload?.to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.to)) return res.status(400).json({ success: false, error: "Valid recipient email is required" });
      if (!payload.subject || typeof payload.subject !== "string") return res.status(400).json({ success: false, error: "Subject is required" });
      const config = getBrevoConfig();
      if (!config.isConfigured) return res.status(503).json({ success: false, error: "Brevo is not configured. Set BREVO_SMTP_USER, BREVO_SMTP_KEY and BREVO_FROM_EMAIL." });
      let messageId: string | null = null;
      let deliveryMethod = "Brevo SMTP Relay";
      try {
        const transporter = createBrevoTransporter();
        if (!transporter) throw new Error("Brevo transporter unavailable");
        const info = await transporter.sendMail({ from: `\"${config.fromName}\" <${config.fromEmail}>`, to: payload.toName ? `\"${payload.toName}\" <${payload.to}>` : payload.to, subject: payload.subject, text: payload.textContent, html: generateEmailHtml(payload) });
        messageId = info.messageId;
      } catch {
        const result = await sendViaBrevoApi(payload, config);
        deliveryMethod = "Brevo Transactional API";
        messageId = (result as { messageId?: string })?.messageId || "api-dispatched";
      }
      res.json({ success: true, recipient: payload.to, deliveryMethod, messageId, timestamp: new Date().toISOString() });
    } catch (err) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Brevo delivery failed" }); }
  });

  app.post("/api/brevo/test", async (req, res) => {
    const targetEmail = typeof req.body?.testEmail === "string" ? req.body.testEmail : getBrevoConfig().fromEmail;
    if (!targetEmail) return res.status(400).json({ success: false, error: "Provide testEmail or configure BREVO_FROM_EMAIL." });
    try {
      const config = getBrevoConfig();
      if (!config.isConfigured) return res.status(503).json({ success: false, error: "Brevo is not configured." });
      const result = await sendViaBrevoApi({ to: targetEmail, subject: "Brevo Integration Test • Bytes & Brew Gaming Café", type: "CUSTOM" }, config);
      res.json({ success: true, message: `Test email sent to ${targetEmail}`, result });
    } catch (err) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Brevo test failed" }); }
  });

  app.post("/api/ai/concierge", async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body || {};
      if (!prompt || typeof prompt !== "string") return res.status(400).json({ success: false, error: "Missing prompt" });
      const ai = getGeminiClient();
      for (const model of ["gemini-3.8-flash", "gemini-2.5-flash"]) {
        try {
          const response = await ai.models.generateContent({ model, contents: prompt, config: { systemInstruction: systemInstruction || "You are the gaming concierge for Bytes & Brew Gaming Café. Respond concisely and helpfully." } });
          if (response.text) return res.json({ success: true, reply: response.text });
        } catch { /* try next supported model */ }
      }
      res.status(502).json({ success: false, error: "AI provider returned no response" });
    } catch (err) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : "AI request failed" }); }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Bytes & Brew server listening on port ${PORT}`));
}

startServer();
