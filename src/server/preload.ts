import express from "express";
import { apiSecurityPolicy } from "./security.js";
import { registerAuthRoutes } from "./authRoutes.js";
import { ensureAuthIndexes } from "./auth.js";
import { getMongoDb } from "./mongodb.js";
import { handleProductionGetStations, handleProductionAvailability, handleProductionCreateBooking } from "../services/productionBookingHandlers.js";
import { handleProductionCheckInBooking, handleProductionCancelBooking, handleProductionExtendSession, handleProductionEndSession, handleProductionMyActiveSession } from "../services/productionSessionHandlers.js";
import { handleProductionCreatePaymentOrder, handleProductionVerifyPayment, handleProductionPaymentWebhook } from "../services/productionPaymentHandlers.js";
import { handleProductionCreateInvoice, handleProductionWalletBalance, handleProductionWalletCredit, handleProductionRequestRefund } from "../services/productionBillingHandlers.js";
import { employeeDashboard, getShift, startShift, endShift, cashLedger, addCashLedger, walkIn, checkIn, extendSession, transferSession, endSession, waitlist, addWaitlist, assignWaitlist, removeWaitlist, maintenance, reportMaintenance, updateMaintenance, alerts, resolveAlert, activity, refunds, requestRefund, processRefund, customers, createCustomer, fnbOrder } from "../services/productionEmployeeHandlers.js";
import { registerAdminRoutes } from "../services/productionAdminHandlers.js";

const originalJson = (express as any).json;
(express as any).json = function (options: any = {}) {
  const callerVerify = options.verify;
  return originalJson({ ...options, verify: (req: any, res: any, buf: Buffer, encoding: string) => { req.rawBody = Buffer.from(buf); if (typeof callerVerify === "function") callerVerify(req, res, buf, encoding); } });
};

const methods = ["get", "post", "put", "patch", "delete"] as const;
const productionOverrides: Record<string, any> = {
  "GET /api/stations": handleProductionGetStations,
  "GET /api/stations/:id/availability": handleProductionAvailability,
  "POST /api/bookings": handleProductionCreateBooking,
  "POST /api/bookings/:id/check-in": handleProductionCheckInBooking,
  "POST /api/bookings/:id/cancel": handleProductionCancelBooking,
  "POST /api/sessions/:id/extend": handleProductionExtendSession,
  "POST /api/sessions/:id/end": handleProductionEndSession,
  "GET /api/sessions/me": handleProductionMyActiveSession,
  "POST /api/payments/create-order": handleProductionCreatePaymentOrder,
  "POST /api/payments/verify": handleProductionVerifyPayment,
  "POST /api/payments/webhook": handleProductionPaymentWebhook,
  "POST /api/invoices": handleProductionCreateInvoice,
  "GET /api/wallet/balance": handleProductionWalletBalance,
  "POST /api/wallet/credit": handleProductionWalletCredit,
  "POST /api/refunds": handleProductionRequestRefund,
  "GET /api/employee/dashboard": employeeDashboard,
  "GET /api/employee/shift": getShift,
  "POST /api/employee/shift/start": startShift,
  "POST /api/employee/shift/end": endShift,
  "GET /api/employee/cash-ledger": cashLedger,
  "POST /api/employee/cash-ledger/entry": addCashLedger,
  "POST /api/employee/walk-in": walkIn,
  "POST /api/employee/bookings/check-in": checkIn,
  "POST /api/employee/sessions/:sessionId/extend": extendSession,
  "POST /api/employee/sessions/:sessionId/transfer": transferSession,
  "POST /api/employee/sessions/:sessionId/end": endSession,
  "GET /api/employee/waitlist": waitlist,
  "POST /api/employee/waitlist/add": addWaitlist,
  "POST /api/employee/waitlist/:waitlistId/assign": assignWaitlist,
  "DELETE /api/employee/waitlist/:waitlistId": removeWaitlist,
  "GET /api/employee/maintenance": maintenance,
  "POST /api/employee/maintenance/report": reportMaintenance,
  "POST /api/employee/maintenance/:ticketId/status": updateMaintenance,
  "GET /api/employee/alerts": alerts,
  "POST /api/employee/alerts/:alertId/resolve": resolveAlert,
  "GET /api/employee/activity": activity,
  "GET /api/employee/refunds": refunds,
  "POST /api/employee/refunds/request": requestRefund,
  "POST /api/employee/refunds/:refundId/action": processRefund,
  "GET /api/employee/customers": customers,
  "POST /api/employee/customers": createCustomer,
  "POST /api/employee/fnb/order": fnbOrder,
};

for (const method of methods) {
  const original = (express.application as any)[method];
  if (typeof original !== "function") continue;
  (express.application as any)[method] = function (path: any, ...handlers: any[]) {
    if (typeof path === "string" && path.startsWith("/api/") && !path.startsWith("/api/auth/")) {
      const override = productionOverrides[`${method.toUpperCase()} ${path}`];
      if (override) return original.call(this, path, apiSecurityPolicy, override);
      return original.call(this, path, apiSecurityPolicy, ...handlers);
    }
    return original.call(this, path, ...handlers);
  };
}

const originalListen = (express.application as any).listen;
(express.application as any).listen = function (...args: any[]) {
  registerAuthRoutes(this);
  registerAdminRoutes(this);
  this.get("/api/ready", async (_req: any, res: any) => {
    try { const db = await getMongoDb(); await db.command({ ping: 1 }); return res.json({ status: "ready", timestamp: new Date().toISOString(), dependencies: { mongodb: "ok" } }); }
    catch { return res.status(503).json({ status: "not_ready", timestamp: new Date().toISOString(), dependencies: { mongodb: "unavailable" } }); }
  });
  void ensureAuthIndexes().catch((error) => console.error("Authentication index bootstrap failed:", error));
  return originalListen.apply(this, args);
};
