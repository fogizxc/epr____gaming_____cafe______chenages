import type { Request, Response } from "express";
import { getMongoDb } from "../server/mongodb.js";
import { writeAuditLog } from "../server/domainRepositories.js";
import type { AuthenticatedRequest } from "../server/auth.js";

const fail=(res:Response,status:number,error:string)=>res.status(status).json({success:false,error});
const actor=(req:Request)=>(req as AuthenticatedRequest).user;
const safeInt=(v:unknown)=>Number.isSafeInteger(Number(v))?Number(v):0;
const parseDate=(v:unknown,fallback:Date)=>{const d=v?new Date(String(v)):fallback;return Number.isNaN(d.getTime())?fallback:d;};
const admin=(req:Request)=>{const u=actor(req);return u&&["ADMIN","SUPER_ADMIN"].includes(String(u.role));};

export async function handleAdminFinancialSummary(req:Request,res:Response){
 if(!admin(req))return fail(res,403,"Admin access required");
 const now=new Date(),from=parseDate(req.query.from,new Date(now.getTime()-30*86400000)),to=parseDate(req.query.to,now);if(from>to)return fail(res,400,"from must be before to");
 const db=await getMongoDb();const entries=await db.collection("financial_ledger").find({occurredAt:{$gte:from,$lte:to}}).sort({occurredAt:-1}).toArray();
 const sales=entries.filter((e:any)=>e.type==="SALE"),refunds=entries.filter((e:any)=>e.type==="REFUND"),walletCredits=entries.filter((e:any)=>e.type==="WALLET_CREDIT"),walletDebits=entries.filter((e:any)=>e.type==="WALLET_DEBIT"),cashIn=entries.filter((e:any)=>e.type==="CASH_IN"),cashOut=entries.filter((e:any)=>e.type==="CASH_OUT");
 const by=(xs:any[])=>xs.reduce((n,e)=>n+safeInt(e.amountPaise),0),gross=by(sales),refundTotal=by(refunds);
 return res.json({success:true,data:{from:from.toISOString(),to:to.toISOString(),revenue:{gamingAndOnlinePaise:by(sales.filter((e:any)=>e.source==="GAMING")),fnbPaise:by(sales.filter((e:any)=>e.source==="FNB")),membershipPaise:by(sales.filter((e:any)=>e.source==="MEMBERSHIP")),tournamentPaise:by(sales.filter((e:any)=>e.source==="TOURNAMENT")),grossPaise:gross,refundsPaise:refundTotal,netPaise:gross-refundTotal},wallet:{creditsPaise:by(walletCredits),debitsPaise:by(walletDebits)},cash:{inPaise:by(cashIn),outPaise:by(cashOut),netPaise:by(cashIn)-by(cashOut)},counts:{ledgerEntries:entries.length,sales:sales.length,refunds:refunds.length}}});
}

export async function handleAdminFinancialLedger(req:Request,res:Response){
 if(!admin(req))return fail(res,403,"Admin access required");
 const limit=Math.min(Math.max(Number(req.query.limit)||100,1),500);const db=await getMongoDb();const rows=await db.collection("financial_ledger").find({}).sort({occurredAt:-1}).limit(limit).toArray();
 return res.json({success:true,data:{rows:rows.map((e:any)=>({timestamp:e.occurredAt||e.createdAt,type:e.type,id:e.id,status:e.type,amountPaise:e.type==="REFUND"?-safeInt(e.amountPaise):safeInt(e.amountPaise),customerId:e.customerId,source:e.source,sourceId:e.sourceId,paymentId:e.paymentId,invoiceId:e.invoiceId,metadata:e.metadata})),count:rows.length}});
}

export async function handleAdminReconciliation(req:Request,res:Response){
 if(!admin(req))return fail(res,403,"Admin access required");
 const db=await getMongoDb();const [ledger,payments,invoices,refunds]=await Promise.all([db.collection("financial_ledger").find({}).toArray(),db.collection("payments").find({}).toArray(),db.collection("invoices").find({}).toArray(),db.collection("refunds").find({}).toArray()]);
 const ids=new Set(ledger.map((e:any)=>String(e.transactionId||e.id)));const issues:any[]=[];
 for(const p of payments)if(["CAPTURED","PAID"].includes(String(p.status))&&!ids.has(`SALE:${p.id}`)&&p.bookingId)issues.push({type:"MISSING_GAMING_LEDGER",paymentId:p.id,bookingId:p.bookingId,amountPaise:safeInt(p.amountPaise)});
 for(const r of refunds)if(String(r.status)==="COMPLETED"&&!ids.has(`REFUND:${r.id}`))issues.push({type:"MISSING_REFUND_LEDGER",refundId:r.id,amountPaise:safeInt(r.amountPaise)});
 for(const i of invoices)if(String(i.paymentStatus)==="PAID"&&!i.paymentId&&!i.fnbOrderId)issues.push({type:"PAID_INVOICE_MISSING_SOURCE",invoiceId:i.id});
 await writeAuditLog({actorId:actor(req)?.id,actorRole:actor(req)?.role,action:"FINANCIAL_RECONCILIATION_RUN",entityType:"financial_ledger",entityId:`RECON-${Date.now()}`,metadata:{issueCount:issues.length,ledgerEntries:ledger.length}});
 return res.json({success:true,data:{checked:{ledger:ledger.length,payments:payments.length,invoices:invoices.length,refunds:refunds.length},issueCount:issues.length,issues}});
}

export async function handleAdminFinancialExport(req:Request,res:Response){
 if(!admin(req))return fail(res,403,"Admin access required");
 const from=parseDate(req.query.from,new Date(Date.now()-30*86400000)),to=parseDate(req.query.to,new Date());if(from>to)return fail(res,400,"from must be before to");
 const db=await getMongoDb();const rows=await db.collection("financial_ledger").find({occurredAt:{$gte:from,$lte:to}}).sort({occurredAt:1}).toArray();
 const csv=["timestamp,type,id,source,sourceId,status,amountPaise,customerId,paymentId,invoiceId",...rows.map((x:any)=>[x.occurredAt||x.createdAt,x.type,x.id,x.source,x.sourceId,x.type,safeInt(x.amountPaise)*(x.type==="REFUND"?-1:1),x.customerId||"",x.paymentId||"",x.invoiceId||""].map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(","))].join("\n");
 res.setHeader("Content-Type","text/csv; charset=utf-8");res.setHeader("Content-Disposition",`attachment; filename=financial-ledger-${from.toISOString().slice(0,10)}-${to.toISOString().slice(0,10)}.csv`);return res.send(csv);
}