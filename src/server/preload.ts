import type express from "express";
import { apiSecurityPolicy } from "./security.js";
import { registerAuthRoutes } from "./authRoutes.js";
import { registerPasswordResetRoutes, ensurePasswordResetIndexes } from "./passwordResetRoutes.js";
import { ensureAuthIndexes } from "./auth.js";
import { ensureLoginGuardIndexes } from "./loginGuard.js";
import { getMongoDb } from "./mongodb.js";
import { startSessionLifecycle } from "./sessionLifecycle.js";
import { startFnbLifecycle } from "./fnbLifecycle.js";
import { handleProductionGetStations, handleProductionAvailability, handleProductionCreateBooking } from "../services/productionBookingHandlers.js";
import { handleProductionAvailabilitySummary } from "../services/productionAvailabilitySummary.js";
import { handleProductionRescheduleBooking } from "../services/productionRescheduleHandler.js";
import { handleProductionCustomerBookings } from "../services/productionCustomerBookingsHandler.js";
import { handleProductionCheckInBooking, handleProductionCancelBooking, handleProductionExtendSession, handleProductionEndSession, handleProductionMyActiveSession } from "../services/productionSessionHandlers.js";
import { handleIssueBookingQr, handleEmployeeQrCheckIn, ensureQrCheckInIndexes } from "../services/productionQrCheckInHandlers.js";
import { handleProductionCreatePaymentOrder, handleProductionVerifyPayment } from "../services/productionPaymentHandlers.js";
import { handleProductionCreateInvoice, handleProductionWalletBalance, handleProductionWalletCredit, handleProductionWalletDebit, handleProductionRequestRefund } from "../services/productionBillingHandlers.js";
import { handleInvoicePdf } from "../services/productionInvoicePdfHandlers.js";
import { handleAdminProcessRefund, handleAdminCreditNote } from "../services/productionRefundHandlers.js";
import { handleAdminReconcileRefund } from "../services/productionRefundReconciliation.js";
import { employeeDashboard, getShift, startShift, endShift, cashLedger, addCashLedger, checkIn, extendSession, transferSession, waitlist, addWaitlist, assignWaitlist, removeWaitlist, maintenance, reportMaintenance, updateMaintenance, alerts, resolveAlert, activity, refunds, requestRefund, processRefund, customers, createCustomer } from "../services/productionEmployeeHandlers.js";
import { handleEmployeeWalkInFinancial, handleEmployeeFnbFinancial, handleEmployeeEndSessionFinancial } from "../services/productionEmployeeFinancialHandlers.js";
import { registerAdminRoutes } from "../services/productionAdminHandlers.js";
import { handleMembershipMe, handlePurchaseMembership, handleConsumeMembershipHours } from "../services/productionMembershipHandlers.js";
import { handleCreateMembershipPaymentOrder } from "../services/productionMembershipPaymentHandlers.js";
import { handleAtomicVerifyMembershipPayment, handleAtomicMembershipWebhook } from "../services/productionMembershipAtomicPaymentHandlers.js";
import { handleFnbProducts, handleFnbOrderStatus } from "../services/productionFnbHandlers.js";
import { handleProductionCustomerFnbOrder, handleFnbPaymentOrder, handleFnbPaymentVerify, handleFnbCustomerRefund, handleAdminFnbRefund, handleAdminFnbCreditNote } from "../services/productionFnbFinancialHandlers.js";
import { handleAdminFinancialSummary, handleAdminFinancialLedger, handleAdminReconciliation, handleAdminFinancialExport } from "../services/productionFinancialHandlers.js";
import { handleTournamentList, handleTournamentDetail, handleTournamentRegister, handleTournamentPaymentOrder, handleAdminTournamentCreate, handleAdminTournamentUpdate, handleAdminTournamentTeams } from "../services/productionTournamentHandlers.js";
import { handleAtomicTournamentPaymentVerify } from "../services/productionTournamentAtomicPaymentHandlers.js";
import { handleTournamentFormResponse } from "../services/productionTournamentFormHandlers.js";
import { handleGoogleSheetsSync, handleAdminGameSyncPreview, handleGoogleSheetsPull, handleGoogleSheetsStatus } from "../services/productionGameSheetsHandlers.js";
import { handleProductionRazorpayPaymentWebhook, handleProductionRazorpayMembershipWebhook, handleProductionRazorpayFnbWebhook, handleProductionRazorpayTournamentWebhook } from "../services/productionRazorpayWebhookGateway.js";

const productionOverrides: Record<string, express.RequestHandler> = {
  "GET /api/stations": handleProductionGetStations,
  "GET /api/stations/:id/availability": handleProductionAvailability,
  "GET /api/stations/:id/availability-summary": handleProductionAvailabilitySummary,
  "POST /api/bookings": handleProductionCreateBooking,
  "GET /api/bookings/me": handleProductionCustomerBookings,
  "POST /api/bookings/:id/check-in": handleProductionCheckInBooking,
  "POST /api/bookings/:id/qr": handleIssueBookingQr,
  "POST /api/bookings/:id/cancel": handleProductionCancelBooking,
  "POST /api/bookings/:id/reschedule": handleProductionRescheduleBooking,
  "POST /api/sessions/:id/extend": handleProductionExtendSession,
  "POST /api/sessions/:id/end": handleProductionEndSession,
  "GET /api/sessions/me": handleProductionMyActiveSession,
  "POST /api/payments/create-order": handleProductionCreatePaymentOrder,
  "POST /api/payments/verify": handleProductionVerifyPayment,
  "POST /api/payments/webhook": handleProductionRazorpayPaymentWebhook,
  "POST /api/invoices": handleProductionCreateInvoice,
  "GET /api/invoices/:id/pdf": handleInvoicePdf,
  "GET /api/wallet/balance": handleProductionWalletBalance,
  "POST /api/wallet/credit": handleProductionWalletCredit,
  "POST /api/wallet/debit": handleProductionWalletDebit,
  "POST /api/refunds": handleProductionRequestRefund,
  "GET /api/membership": handleMembershipMe,
  "GET /api/membership/me": handleMembershipMe,
  "POST /api/membership/purchase": handlePurchaseMembership,
  "POST /api/membership/consume": handleConsumeMembershipHours,
  "POST /api/membership/payment-order": handleCreateMembershipPaymentOrder,
  "POST /api/membership/payment-verify": handleAtomicVerifyMembershipPayment,
  "POST /api/membership/payment-webhook": handleAtomicMembershipWebhook,
  "GET /api/fnb/products": handleFnbProducts,
  "GET /api/fnb/menu": handleFnbProducts,
  "POST /api/fnb/orders": handleProductionCustomerFnbOrder,
  "POST /api/fnb/order": handleProductionCustomerFnbOrder,
  "POST /api/fnb/orders/:id/status": handleFnbOrderStatus,
  "PATCH /api/fnb/orders/:id/status": handleFnbOrderStatus,
  "POST /api/fnb/payment-order": handleFnbPaymentOrder,
  "POST /api/fnb/payment-verify": handleFnbPaymentVerify,
  "POST /api/fnb/payment-webhook": handleProductionRazorpayFnbWebhook,
  "POST /api/fnb/refunds": handleFnbCustomerRefund,
  "GET /api/financial/summary": handleAdminFinancialSummary,
  "GET /api/financial/ledger": handleAdminFinancialLedger,
  "GET /api/financial/reconciliation": handleAdminReconciliation,
  "GET /api/financial/export": handleAdminFinancialExport,
  "GET /api/tournaments": handleTournamentList,
  "GET /api/tournaments/:id": handleTournamentDetail,
  "POST /api/tournaments/:id/register": handleTournamentRegister,
  "POST /api/tournaments/payment-order": handleTournamentPaymentOrder,
  "POST /api/tournaments/payment-verify": handleAtomicTournamentPaymentVerify,
  "POST /api/tournaments/payment-webhook": handleProductionRazorpayTournamentWebhook,
  "POST /api/admin/games/sheets/status": handleGoogleSheetsStatus,
  "POST /api/admin/games/sheets/preview": handleAdminGameSyncPreview,
  "POST /api/admin/games/sheets/sync": handleGoogleSheetsSync,
  "POST /api/admin/games/sheets/pull": handleGoogleSheetsPull,
  "GET /api/employee/dashboard": employeeDashboard,
  "GET /api/employee/shift": getShift,
  "POST /api/employee/shift/start": startShift,
  "POST /api/employee/shift/end": endShift,
  "GET /api/employee/cash-ledger": cashLedger,
  "POST /api/employee/cash-ledger/entry": addCashLedger,
  "POST /api/employee/walk-in": handleEmployeeWalkInFinancial,
  "POST /api/employee/bookings/check-in": checkIn,
  "POST /api/employee/check-in/qr": handleEmployeeQrCheckIn,
  "POST /api/employee/sessions/:sessionId/extend": extendSession,
  "POST /api/employee/sessions/:sessionId/transfer": transferSession,
  "POST /api/employee/sessions/:sessionId/end": handleEmployeeEndSessionFinancial,
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
  "POST /api/employee/refunds/request": requestRefund,
  "POST /api/employee/refunds/:refundId/action": processRefund,
  "GET /api/employee/refunds": refunds,
  "GET /api/employee/customers": customers,
  "POST /api/employee/customers": createCustomer,
  "POST /api/employee/fnb/order": handleEmployeeFnbFinancial,
};

function registerProtected(app: express.Application, method: "get" | "post" | "put" | "patch" | "delete", path: string, ...handlers: express.RequestHandler[]) {
  const override = productionOverrides[`${method.toUpperCase()} ${path}`];
  if (override) return app[method](path, apiSecurityPolicy, override);
  return app[method](path, apiSecurityPolicy, ...handlers);
}

let initialized = false;
export function applyProductionPreload(app: express.Application): void {
  if (initialized) return;
  initialized = true;
  registerAuthRoutes(app);
  registerPasswordResetRoutes(app);
  registerAdminRoutes(app);
  registerProtected(app, "post", "/api/admin/refunds/:id/process", handleAdminProcessRefund);
  registerProtected(app, "post", "/api/admin/refunds/:id/reconcile", handleAdminReconcileRefund);
  registerProtected(app, "post", "/api/admin/refunds/:id/credit-note", handleAdminCreditNote);
  registerProtected(app, "post", "/api/admin/fnb-refunds/:id/process", handleAdminFnbRefund);
  registerProtected(app, "post", "/api/admin/fnb-refunds/:id/credit-note", handleAdminFnbCreditNote);
  registerProtected(app, "post", "/api/admin/tournaments", handleAdminTournamentCreate);
  registerProtected(app, "patch", "/api/admin/tournaments/:id", handleAdminTournamentUpdate);
  registerProtected(app, "get", "/api/admin/tournaments/:id/teams", handleAdminTournamentTeams);
  registerProtected(app, "post", "/api/integrations/google-sheets/sync", handleGoogleSheetsSync);
  registerProtected(app, "post", "/api/integrations/google-forms/tournament-response", handleTournamentFormResponse);
  for (const key of Object.keys(productionOverrides)) {
    const space = key.indexOf(" ");
    const method = key.slice(0, space).toLowerCase() as "get" | "post" | "put" | "patch" | "delete";
    const path = key.slice(space + 1);
    registerProtected(app, method, path);
  }
  app.get("/api/ready", async (_req, res) => {
    try {
      const db = await getMongoDb();
      await db.command({ ping: 1 });
      return res.json({ status: "ready", timestamp: new Date().toISOString(), dependencies: { mongodb: "ok" } });
    } catch {
      return res.status(503).json({ status: "not_ready", timestamp: new Date().toISOString(), dependencies: { mongodb: "unavailable" } });
    }
  });
  void ensureAuthIndexes().then(() => getMongoDb()).then(ensureLoginGuardIndexes).then(() => ensurePasswordResetIndexes()).then(() => ensureQrCheckInIndexes()).catch((error) => console.error("Authentication/index bootstrap failed:", error));
  startSessionLifecycle();
  startFnbLifecycle();
}
