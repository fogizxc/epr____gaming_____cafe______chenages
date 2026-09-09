import crypto from "node:crypto";
import type { Request, Response } from "express";
import { getMongoDb } from "../server/mongodb.js";
import { claimRazorpayWebhook, completeRazorpayWebhook, failRazorpayWebhook } from "./razorpayWebhookClaims.js";
import { handleProductionPaymentWebhook } from "./productionPaymentHandlers.js";
import { handleMembershipPaymentWebhook } from "./productionMembershipPaymentHandlers.js";
import { handleFnbPaymentWebhook } from "./productionFnbFinancialHandlers.js";
import { handleTournamentPaymentWebhook } from "./productionTournamentHandlers.js";

type Handler=(req:Request,res:Response)=>Promise<unknown>|unknown;
function eventKey(req:Request){const body=req.body||{};const entity=body?.payload?.payment?.entity;return String(req.header("x-razorpay-event-id")||body?.id||`${body?.event||"unknown"}:${entity?.id||entity?.order_id||""}`).slice(0,250)}
function verifySignature(req:Request){const signature=String(req.header("x-razorpay-signature")||"");const secret=process.env.RAZORPAY_WEBHOOK_SECRET?.trim();const raw=(req as any).rawBody; if(!signature||!secret||!Buffer.isBuffer(raw)||!raw.length)return false;const expected=crypto.createHmac("sha256",secret).update(raw).digest("hex");const a=Buffer.from(expected,"utf8"),b=Buffer.from(signature,"utf8");return a.length===b.length&&crypto.timingSafeEqual(a,b)}
async function gateway(prefix:string,req:Request,res:Response,handler:Handler){
 if(!verifySignature(req))return res.status(400).json({success:false,error:"Invalid webhook signature"});
 const db=await getMongoDb();const delivery=eventKey(req);const claimKey=`CLAIM:${prefix}:${delivery}`;const claim=await claimRazorpayWebhook(db,claimKey,{provider:"RAZORPAY",domain:prefix,event:String(req.body?.event||""),deliveryId:delivery});
 if(claim.duplicate)return res.json({success:true,duplicate:true});
 if(Number(claim.attempts||1)>1)await db.collection("razorpay_webhook_events").deleteOne({key:`${prefix}:${delivery}`});
 try{await handler(req,res);if(res.statusCode>=400){await failRazorpayWebhook(db,claimKey,new Error(`Webhook handler returned HTTP ${res.statusCode}`));return}await completeRazorpayWebhook(db,claimKey,{handlerStatus:res.statusCode})}catch(error){await failRazorpayWebhook(db,claimKey,error);throw error}
}
export const handleProductionRazorpayPaymentWebhook=(req:Request,res:Response)=>gateway("PAYMENT",req,res,handleProductionPaymentWebhook);
export const handleProductionRazorpayMembershipWebhook=(req:Request,res:Response)=>gateway("MEMBERSHIP",req,res,handleMembershipPaymentWebhook);
export const handleProductionRazorpayFnbWebhook=(req:Request,res:Response)=>gateway("FNB",req,res,handleFnbPaymentWebhook);
export const handleProductionRazorpayTournamentWebhook=(req:Request,res:Response)=>gateway("TOURNAMENT",req,res,handleTournamentPaymentWebhook);
