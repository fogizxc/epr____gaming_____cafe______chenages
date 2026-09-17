import type express from "express";
import { apiSecurityPolicy } from "./security.js";
import { handleGameCatalog, handleGameCatalogDetail } from "../services/productionGameCatalogHandlers.js";
import { reconcileFinancialLedger } from "../services/financialLedgerReconciliation.js";
import { getMongoDb } from "./mongodb.js";

export function registerCatalogRoutes(app: express.Application): void {
  app.get("/api/games", apiSecurityPolicy, handleGameCatalog);
  app.get("/api/games/:id", apiSecurityPolicy, handleGameCatalogDetail);
  app.get("/api/financial/ledger", apiSecurityPolicy, async (req: any, res: any) => {
    const u = req.user;
    if (!u || !["ADMIN", "SUPER_ADMIN"].includes(String(u.role))) return res.status(403).json({ success: false, error: "Admin access required" });
    try {
      const db = await getMongoDb();
      const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 1000);
      const rows = await db.collection("financial_ledger").find({}).sort({ occurredAt: -1 }).limit(limit).toArray();
      return res.json({ success: true, data: { rows, count: rows.length } });
    } catch {
      return res.status(503).json({ success: false, error: "Financial ledger unavailable" });
    }
  });
  app.post("/api/financial/ledger/reconcile", apiSecurityPolicy, async (req: any, res: any) => {
    const u = req.user;
    if (!u || !["ADMIN", "SUPER_ADMIN"].includes(String(u.role))) return res.status(403).json({ success: false, error: "Admin access required" });
    try { return res.json({ success: true, data: await reconcileFinancialLedger() }); }
    catch (error) { console.error("financial/ledger/reconcile", error); return res.status(500).json({ success: false, error: "Financial ledger reconciliation failed" }); }
  });
}
