import type { Request, Response } from "express";
import { getMongoDb } from "../server/mongodb.js";
import { writeAuditLog } from "../server/domainRepositories.js";
import type { AuthenticatedRequest } from "../server/auth.js";

const fail = (res: Response, status: number, error: string) => res.status(status).json({ success: false, error });
const actor = (req: Request) => (req as AuthenticatedRequest).user;
const safeInt = (v: unknown) => Number.isSafeInteger(Number(v)) ? Number(v) : 0;
const parseDate = (v: unknown, fallback: Date) => { const d = v ? new Date(String(v)) : fallback; return Number.isNaN(d.getTime()) ? fallback : d; };

export async function handleAdminFinancialSummary(req: Request, res: Response) {
  const u = actor(req); if (!u || !["ADMIN", "SUPER_ADMIN"].includes(String(u.role))) return fail(res, 403, "Admin access required");
  const now = new Date(); const from = parseDate(req.query.from, new Date(now.getTime() - 30 * 86400000)); const to = parseDate(req.query.to, now);
  if (from > to) return fail(res, 400, "from must be before to");
  const db = await getMongoDb(); const range = { createdAt: { $gte: from, $lte: to } };
  const [payments, fnbOrders, invoices, refunds, wallet, memberships, cash] = await Promise.all([
    db.collection("payments").find(range).toArray(),
    db.collection("fnb_orders").find(range).toArray(),
    db.collection("invoices").find(range).toArray(),
    db.collection("refunds").find(range).toArray(),
    db.collection("wallet_transactions").find(range).toArray(),
    db.collection("customer_memberships").find(range).toArray(),
    db.collection("cash_ledger").find(range).toArray(),
  ]);
  const captured = payments.filter((x: any) => ["CAPTURED", "PAID"].includes(String(x.status))).reduce((n: number, x: any) => n + safeInt(x.amountPaise), 0);
  const fnbPaid = fnbOrders.filter((x: any) => String(x.paymentStatus) === "PAID").reduce((n: number, x: any) => n + safeInt(x.totalPaise), 0);
  const refundsCompleted = refunds.filter((x: any) => String(x.status) === "COMPLETED").reduce((n: number, x: any) => n + safeInt(x.amountPaise), 0);
  const walletCredits = wallet.filter((x: any) => ["CREDIT", "credit"].includes(String(x.type))).reduce((n: number, x: any) => n + safeInt(x.amountPaise), 0);
  const walletDebits = wallet.filter((x: any) => ["DEBIT", "debit"].includes(String(x.type))).reduce((n: number, x: any) => n + safeInt(x.amountPaise), 0);
  const membershipSales = memberships.filter((x: any) => ["ACTIVE", "PAID"].includes(String(x.status))).reduce((n: number, x: any) => n + safeInt(x.pricePaise), 0);
  const cashIn = cash.filter((x: any) => ["IN", "CREDIT", "SALE"].includes(String(x.type).toUpperCase())).reduce((n: number, x: any) => n + safeInt(x.amountPaise), 0);
  const cashOut = cash.filter((x: any) => ["OUT", "DEBIT", "EXPENSE"].includes(String(x.type).toUpperCase())).reduce((n: number, x: any) => n + safeInt(x.amountPaise), 0);
  const gross = captured + fnbPaid + membershipSales;
  return res.json({ success: true, data: { from: from.toISOString(), to: to.toISOString(), revenue: { gamingAndOnlinePaise: captured, fnbPaise: fnbPaid, membershipPaise: membershipSales, grossPaise: gross, refundsPaise: refundsCompleted, netPaise: gross - refundsCompleted }, wallet: { creditsPaise: walletCredits, debitsPaise: walletDebits }, cash: { inPaise: cashIn, outPaise: cashOut, netPaise: cashIn - cashOut }, counts: { payments: payments.length, fnbOrders: fnbOrders.length, invoices: invoices.length, refunds: refunds.length } } });
}

export async function handleAdminFinancialLedger(req: Request, res: Response) {
  const u = actor(req); if (!u || !["ADMIN", "SUPER_ADMIN"].includes(String(u.role))) return fail(res, 403, "Admin access required");
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500); const db = await getMongoDb();
  const [payments, fnb, refunds, wallet, memberships, invoices] = await Promise.all([
    db.collection("payments").find({}).sort({ createdAt: -1 }).limit(limit).toArray(),
    db.collection("fnb_orders").find({}).sort({ createdAt: -1 }).limit(limit).toArray(),
    db.collection("refunds").find({}).sort({ createdAt: -1 }).limit(limit).toArray(),
    db.collection("wallet_transactions").find({}).sort({ createdAt: -1 }).limit(limit).toArray(),
    db.collection("customer_memberships").find({}).sort({ createdAt: -1 }).limit(limit).toArray(),
    db.collection("invoices").find({}).sort({ createdAt: -1 }).limit(limit).toArray(),
  ]);
  const rows: any[] = [];
  for (const p of payments) rows.push({ timestamp:p.createdAt, type:"PAYMENT", id:p.id, status:p.status, amountPaise:safeInt(p.amountPaise), customerId:p.customerId, source:p.bookingId ? "GAMING" : p.fnbOrderId ? "FNB" : p.membershipId ? "MEMBERSHIP" : "PAYMENT" });
  for (const o of fnb) rows.push({ timestamp:o.createdAt, type:"FNB", id:o.id, status:o.paymentStatus, amountPaise:safeInt(o.totalPaise), customerId:o.customerId, source:"FNB" });
  for (const r of refunds) rows.push({ timestamp:r.createdAt, type:"REFUND", id:r.id, status:r.status, amountPaise:-safeInt(r.amountPaise), customerId:r.customerId, source:r.fnbOrderId ? "FNB" : "GAMING" });
  for (const w of wallet) rows.push({ timestamp:w.createdAt, type:"WALLET", id:w.id, status:w.type, amountPaise:(String(w.type).toUpperCase()==="DEBIT"?-1:1)*safeInt(w.amountPaise), customerId:w.customerId, source:w.source });
  for (const m of memberships) rows.push({ timestamp:m.createdAt, type:"MEMBERSHIP", id:m.id, status:m.status, amountPaise:safeInt(m.pricePaise), customerId:m.customerId, source:"MEMBERSHIP" });
  for (const i of invoices) rows.push({ timestamp:i.createdAt, type:"INVOICE", id:i.id, status:i.paymentStatus, amountPaise:safeInt(i.totalPaise), customerId:i.customerId, source:i.fnbOrderId?"FNB":"GAMING" });
  rows.sort((a,b)=>new Date(b.timestamp).getTime()-new Date(a.timestamp).getTime());
  return res.json({ success:true, data:{ rows:rows.slice(0,limit), count:rows.length } });
}

export async function handleAdminReconciliation(req: Request, res: Response) {
  const u = actor(req); if (!u || !["ADMIN", "SUPER_ADMIN"].includes(String(u.role))) return fail(res,403,"Admin access required");
  const db = await getMongoDb();
  const [payments, invoices, fnbOrders, refunds] = await Promise.all([
    db.collection("payments").find({}).toArray(), db.collection("invoices").find({}).toArray(), db.collection("fnb_orders").find({}).toArray(), db.collection("refunds").find({}).toArray()
  ]);
  const issues:any[]=[];
  for(const p of payments){ if(["CAPTURED","PAID"].includes(String(p.status))){ const linked=await db.collection("invoices").findOne({paymentId:p.id}); if(!linked && p.bookingId) issues.push({type:"MISSING_INVOICE",paymentId:p.id,bookingId:p.bookingId,amountPaise:safeInt(p.amountPaise)}); } }
  for(const o of fnbOrders){ if(String(o.paymentStatus)==="PAID" && !invoices.some((i:any)=>i.fnbOrderId===o.id)) issues.push({type:"MISSING_FNB_INVOICE",orderId:o.id,amountPaise:safeInt(o.totalPaise)}); }
  for(const r of refunds){ if(String(r.status)==="COMPLETED" && !r.providerRefundId) issues.push({type:"COMPLETED_REFUND_MISSING_PROVIDER_ID",refundId:r.id}); if(String(r.status)==="COMPLETED" && !r.creditNoteId) issues.push({type:"REFUND_MISSING_CREDIT_NOTE",refundId:r.id}); }
  return res.json({success:true,data:{checked:{payments:payments.length,invoices:invoices.length,fnbOrders:fnbOrders.length,refunds:refunds.length},issueCount:issues.length,issues}});
}

export async function handleAdminFinancialExport(req: Request, res: Response) {
  const u=actor(req); if(!u || !["ADMIN","SUPER_ADMIN"].includes(String(u.role))) return fail(res,403,"Admin access required");
  const db=await getMongoDb(); const from=parseDate(req.query.from,new Date(Date.now()-30*86400000)); const to=parseDate(req.query.to,new Date());
  const rows:any[]=[]; const [p,r,f,m]=await Promise.all([db.collection("payments").find({createdAt:{$gte:from,$lte:to}}).toArray(),db.collection("refunds").find({createdAt:{$gte:from,$lte:to}}).toArray(),db.collection("fnb_orders").find({createdAt:{$gte:from,$lte:to}}).toArray(),db.collection("customer_memberships").find({createdAt:{$gte:from,$lte:to}}).toArray()]);
  for(const x of p) rows.push({timestamp:x.createdAt,type:"PAYMENT",id:x.id,status:x.status,amountPaise:safeInt(x.amountPaise),customerId:x.customerId});
  for(const x of r) rows.push({timestamp:x.createdAt,type:"REFUND",id:x.id,status:x.status,amountPaise:-safeInt(x.amountPaise),customerId:x.customerId});
  for(const x of f) rows.push({timestamp:x.createdAt,type:"FNB",id:x.id,status:x.paymentStatus,amountPaise:safeInt(x.totalPaise),customerId:x.customerId});
  for(const x of m) rows.push({timestamp:x.createdAt,type:"MEMBERSHIP",id:x.id,status:x.status,amountPaise:safeInt(x.pricePaise),customerId:x.customerId});
  rows.sort((a,b)=>new Date(a.timestamp).getTime()-new Date(b.timestamp).getTime());
  const csv=["timestamp,type,id,status,amountPaise,customerId",...rows.map(x=>[x.timestamp,x.type,x.id,x.status,x.amountPaise,x.customerId||""].map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(","))].join("\n");
  res.setHeader("Content-Type","text/csv; charset=utf-8"); res.setHeader("Content-Disposition",`attachment; filename=financial-ledger-${from.toISOString().slice(0,10)}-${to.toISOString().slice(0,10)}.csv`); return res.send(csv);
}
