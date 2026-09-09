import express from "express";
import { apiSecurityPolicy } from "./security.js";
import { handleGameCatalog, handleGameCatalogDetail } from "../services/productionGameCatalogHandlers.js";
import { reconcileFinancialLedger } from "../services/financialLedgerReconciliation.js";

const originalGet=(express.application as any).get;
const originalPost=(express.application as any).post;
if(typeof originalGet==="function"){
  (express.application as any).get=function(path:any,...handlers:any[]){
    if(path==="/api/games") return originalGet.call(this,path,apiSecurityPolicy,handleGameCatalog);
    if(path==="/api/games/:id") return originalGet.call(this,path,apiSecurityPolicy,handleGameCatalogDetail);
    if(path==="/api/financial/ledger") return originalGet.call(this,path,apiSecurityPolicy,async(req:any,res:any)=>{ const u=req.user; if(!u||!["ADMIN","SUPER_ADMIN"].includes(String(u.role))) return res.status(403).json({success:false,error:"Admin access required"}); const db=await (await import("./mongodb.js")).getMongoDb(); const limit=Math.min(Math.max(Number(req.query.limit)||200,1),1000); const rows=await db.collection("financial_ledger").find({}).sort({occurredAt:-1}).limit(limit).toArray(); return res.json({success:true,data:{rows,count:rows.length}}); });
    return originalGet.call(this,path,...handlers);
  };
}
if(typeof originalPost==="function"){
  (express.application as any).post=function(path:any,...handlers:any[]){
    if(path==="/api/financial/ledger/reconcile") return originalPost.call(this,path,apiSecurityPolicy,async(req:any,res:any)=>{ const u=req.user; if(!u||!["ADMIN","SUPER_ADMIN"].includes(String(u.role))) return res.status(403).json({success:false,error:"Admin access required"}); try{return res.json({success:true,data:await reconcileFinancialLedger()});}catch(error){console.error("financial/ledger/reconcile",error);return res.status(500).json({success:false,error:"Financial ledger reconciliation failed"});} });
    return originalPost.call(this,path,...handlers);
  };
}
