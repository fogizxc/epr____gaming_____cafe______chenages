import crypto from "node:crypto";
import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import type { AuthenticatedRequest } from "../server/auth.js";
import { getMongoDb, getMongoClient } from "../server/mongodb.js";
import { recordFinancialTransaction } from "./financialLedger.js";
import { writeAuditLog } from "../server/domainRepositories.js";

const id=(p:string)=>`${p}-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`;
const user=(r:Request)=>(r as AuthenticatedRequest).user;
const fail=(s:Response,n:number,e:string)=>s.status(n).json({success:false,error:e});
const money=(v:unknown)=>{const n=Number(v);return Number.isSafeInteger(n)&&n>=0?n:0};
const idem=(r:Request)=>String(r.header("Idempotency-Key")||r.body?.idempotencyKey||"").trim();
const oid=(x:string)=>ObjectId.isValid(x)?{$or:[{id:x},{_id:new ObjectId(x)}]}:{id:x};

export async function handleEmployeeWalkInFinancial(req:Request,res:Response){
 const u=user(req);if(!u)return fail(res,401,"Authentication required");const key=idem(req);if(key.length<16||key.length>128)return fail(res,400,"A valid Idempotency-Key is required");
 const {systemId,customerName,customerPhone,durationHours,gameTitle}=req.body||{};const hours=Number(durationHours);const method=String(req.body?.paymentMethod||"CASH").toUpperCase();
 if(!systemId||!customerName||!customerPhone||!Number.isFinite(hours)||hours<=0||hours>12)return fail(res,400,"systemId, customerName, customerPhone and valid durationHours are required");
 if(!["CASH","UPI","CARD"].includes(method))return fail(res,400,"Walk-in payment must be CASH, UPI or CARD");
 const db=await getMongoDb(),client=getMongoClient();if(!client)return fail(res,503,"MongoDB transaction support is unavailable");
 const existing=await db.collection("active_sessions").findOne({employeeId:u.id,idempotencyKey:key});if(existing)return res.json({success:true,data:{session:existing},duplicate:true});
 const tx=client.startSession();let sessionDoc:any;
 try{await tx.withTransaction(async()=>{
  const system:any=await db.collection("gaming_systems").findOneAndUpdate({id:String(systemId),status:"AVAILABLE"},{$set:{status:"ACTIVE",updatedAt:new Date()}},{session:tx,returnDocument:"after"});if(!system)throw new Error("STATION_UNAVAILABLE");
  const rule:any=await db.collection("pricing_rules").findOne({service:system.category},{session:tx});const rate=money(rule?.normalRatePaise??Number(rule?.normalRate||system.hourlyRate||0)*100);if(!rate)throw new Error("INVALID_RATE");const total=Math.round(rate*hours);const now=new Date();
  sessionDoc={id:id("SESS"),systemId:system.id,systemName:system.name,customerName:String(customerName).trim().slice(0,120),customerPhone:String(customerPhone).trim().slice(0,30),gameTitle:String(gameTitle||"Gaming Session").slice(0,120),startedAt:now,scheduledEndAt:new Date(now.getTime()+hours*3600000),durationHours:hours,ratePerHourPaise:rate,gamingChargePaise:total,totalPaise:total,paymentMethod:method,paymentStatus:"PAID",status:"ACTIVE",employeeId:u.id,idempotencyKey:key,createdAt:now,updatedAt:now};
  await db.collection("active_sessions").insertOne(sessionDoc,{session:tx});
  const invoice={id:id("INV"),invoiceNumber:`BC-${now.getFullYear()}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`,sessionId:sessionDoc.id,customerId:null,customerName:sessionDoc.customerName,status:"ISSUED",paymentStatus:"PAID",currency:"INR",subtotalPaise:total,taxPaise:0,discountPaise:0,totalPaise:total,issuedAt:now,createdAt:now,updatedAt:now,immutable:true,items:[{description:`${system.category||"Gaming"} walk-in session`,quantity:1,amountPaise:total}]};
  await db.collection("invoices").insertOne(invoice,{session:tx});
  await recordFinancialTransaction({id:`SALE:GAMING:${sessionDoc.id}`,type:"SALE",source:"GAMING",sourceId:sessionDoc.id,paymentId:undefined,invoiceId:invoice.id,amountPaise:total,currency:"INR",occurredAt:now,createdAt:now,metadata:{paymentMethod:method,employeeId:u.id,walkIn:true}},{db,session:tx});
  sessionDoc.invoiceId=invoice.id;
 });
 }catch(e:any){if(e.message==="STATION_UNAVAILABLE")return fail(res,409,"Station is unavailable");if(e.message==="INVALID_RATE")return fail(res,409,"Station has no valid price");if(e?.code===11000)return fail(res,409,"Walk-in already exists for this request");console.error("employee/walk-in-financial",e);return fail(res,500,"Unable to start walk-in session");}finally{await tx.endSession()}
 await writeAuditLog({actorId:u.id,actorRole:u.role,action:"WALKIN_FINANCIAL_SETTLED",entityType:"active_session",entityId:sessionDoc.id,metadata:{totalPaise:sessionDoc.totalPaise,invoiceId:sessionDoc.invoiceId,paymentMethod:method}});return res.status(201).json({success:true,data:{session:sessionDoc,invoiceId:sessionDoc.invoiceId}});
}

export async function handleEmployeeFnbFinancial(req:Request,res:Response){
 const u=user(req);if(!u)return fail(res,401,"Authentication required");const key=idem(req);if(key.length<16||key.length>128)return fail(res,400,"A valid Idempotency-Key is required");const items=req.body?.items;if(!Array.isArray(items)||!items.length||items.length>50)return fail(res,400,"Invalid order items");
 const db=await getMongoDb(),client=getMongoClient();if(!client)return fail(res,503,"MongoDB transaction support is unavailable");const existing=await db.collection("fnb_orders").findOne({idempotencyKey:key});if(existing)return res.json({success:true,data:{order:existing},duplicate:true});
 const tx=client.startSession();let order:any,invoice:any;
 try{await tx.withTransaction(async()=>{
  const requested=items.map((x:any)=>({productId:String(x?.productId||x?.id||"").trim(),quantity:Number(x?.quantity??x?.qty??0)}));if(requested.some(x=>!x.productId||!Number.isInteger(x.quantity)||x.quantity<1||x.quantity>50))throw new Error("INVALID_ITEMS");
  const unique=[...new Set(requested.map(x=>x.productId))];const products=await db.collection("fnb_products").find({$or:unique.map(oid),isActive:{$ne:false}},{session:tx}).toArray();if(products.length!==unique.length)throw new Error("PRODUCT_UNAVAILABLE");const map=new Map(products.map((p:any)=>[String(p.id||p._id),p]));const lines:any[]=[];let subtotal=0;
  for(const x of requested){const p:any=map.get(x.productId);const unit=money(p?.pricePaise??Number(p?.price||0)*100);if(!unit)throw new Error("INVALID_PRICE");const stock=Number(p?.stockQty??p?.inventoryQty??p?.stock??0);if(stock<x.quantity)throw new Error("INSUFFICIENT_STOCK");const amount=unit*x.quantity;subtotal+=amount;lines.push({productId:String(p.id||p._id),name:String(p.name||p.title||"Item"),quantity:x.quantity,unitPricePaise:unit,amountPaise:amount})}
  const tax=money(req.body?.taxPaise),discount=money(req.body?.discountPaise),total=Math.max(0,subtotal+tax-discount),method=String(req.body?.paymentMethod||"CASH").toUpperCase();if(!["CASH","UPI","CARD"].includes(method))throw new Error("INVALID_PAYMENT_METHOD");const now=new Date();
  order={id:id("FNB"),customerId:req.body?.customerId?String(req.body.customerId):null,customerName:String(req.body?.customerName||"Walk-in").slice(0,120),sessionId:req.body?.sessionId?String(req.body.sessionId):null,items:lines,subtotalPaise:subtotal,taxPaise:tax,discountPaise:discount,totalPaise:total,currency:"INR",paymentMethod:method,paymentStatus:"PAID",status:"PLACED",idempotencyKey:key,employeeId:u.id,createdAt:now,updatedAt:now};
  await db.collection("fnb_orders").insertOne(order,{session:tx});for(const line of lines){const r=await db.collection("fnb_products").updateOne({$or:[{id:line.productId},...(ObjectId.isValid(line.productId)?[{_id:new ObjectId(line.productId)}]:[])],isActive:{$ne:false},$expr:{$gte:[{$ifNull:["$stockQty",{$ifNull:["$inventoryQty","$stock"]}]},line.quantity]}},{$inc:{stockQty:-line.quantity},$set:{updatedAt:now}},{session:tx});if(r.modifiedCount!==1)throw new Error("INSUFFICIENT_STOCK")}
  invoice={id:id("INV"),invoiceNumber:`BC-${now.getFullYear()}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`,fnbOrderId:order.id,customerId:order.customerId,customerName:order.customerName,status:"ISSUED",paymentStatus:"PAID",currency:"INR",subtotalPaise:subtotal,taxPaise:tax,discountPaise:discount,totalPaise:total,issuedAt:now,createdAt:now,updatedAt:now,immutable:true,items:lines.map((x:any)=>({description:x.name,quantity:x.quantity,unitAmountPaise:x.unitPricePaise,amountPaise:x.amountPaise}))};await db.collection("invoices").insertOne(invoice,{session:tx});
  await recordFinancialTransaction({id:`SALE:FNB:${order.id}`,type:"SALE",source:"FNB",sourceId:order.id,invoiceId:invoice.id,customerId:order.customerId||undefined,amountPaise:total,currency:"INR",occurredAt:now,createdAt:now,metadata:{paymentMethod:method,employeeId:u.id}},{db,session:tx});
 });}catch(e:any){if(e.message==="INVALID_ITEMS")return fail(res,400,"Invalid order items");if(e.message==="PRODUCT_UNAVAILABLE")return fail(res,409,"One or more F&B items are unavailable");if(e.message==="INVALID_PRICE")return fail(res,409,"One or more F&B prices are invalid");if(e.message==="INSUFFICIENT_STOCK")return fail(res,409,"One or more F&B items are out of stock");if(e.message==="INVALID_PAYMENT_METHOD")return fail(res,400,"Employee F&B payment must be CASH, UPI or CARD");if(e?.code===11000)return fail(res,409,"F&B order already exists for this request");console.error("employee/fnb-financial",e);return fail(res,500,"Unable to create F&B order");}finally{await tx.endSession()}
 await writeAuditLog({actorId:u.id,actorRole:u.role,action:"EMPLOYEE_FNB_FINANCIAL_SETTLED",entityType:"fnb_order",entityId:order.id,metadata:{totalPaise:order.totalPaise,invoiceId:invoice.id}});return res.status(201).json({success:true,data:{order,invoice}});
}
