import type { Request, Response } from "express";
import crypto from "node:crypto";
import { ObjectId } from "mongodb";
import { getMongoDb, getMongoClient } from "../server/mongodb.js";
import { recordFinancialTransaction } from "./financialLedger.js";
import { writeAuditLog } from "../server/domainRepositories.js";
import type { AuthenticatedRequest } from "../server/auth.js";

const fail=(res:Response,status:number,error:string)=>res.status(status).json({success:false,error});
const actor=(req:Request)=>(req as AuthenticatedRequest).user;
const idFilter=(id:string)=>ObjectId.isValid(id)?{_id:new ObjectId(id)}:{id};
const env=(name:string)=>{const v=process.env[name]?.trim();if(!v)throw new Error(`${name}_NOT_CONFIGURED`);return v;};
const safeInt=(v:unknown)=>Number.isSafeInteger(Number(v))?Number(v):0;

async function razorpay(path:string){
 const auth=Buffer.from(`${env("RAZORPAY_KEY_ID")}:${env("RAZORPAY_KEY_SECRET")}`).toString("base64");
 const r=await fetch(`https://api.razorpay.com/v1${path}`,{headers:{Authorization:`Basic ${auth}`}});
 const body=await r.json().catch(()=>({}));
 if(!r.ok){const e:any=new Error("RAZORPAY_REQUEST_FAILED");e.provider=body;throw e;}
 return body;
}

export async function handleAdminReconcileRefund(req:Request,res:Response){
 const u=actor(req);if(!u||!["ADMIN","SUPER_ADMIN"].includes(String(u.role)))return fail(res,403,"Admin access required");
 const refundId=String(req.params.id||"").trim();if(!refundId)return fail(res,400,"Refund id is required");
 const db=await getMongoDb();const refund=await db.collection("refunds").findOne(idFilter(refundId));if(!refund)return fail(res,404,"Refund not found");
 if(refund.status==="COMPLETED"&&refund.providerRefundId)return res.json({success:true,refund,reconciled:false,alreadyCompleted:true});
 if(!["APPROVED","PROCESSING"].includes(String(refund.status)))return fail(res,409,"Only approved or processing refunds can be reconciled");
 const paymentId=String(refund.paymentId||"");
 let payment:any=paymentId?await db.collection("payments").findOne(idFilter(paymentId)):null;
 if(!payment){const q=refund.fnbOrderId?{fnbOrderId:refund.fnbOrderId,provider:"RAZORPAY"}:{bookingId:refund.bookingId,provider:"RAZORPAY"};payment=await db.collection("payments").findOne(q,{sort:{createdAt:-1}});}
 if(!payment?.providerPaymentId)return fail(res,409,"No Razorpay payment is linked to this refund");
 try{
  const result=await razorpay(`/payments/${encodeURIComponent(String(payment.providerPaymentId))}/refunds`);
  const refunds=Array.isArray(result?.items)?result.items:[];
  const expectedAmount=safeInt(refund.amountPaise);
  const match=refunds.find((r:any)=>String(r.id)===String(refund.providerRefundId))||refunds.find((r:any)=>safeInt(r.amount)===expectedAmount&&String(r.receipt||"")===String(refund.id).slice(0,40))||refunds.find((r:any)=>safeInt(r.amount)===expectedAmount&&["processed","pending"].includes(String(r.status).toLowerCase()));
  if(!match)return res.status(409).json({success:false,error:"Provider refund not found; no local state changed",providerPaymentId:payment.providerPaymentId});
  const providerStatus=String(match.status||"").toLowerCase();
  if(["failed","reversed"].includes(providerStatus)){
   await db.collection("refunds").updateOne({...idFilter(refund.id),status:refund.status},{$set:{status:"APPROVED",providerStatus:match.status,reconciliationRequired:true,reconciliationAt:new Date(),updatedAt:new Date()}});
   return res.status(409).json({success:false,error:"Provider reports the refund failed or was reversed",providerRefund:{id:match.id,status:match.status}});
  }
  const client=getMongoClient();if(!client)return fail(res,503,"MongoDB transaction support is unavailable");
  const tx=client.startSession();const now=new Date();
  try{await tx.withTransaction(async()=>{
   const current=await db.collection("refunds").findOne(idFilter(refund.id),{session:tx});if(!current)throw new Error("REFUND_NOT_FOUND");
   if(current.status==="COMPLETED"&&current.providerRefundId)return;
   await db.collection("refunds").updateOne({...idFilter(refund.id),status:{$in:["APPROVED","PROCESSING"]}},{$set:{status:"COMPLETED",paymentId:payment.id,providerRefundId:match.id,providerStatus:match.status,reconciledAt:now,reconciliationRequired:false,completedAt:now,updatedAt:now}},{session:tx});
   await db.collection("payments").updateOne({_id:payment._id},{$inc:{refundedAmountPaise:expectedAmount},$set:{refundedAt:now,updatedAt:now}},{session:tx});
   await recordFinancialTransaction({id:`REFUND:${refund.id}`,type:"REFUND",source:refund.fnbOrderId?"FNB":"REFUND",sourceId:refund.fnbOrderId||refund.bookingId||refund.id,customerId:refund.customerId,paymentId:payment.id,amountPaise:expectedAmount,currency:"INR",occurredAt:now,createdAt:now,metadata:{refundId:refund.id,providerRefundId:match.id,reconciled:true}},{db,session:tx});
  });}finally{await tx.endSession();}
  const updated=await db.collection("refunds").findOne(idFilter(refund.id));await writeAuditLog({actorId:u.id,actorRole:u.role,action:"REFUND_RECONCILED",entityType:"refund",entityId:refund.id,metadata:{providerRefundId:match.id,amountPaise:expectedAmount}});return res.json({success:true,reconciled:true,refund:updated,providerRefund:{id:match.id,status:match.status,amount:match.amount}});
 }catch(error:any){console.error("refund/reconcile",error);if(error.message?.endsWith("_NOT_CONFIGURED"))return fail(res,503,"Payment provider is not configured");return fail(res,502,"Refund reconciliation failed; local state was not confirmed");}
}
