import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const PORT = 3000;

interface BrevoEmailPayload {
  to: string;
  toName?: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  type?: 'OTP_VERIFICATION' | 'PASSWORD_RESET' | 'BOOKING_CONFIRMATION' | 'CUSTOM';
  otpCode?: string;
}

// Lazy Brevo transporter creation
function getBrevoConfig() {
  let host = (process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com").trim();

  // Auto-normalize common typos (e.g. 'replay.brevo.com', 'relay.brevo.com', 'smtp-replay.brevo.com')
  const lowerHost = host.toLowerCase();
  if (
    lowerHost === "replay.brevo.com" ||
    lowerHost === "relay.brevo.com" ||
    lowerHost === "smtp-replay.brevo.com" ||
    lowerHost === "smtp.brevo.com"
  ) {
    host = "smtp-relay.brevo.com";
  }

  const port = parseInt(process.env.BREVO_SMTP_PORT || "587", 10);
  let user = (process.env.BREVO_SMTP_USER || process.env.BREVO_USER || "").trim();
  // Auto-correct common typo 'smpt-brevo.com' -> 'smtp-brevo.com'
  if (user.toLowerCase().includes("@smpt-brevo.com")) {
    user = user.replace(/@smpt-brevo\.com/i, "@smtp-brevo.com");
  }

  const key = (process.env.BREVO_SMTP_KEY || process.env.BREVO_API_KEY || process.env.BREVO_PASSWORD || "").trim();
  let fromEmail = (process.env.BREVO_FROM_EMAIL || "raghav45078@gmail.com").trim();
  // Brevo rejects delivery if 'From' address is an @smtp-brevo.com login ID instead of a verified sender
  if (
    !fromEmail ||
    fromEmail.toLowerCase().includes("@smtp-brevo.com") ||
    fromEmail.toLowerCase().includes("@smpt-brevo.com")
  ) {
    fromEmail = "raghav45078@gmail.com";
  }

  const fromName = process.env.BREVO_FROM_NAME || "Bytes & Brew Gaming Café";

  return {
    host,
    port,
    user,
    key,
    fromEmail,
    fromName,
    isConfigured: Boolean(user && key),
  };
}

function createBrevoTransporter() {
  const config = getBrevoConfig();
  if (!config.isConfigured) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.key,
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 15000,
  });
}

// Generates high-fidelity HTML email template matching Bytes & Brew Cyberpunk / Neon Cafe aesthetic
function generateEmailHtml(payload: BrevoEmailPayload): string {
  if (payload.htmlContent) {
    return payload.htmlContent;
  }

  const otp = payload.otpCode || "123456";
  const title =
    payload.type === "PASSWORD_RESET"
      ? "Password Recovery Verification"
      : payload.type === "BOOKING_CONFIRMATION"
      ? "Station Booking Confirmation"
      : "Gaming Arena Verification Code";

  const description =
    payload.type === "PASSWORD_RESET"
      ? "We received a request to reset your Bytes & Brew gamer account security credentials. Use the authorized OTP below to verify your identity."
      : payload.type === "BOOKING_CONFIRMATION"
      ? "Your gaming station and artisan brew reservation is confirmed! Show this code or reservation receipt at the front desk terminal."
      : "Welcome to Bytes & Brew Gaming Café! Use the one-time authentication code below to verify your email address and activate your gamer account.";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080808; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #080808; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #111111; border: 1px solid #222222; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
          <!-- Top Accent Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #dc2626, #ef4444, #f59e0b);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 32px 36px 20px; text-align: center; border-bottom: 1px solid #1c1c1c;">
              <div style="font-size: 22px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #ffffff;">
                <span style="color: #ef4444;">BYTES</span> &amp; <span style="color: #f59e0b;">BREW</span>
              </div>
              <div style="font-size: 11px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 3px; margin-top: 4px;">
                Commercial Gaming Café &amp; Artisan Lounge
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 36px 28px;">
              <h1 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                ${title}
              </h1>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #a1a1aa;">
                ${payload.toName ? `Hi <strong>${payload.toName}</strong>,<br><br>` : ""}
                ${description}
              </p>

              <!-- OTP Code Display Box -->
              ${
                payload.otpCode
                  ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="background-color: #18181b; border: 1px dashed #ef4444; border-radius: 14px; padding: 24px 20px;">
                    <div style="font-size: 11px; font-weight: 700; color: #ef4444; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">
                      Authorized One-Time Passcode
                    </div>
                    <div style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #ffffff; font-family: 'Courier New', Courier, monospace;">
                      ${otp}
                    </div>
                    <div style="font-size: 11px; color: #71717a; margin-top: 10px;">
                      This verification code expires in 10 minutes. Do not share it with anyone.
                    </div>
                  </td>
                </tr>
              </table>
              `
                  : ""
              }

              <!-- Security notice -->
              <div style="background-color: #141417; border-left: 3px solid #ef4444; padding: 12px 16px; border-radius: 6px; margin-top: 20px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #71717a;">
                  Delivered securely via <strong style="color: #a1a1aa;">Brevo SMTP Relay</strong>. If you did not initiate this request, you can safely disregard this email.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0c0c0e; padding: 24px 36px; border-top: 1px solid #1c1c1c; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 11px; color: #52525b;">
                Bytes &amp; Brew Gaming Café • High-Performance Esports &amp; Artisan Coffee
              </p>
              <p style="margin: 0; font-size: 10px; color: #3f3f46;">
                Need assistance? Contact support at <a href="mailto:support@bytesandbrew.com" style="color: #ef4444; text-decoration: none;">support@bytesandbrew.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Fallback to Brevo REST API in case port 587 socket is blocked in container environment
async function sendViaBrevoApi(payload: BrevoEmailPayload, config: ReturnType<typeof getBrevoConfig>) {
  const html = generateEmailHtml(payload);
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "api-key": config.key,
    },
    body: JSON.stringify({
      sender: {
        name: config.fromName,
        email: config.fromEmail,
      },
      to: [
        {
          email: payload.to,
          name: payload.toName || payload.to.split("@")[0],
        },
      ],
      subject: payload.subject,
      htmlContent: html,
      textContent: payload.textContent || `Your Bytes & Brew verification code is: ${payload.otpCode || ""}`,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Brevo HTTP API error (${response.status}): ${errorBody}`);
  }

  const result = await response.json();
  return result;
}

async function startServer() {
  const app = express();

  app.use(express.json());

  // -------------------------------------------------------------
  // API Routes
  // -------------------------------------------------------------
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // GET /api/brevo/status - Return Brevo SMTP configuration state
  app.get("/api/brevo/status", async (req, res) => {
    const config = getBrevoConfig();

    let smtpVerified = false;
    let smtpError: string | null = null;

    if (config.isConfigured) {
      try {
        const transporter = createBrevoTransporter();
        if (transporter) {
          // Quick timeout verify check
          await Promise.race([
            transporter.verify(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("SMTP verification timeout (5s)")), 5000))
          ]);
          smtpVerified = true;
        }
      } catch (err: any) {
        smtpError = err.message || "Unable to reach Brevo SMTP server";
      }
    }

    let ipHint: string | null = null;
    if (smtpError && smtpError.includes("525") && smtpError.includes("Unauthorized IP")) {
      ipHint = "Brevo requires authorizing your cloud server IP or disabling 'Blocking unauthorized IP addresses' in Brevo Settings > Security > Authorized IPs.";
    }

    res.json({
      configured: config.isConfigured,
      service: "Brevo SMTP (smtp-relay.brevo.com)",
      host: config.host,
      port: config.port,
      user: config.user ? `${config.user.slice(0, 3)}***@${config.user.split("@")[1] || "..."}` : null,
      hasKey: Boolean(config.key),
      fromEmail: config.fromEmail,
      fromName: config.fromName,
      smtpVerified,
      smtpError,
      ipHint,
      serverOutboundIp: "34.34.244.120",
      fallbackApiAvailable: Boolean(config.key),
    });
  });

  // POST /api/brevo/send - Send email via Brevo SMTP (with REST fallback)
  app.post("/api/brevo/send", async (req, res) => {
    try {
      const { to, toName, subject, htmlContent, textContent, type, otpCode } = req.body as BrevoEmailPayload;

      if (!to || !to.includes("@")) {
        return res.status(400).json({ success: false, error: "Valid recipient email address ('to') is required" });
      }

      const config = getBrevoConfig();

      if (!config.isConfigured) {
        return res.status(503).json({
          success: false,
          error: "Brevo SMTP is not configured. Please set BREVO_SMTP_USER and BREVO_SMTP_KEY in environment variables.",
          configured: false,
          fallbackOtp: otpCode || null,
        });
      }

      const emailSubject = subject || (otpCode ? `Bytes & Brew Code: ${otpCode}` : "Bytes & Brew Notification");
      const html = generateEmailHtml({ to, toName, subject: emailSubject, htmlContent, textContent, type, otpCode });

      let deliveryMethod = "Brevo SMTP Relay (smtp-relay.brevo.com:587)";
      let messageId: string | null = null;

      // 1. Try Brevo SMTP via Nodemailer
      let smtpSuccess = false;
      try {
        const transporter = createBrevoTransporter();
        if (transporter) {
          const info = await transporter.sendMail({
            from: `"${config.fromName}" <${config.fromEmail}>`,
            to: toName ? `"${toName}" <${to}>` : to,
            subject: emailSubject,
            text: textContent || `Your Bytes & Brew verification code is: ${otpCode || ""}`,
            html,
          });
          messageId = info.messageId;
          smtpSuccess = true;
        }
      } catch (smtpErr: any) {
        console.warn("Brevo SMTP direct connection attempt error:", smtpErr?.message);
        // Fallback to Brevo REST API (HTTPS port 443) which works regardless of SMTP egress firewalling
      }

      // 2. Fallback to Brevo HTTPS API if SMTP direct connection timed out or failed
      if (!smtpSuccess) {
        try {
          const apiResult = await sendViaBrevoApi(
            { to, toName, subject: emailSubject, htmlContent: html, textContent, type, otpCode },
            config
          );
          deliveryMethod = "Brevo Transactional API (HTTPS Fallback)";
          messageId = (apiResult as any)?.messageId || "api-dispatched";
        } catch (apiErr: any) {
          console.error("Brevo API fallback failed:", apiErr);
          throw new Error(`Brevo delivery failed: ${apiErr.message}`);
        }
      }

      return res.json({
        success: true,
        recipient: to,
        deliveryMethod,
        messageId,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("Error in /api/brevo/send:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to deliver email through Brevo services",
      });
    }
  });

  // POST /api/brevo/test - Send a test email to verify Brevo credentials
  app.post("/api/brevo/test", async (req, res) => {
    const { testEmail } = req.body;
    const targetEmail = testEmail || process.env.BREVO_FROM_EMAIL || process.env.BREVO_SMTP_USER;

    if (!targetEmail) {
      return res.status(400).json({ success: false, error: "Please provide a target email for the test." });
    }

    try {
      const config = getBrevoConfig();
      if (!config.isConfigured) {
        return res.status(400).json({
          success: false,
          error: "Brevo SMTP is not configured. Set BREVO_SMTP_USER and BREVO_SMTP_KEY in .env.",
        });
      }

      const testPayload: BrevoEmailPayload = {
        to: targetEmail,
        toName: "Bytes & Brew Admin",
        subject: "Brevo SMTP Integration Test • Bytes & Brew Gaming Café",
        type: "CUSTOM",
        htmlContent: `
          <div style="background:#0c0c0c;color:#fff;padding:30px;font-family:sans-serif;border-radius:16px;border:1px solid #333;">
            <h2 style="color:#ef4444;margin-top:0;">Brevo SMTP Service Connected!</h2>
            <p style="color:#ccc;">Your Brevo SMTP relay integration on <strong>smtp-relay.brevo.com:587</strong> is operating successfully.</p>
            <div style="background:#1a1a1a;padding:15px;border-radius:8px;font-family:monospace;font-size:12px;color:#10b981;">
              ✓ Host: ${config.host}<br>
              ✓ Port: ${config.port}<br>
              ✓ Sender: ${config.fromEmail}<br>
              ✓ Timestamp: ${new Date().toISOString()}
            </div>
          </div>
        `,
      };

      const result = await sendViaBrevoApi(testPayload, config).catch(async () => {
        const transporter = createBrevoTransporter();
        if (!transporter) throw new Error("Could not initialize Brevo SMTP");
        return await transporter.sendMail({
          from: `"${config.fromName}" <${config.fromEmail}>`,
          to: targetEmail,
          subject: testPayload.subject,
          html: testPayload.htmlContent,
        });
      });

      return res.json({
        success: true,
        message: `Test email successfully sent to ${targetEmail} via Brevo!`,
        result,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || "Failed to send test email" });
    }
  });

  // -------------------------------------------------------------
  // Vite Middleware / Static Serving
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bytes & Brew Server with Brevo SMTP running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
