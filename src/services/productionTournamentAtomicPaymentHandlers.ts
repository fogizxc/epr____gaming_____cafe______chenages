import crypto from "node:crypto";
import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../server/auth.js";
import { getMongoDb, getMongoClient } from "../server/mongodb.js";
import { recordFinancialTransaction } from "./financialLedger.js";

const BASE = "https://api.razorpay.com/v1";
const ENTRY_FEE_PAISE = 400000;

const fail = (res: Response, status: number, error: string) => res.status(status).json({ success: false, error });
const env = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name}_NOT_CONFIGURED`);
  return value;
};
const user = (req: Request) => (req as AuthenticatedRequest).user;
const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

async function razor(path: string) {
  const auth = Buffer.from(`${env("RAZORPAY_KEY_ID")}:${env("RAZORPAY_KEY_SECRET")}`).toString("base64");
  const response = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("RAZORPAY_REQUEST_FAILED");
  return body as any;
}

export async function handleAtomicTournamentPaymentVerify(req: Request, res: Response) {
  const customer = user(req);
  if (!customer) return fail(res, 401, "Authentication required");

  const teamId = String(req.body?.teamId || "").trim();
  const orderId = String(req.body?.razorpay_order_id || "").trim();
  const providerPaymentId = String(req.body?.razorpay_payment_id || "").trim();
  const signature = String(req.body?.razorpay_signature || "").trim();
  if (!teamId || !orderId || !providerPaymentId || !signature) {
    return fail(res, 400, "Payment verification fields are required");
  }

  try {
    const expected = crypto.createHmac("sha256", env("RAZORPAY_KEY_SECRET"))
      .update(`${orderId}|${providerPaymentId}`)
      .digest("hex");
    if (!safeEqual(expected, signature)) return fail(res, 400, "Invalid payment signature");

    const provider = await razor(`/payments/${encodeURIComponent(providerPaymentId)}`);
    if (provider.order_id !== orderId || provider.currency !== "INR" || Number(provider.amount) !== ENTRY_FEE_PAISE) {
      return fail(res, 400, "Payment amount or order mismatch");
    }
    if (provider.status !== "captured") return fail(res, 409, "Payment has not been captured");

    const db = await getMongoDb();
    const client = getMongoClient();
    if (!client) throw new Error("MONGO_TX_UNAVAILABLE");

    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const payment = await db.collection("payments").findOne(
          { customerId: customer.id, tournamentTeamId: teamId, providerOrderId: orderId },
          { session },
        );
        if (!payment) throw new Error("TOURNAMENT_PAYMENT_NOT_FOUND");
        if (Number(payment.amountPaise) !== ENTRY_FEE_PAISE || payment.currency !== "INR") {
          throw new Error("TOURNAMENT_PAYMENT_AMOUNT_MISMATCH");
        }

        const team = await db.collection("tournament_teams").findOne(
          { id: teamId, captainId: customer.id },
          { session },
        );
        if (!team) throw new Error("TOURNAMENT_TEAM_NOT_FOUND");

        const now = new Date();
        if (payment.status !== "CAPTURED") {
          await db.collection("payments").updateOne(
            { _id: payment._id },
            { $set: {
              status: "CAPTURED",
              providerPaymentId,
              providerStatus: "captured",
              capturedAt: payment.capturedAt || now,
              updatedAt: now,
            } },
            { session },
          );
        } else if (payment.providerPaymentId && payment.providerPaymentId !== providerPaymentId) {
          throw new Error("PAYMENT_PROVIDER_ID_MISMATCH");
        } else if (!payment.providerPaymentId) {
          await db.collection("payments").updateOne(
            { _id: payment._id },
            { $set: { providerPaymentId, providerStatus: "captured", updatedAt: now } },
            { session },
          );
        }

        if (team.paymentStatus !== "PAID" || team.status !== "REGISTERED") {
          await db.collection("tournament_teams").updateOne(
            { _id: team._id },
            { $set: {
              paymentStatus: "PAID",
              status: "REGISTERED",
              paidAt: team.paidAt || now,
              paymentId: payment.id,
              updatedAt: now,
            } },
            { session },
          );
        }

        await recordFinancialTransaction({
          id: `SALE:TOURNAMENT:${team.id}`,
          type: "SALE",
          source: "TOURNAMENT",
          sourceId: team.id,
          customerId: customer.id,
          paymentId: payment.id,
          amountPaise: ENTRY_FEE_PAISE,
          currency: "INR",
          occurredAt: payment.capturedAt || now,
          createdAt: now,
          metadata: {
            tournamentId: team.tournamentId,
            teamId: team.id,
            provider: "RAZORPAY",
            providerPaymentId,
          },
        }, { db, session });
      });
    } finally {
      await session.endSession();
    }

    const [team, payment] = await Promise.all([
      db.collection("tournament_teams").findOne({ id: teamId }),
      db.collection("payments").findOne({ customerId: customer.id, tournamentTeamId: teamId, providerOrderId: orderId }),
    ]);
    return res.json({ success: true, data: { team, payment } });
  } catch (error: any) {
    if (error?.message?.endsWith("_NOT_CONFIGURED")) return fail(res, 503, "Payment provider is not configured");
    if (["TOURNAMENT_PAYMENT_NOT_FOUND", "TOURNAMENT_TEAM_NOT_FOUND"].includes(error?.message)) return fail(res, 404, "Tournament payment or team not found");
    if (["TOURNAMENT_PAYMENT_AMOUNT_MISMATCH", "PAYMENT_PROVIDER_ID_MISMATCH"].includes(error?.message)) return fail(res, 409, "Tournament payment state is inconsistent");
    return fail(res, 502, "Unable to finalize tournament payment");
  }
}
