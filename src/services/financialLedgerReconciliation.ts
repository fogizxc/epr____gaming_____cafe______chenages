import { getMongoDb } from "../server/mongodb.js";
import { recordFinancialTransaction } from "./financialLedger.js";

const safeAmount=(v:unknown)=>Number.isSafeInteger(Number(v))&&Number(v)>=0?Number(v):0;
const date=(v:unknown,fallback=new Date())=>{const d=v?new Date(String(v)):fallback;return Number.isNaN(d.getTime())?fallback:d;};
let running=false;

export async function reconcileFinancialLedger(){
 if(running)return{created:0,skipped:0,locked:true};
 running=true;
 try{
  const db=await getMongoDb();
  const [payments,refunds,wallet,cash,memberships,fnb]=await Promise.all([
   db.collection("payments").find({status:{$in:["CAPTURED","PAID"]}}).toArray(),
   db.collection("refunds").find({status:"COMPLETED"}).toArray(),
   db.collection("wallet_transactions").find({}).toArray(),
   db.collection("cash_ledger").find({}).toArray(),
   db.collection("customer_memberships").find({status:{$in:["ACTIVE","PAID"]}}).toArray(),
   db.collection("fnb_orders").find({paymentStatus:"PAID"}).toArray(),
  ]);
  let created=0,skipped=0;
  const record=async(entry:any)=>{const result=await recordFinancialTransaction(entry);if(result.duplicate)skipped++;else created++;};
  for(const p of payments){
   const source=p.tournamentTeamId?"TOURNAMENT":p.fnbOrderId?"FNB":p.membershipId?"MEMBERSHIP":"GAMING";
   const sourceId=String(p.tournamentTeamId||p.fnbOrderId||p.membershipId||p.bookingId||p.id);
   const invoice=(await db.collection("invoices").findOne({paymentId:p.id},{projection:{id:1}}))?.id;
   await record({id:`SALE:${p.id}`,type:"SALE",source,sourceId,customerId:p.customerId,paymentId:p.id,invoiceId:invoice,amountPaise:safeAmount(p.amountPaise),currency:"INR",occurredAt:date(p.capturedAt,p.createdAt?date(p.createdAt):new Date()),createdAt:new Date(),metadata:{provider:p.provider,providerPaymentId:p.providerPaymentId,reconciled:true}});
   if(source==="TOURNAMENT"){
    await record({id:`SALE:TOURNAMENT:${sourceId}`,type:"SALE",source:"TOURNAMENT",sourceId,customerId:p.customerId,paymentId:p.id,invoiceId:invoice,amountPaise:safeAmount(p.amountPaise),currency:"INR",occurredAt:date(p.capturedAt,p.createdAt?date(p.createdAt):new Date()),createdAt:new Date(),metadata:{provider:p.provider,providerPaymentId:p.providerPaymentId,canonicalTournamentSale:true,reconciled:true}});
   }
  }
  for(const o of fnb){
   const paidPayment=payments.find((p:any)=>p.fnbOrderId===o.id);
   if(!paidPayment)await record({id:`SALE:FNB:${o.id}`,type:"SALE",source:"FNB",sourceId:o.id,customerId:o.customerId,invoiceId:(await db.collection("invoices").findOne({fnbOrderId:o.id},{projection:{id:1}}))?.id,amountPaise:safeAmount(o.totalPaise),currency:"INR",occurredAt:date(o.paidAt,o.createdAt?date(o.createdAt):new Date()),createdAt:new Date(),metadata:{paymentMethod:o.paymentMethod,reconciled:true}});
  }
  for(const m of memberships){
   const paidPayment=payments.find((p:any)=>p.membershipId===m.id);
   if(!paidPayment)await record({id:`SALE:MEMBERSHIP:${m.id}`,type:"SALE",source:"MEMBERSHIP",sourceId:m.id,customerId:m.customerId,amountPaise:safeAmount(m.pricePaise),currency:"INR",occurredAt:date(m.paidAt,m.createdAt?date(m.createdAt):new Date()),createdAt:new Date(),metadata:{planId:m.planId,reconciled:true}});
  }
  for(const r of refunds)await record({id:`REFUND:${r.id}`,type:"REFUND",source:"REFUND",sourceId:r.id,customerId:r.customerId,amountPaise:safeAmount(r.amountPaise),currency:"INR",occurredAt:date(r.completedAt,r.updatedAt?date(r.updatedAt):new Date()),createdAt:new Date(),metadata:{providerRefundId:r.providerRefundId,bookingId:r.bookingId,fnbOrderId:r.fnbOrderId,reconciled:true}});
  for(const w of wallet){const type=String(w.type).toUpperCase()==="DEBIT"?"WALLET_DEBIT":"WALLET_CREDIT";await record({id:`WALLET:${w.id}`,type,source:"WALLET",sourceId:String(w.id),customerId:w.customerId,amountPaise:safeAmount(w.amountPaise),currency:"INR",occurredAt:date(w.createdAt),createdAt:new Date(),metadata:{source:w.source,orderId:w.orderId,reconciled:true}});}
  for(const c of cash){const type=["OUT","DEBIT","EXPENSE"].includes(String(c.type).toUpperCase())?"CASH_OUT":"CASH_IN";await record({id:`CASH:${c.id||c._id}`,type,source:"CASH",sourceId:String(c.id||c._id),amountPaise:safeAmount(c.amountPaise),currency:"INR",occurredAt:date(c.createdAt),createdAt:new Date(),metadata:{shiftId:c.shiftId,employeeId:c.employeeId,referenceId:c.referenceId,reconciled:true}});}
  return{created,skipped,locked:false};
 }finally{running=false;}
}

export function startFinancialLedgerReconciliation(intervalMs=60000){
 const interval=Math.max(30000,Number(intervalMs)||60000);
 const run=()=>void reconcileFinancialLedger().catch((error)=>console.error("Financial ledger reconciliation failed:",error));
 const timer=setInterval(run,interval);
 timer.unref?.();
 return()=>clearInterval(timer);
}
