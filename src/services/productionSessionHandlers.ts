import crypto from "node:crypto";
import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import type { AuthenticatedRequest } from "../server/auth.js";
import { getMongoDb, getMongoClient } from "../server/mongodb.js";
import { writeAuditLog } from "../server/domainRepositories.js";

const UPCOMING = "UPCOMING";
const ACTIVE = "ACTIVE";
const COMPLETED = "COMPLETED";
const CANCELLED = "CANCELLED";
const NO_SHOW = "NO-SHOW";
const STATION_AVAILABLE = "AVAILABLE";
const STATION_ACTIVE = "ACTIVE";
const STATION_RESERVED = "RESERVED";
const CHECKIN_GRACE_MINUTES = 15;

function errorResponse(res: Response, status: number, error: string, extra?: Record<string, unknown>) {
  return res.status(status).json({ success: false, error, ...(extra || {}) });
}
function getUser(req: Request) { return (req as AuthenticatedRequest).user; }
function parseId(req: Request) { return String(req.params.id || req.params.sessionId || "").trim(); }
function timeToMinutes(value: string) { if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null; const [h,m] = value.split(":").map(Number); return h*60+m; }
function bookingDateTime(date: string, time: string) { return new Date(`${date}T${time}:00+05:30`); }
function nowIso() { return new Date().toISOString(); }
async function findBooking(db: any, id: string, customerId: string) {
  return db.collection("bookings").findOne({ $or: [{ id }, ...(ObjectId.isValid(id) ? [{ _id: new ObjectId(id) }] : [])], customerId });
}

async function consumeMembershipForBooking(db: any, tx: any, booking: any, customerId: string) {
  if (String(booking.paymentMethod) !== "Membership") return null;
  const hours = Number(booking.durationHours || 0);
  const vip = /vip/i.test(String(booking.service || "")) || /vip/i.test(String(booking.systemName || ""));
  if (!Number.isFinite(hours) || hours <= 0) throw new Error("INVALID_MEMBERSHIP_USAGE");
  const membership = await db.collection("customer_memberships").findOne({ customerId, status: "ACTIVE", expiresAt: { $gt: new Date() } }, { session: tx, sort: { expiresAt: -1 } });
  if (!membership) throw new Error("MEMBERSHIP_NOT_ACTIVE");
  const field = vip ? "vipHoursRemaining" : "normalHoursRemaining";
  const updated = await db.collection("customer_memberships").findOneAndUpdate({ _id: membership._id, customerId, status: "ACTIVE", expiresAt: { $gt: new Date() }, [field]: { $gte: hours } }, { $inc: { [field]: -hours }, $set: { updatedAt: new Date() } }, { session: tx, returnDocument: "after" });
  if (!updated) throw new Error("INSUFFICIENT_MEMBERSHIP_HOURS");
  await db.collection("wallet_transactions").insertOne({ id: `MEMUSE-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`, customerId, type: "MEMBERSHIP_USAGE", amountPaise: 0, hours, vip, membershipId: membership.id, bookingId: booking.id, source: "MEMBERSHIP", currency: "INR", idempotencyKey: `CHECKIN:${booking.id}`, createdAt: new Date() }, { session: tx });
  return { membershipId: membership.id, hours, vip };
}

async function issueSessionInvoice(db: any, sessionRecord: any, booking: any) {
  const existing = await db.collection("invoices").findOne({ bookingId: booking.id, status: { $ne: "VOID" } });
  if (existing) return existing;
  const totalPaise = String(booking.paymentMethod) === "Membership" ? 0 : Number(booking.finalAmountPaise ?? booking.totalAmountPaise ?? (Number(booking.finalAmount ?? 0) * 100));
  if (!Number.isSafeInteger(totalPaise) || totalPaise < 0) return null;
  const now = new Date();
  const invoice = {
    id: `INV-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`,
    invoiceNumber: `BC-${now.getFullYear()}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`,
    bookingId: booking.id, customerId: booking.customerId, paymentId: booking.paymentId || null,
    sessionId: sessionRecord.id, status: "ISSUED", paymentStatus: String(booking.paymentMethod) === "Membership" ? "PAID_MEMBERSHIP" : "PAID",
    currency: "INR", subtotalPaise: Number(booking.subtotalPaise || totalPaise), taxPaise: Number(booking.taxPaise || 0), discountPaise: Number(booking.discountPaise || 0), totalPaise,
    issuedAt: now, createdAt: now, updatedAt: now, immutable: true,
    items: [{ description: `${booking.service || "Gaming"} session${booking.gameTitle ? ` — ${booking.gameTitle}` : ""}`, quantity: 1, unitAmountPaise: totalPaise, amountPaise: totalPaise, durationHours: Number(booking.durationHours || 0), stationId: booking.systemId, membershipUsedHours: Number(booking.membershipUsedHours || 0), vipMembershipUsedHours: Number(booking.vipMembershipUsedHours || 0) }]
  };
  try { await db.collection("invoices").insertOne(invoice); } catch (e: any) { if (e?.code === 11000) return db.collection("invoices").findOne({ bookingId: booking.id }); throw e; }
  await writeAuditLog({ actorId: booking.customerId, action: "INVOICE_ISSUED_SESSION_END", entityType: "invoice", entityId: invoice.id, metadata: { bookingId: booking.id, sessionId: sessionRecord.id, totalPaise } });
  return invoice;
}

export async function handleProductionCheckInBooking(req: Request, res: Response) {
  const user = getUser(req); if (!user) return errorResponse(res, 401, "Authentication required");
  const bookingId = parseId(req); if (!bookingId) return errorResponse(res, 400, "Booking id is required");
  try {
    const result = await (async () => {
      const client = getMongoClient(); if (!client) throw new Error("MONGO_TX_UNAVAILABLE");
      return client.withSession ? null : null;
    })().catch(() => null);
    const txResult = await (async () => {
      const db = await getMongoDb(); const client = getMongoClient(); if (!client) throw new Error("MONGO_TX_UNAVAILABLE");
      const tx = client.startSession();
      try {
        let output: any;
        await tx.withTransaction(async () => {
          const booking = await findBooking(db, bookingId, user.id);
          if (!booking) throw new Error("BOOKING_NOT_FOUND");
          if (booking.bookingStatus === ACTIVE) { output = { booking, session: await db.collection("active_sessions").findOne({ bookingId: booking.id }, { session: tx }), duplicate: true }; return; }
          if (booking.bookingStatus !== UPCOMING) throw new Error("BOOKING_NOT_CHECKINABLE");
          const scheduledStart = bookingDateTime(String(booking.date), String(booking.startTime));
          const scheduledEnd = bookingDateTime(String(booking.date), String(booking.endTime));
          const now = new Date();
          if (now.getTime() < scheduledStart.getTime() - CHECKIN_GRACE_MINUTES * 60000) throw new Error("TOO_EARLY");
          if (now.getTime() >= scheduledEnd.getTime()) throw new Error("BOOKING_EXPIRED");
          if (!["PAID", "Membership"].includes(String(booking.paymentStatus)) && String(booking.paymentMethod) !== "Membership") throw new Error("BOOKING_UNPAID");
          const station = await db.collection("gaming_systems").findOneAndUpdate({ id: booking.systemId, status: { $in: [STATION_AVAILABLE, STATION_RESERVED] } }, { $set: { status: STATION_ACTIVE, activeBookingId: booking.id, updatedAt: now }, $inc: { bookingVersion: 1 } }, { session: tx, returnDocument: "after" });
          if (!station) throw new Error("STATION_UNAVAILABLE");
          const membershipUsage = await consumeMembershipForBooking(db, tx, booking, user.id);
          const actualEnd = new Date(now.getTime() + Number(booking.durationHours || 0) * 3600000);
          const activeSession = { id: `SS-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`, bookingId: booking.id, customerId: user.id, systemId: booking.systemId, systemName: booking.systemName, service: booking.service, gameTitle: booking.gameTitle, startedAt: now, scheduledStartAt: scheduledStart, scheduledEndAt: actualEnd < scheduledEnd ? actualEnd : scheduledEnd, originalScheduledEndAt: scheduledEnd, status: ACTIVE, extensionMinutes: 0, transferCount: 0, membershipId: membershipUsage?.membershipId || null, membershipHoursUsed: membershipUsage?.hours || 0, vipMembershipHoursUsed: membershipUsage?.vip ? membershipUsage.hours : 0, createdAt: now, updatedAt: now };
          await db.collection("active_sessions").insertOne(activeSession, { session: tx });
          const bookingUpdate: any = { bookingStatus: ACTIVE, checkedInAt: nowIso(), updatedAt: now };
          if (membershipUsage) { bookingUpdate.paymentStatus = "PAID"; bookingUpdate.membershipId = membershipUsage.membershipId; bookingUpdate.membershipUsedHours = membershipUsage.vip ? 0 : membershipUsage.hours; bookingUpdate.vipMembershipUsedHours = membershipUsage.vip ? membershipUsage.hours : 0; bookingUpdate.paidAt = nowIso(); }
          await db.collection("bookings").updateOne({ _id: booking._id, bookingStatus: UPCOMING }, { $set: bookingUpdate }, { session: tx });
          output = { booking: { ...booking, ...bookingUpdate }, session: activeSession, duplicate: false };
        });
        return output;
      } finally { await tx.endSession(); }
    })();
    if (!txResult) throw new Error("CHECKIN_FAILED");
    if (!txResult.duplicate) await writeAuditLog({ actorId: user.id, actorRole: user.role, action: "BOOKING_CHECKED_IN", entityType: "booking", entityId: txResult.booking.id, metadata: { sessionId: txResult.session?.id, membershipId: txResult.booking.membershipId || null } });
    return res.json({ success: true, booking: txResult.booking, session: txResult.session, duplicate: txResult.duplicate });
  } catch (error: any) {
    if (error.message === "BOOKING_NOT_FOUND") return errorResponse(res, 404, "Booking not found");
    if (error.message === "BOOKING_NOT_CHECKINABLE") return errorResponse(res, 409, "Booking cannot be checked in from its current state");
    if (error.message === "TOO_EARLY") return errorResponse(res, 409, `Check-in opens ${CHECKIN_GRACE_MINUTES} minutes before the booking`);
    if (error.message === "BOOKING_EXPIRED") return errorResponse(res, 409, "This booking has expired");
    if (error.message === "BOOKING_UNPAID") return errorResponse(res, 402, "Payment is required before check-in");
    if (error.message === "MEMBERSHIP_NOT_ACTIVE") return errorResponse(res, 409, "Membership is not active");
    if (error.message === "INSUFFICIENT_MEMBERSHIP_HOURS") return errorResponse(res, 409, "Insufficient membership hours");
    if (error.message === "STATION_UNAVAILABLE") return errorResponse(res, 409, "Station is no longer available");
    if (error.message === "MONGO_TX_UNAVAILABLE") return errorResponse(res, 503, "MongoDB transaction support is unavailable");
    console.error("booking/check-in", error); return errorResponse(res, 500, "Unable to check in booking");
  }
}

export async function handleProductionCancelBooking(req: Request, res: Response) {
  const user = getUser(req); if (!user) return errorResponse(res, 401, "Authentication required"); const bookingId = parseId(req); if (!bookingId) return errorResponse(res, 400, "Booking id is required");
  try {
    const db = await getMongoDb(); const result = await db.collection("bookings").findOneAndUpdate({ $or: [{ id: bookingId }, ...(ObjectId.isValid(bookingId) ? [{ _id: new ObjectId(bookingId) }] : [])], customerId: user.id, bookingStatus: UPCOMING }, { $set: { bookingStatus: CANCELLED, cancelledAt: nowIso(), cancelReason: String(req.body?.reason || "Customer cancellation").slice(0,250), updatedAt: new Date() } }, { returnDocument: "after" });
    if (!result) { const existing = await findBooking(db, bookingId, user.id); if (!existing) return errorResponse(res,404,"Booking not found"); if (existing.bookingStatus === CANCELLED) return res.json({ success:true, booking:existing, duplicate:true }); return errorResponse(res,409,"Only upcoming bookings can be cancelled"); }
    await writeAuditLog({ actorId:user.id, actorRole:user.role, action:"BOOKING_CANCELLED", entityType:"booking", entityId:result.id, metadata:{reason:result.cancelReason} });
    return res.json({success:true,booking:result});
  } catch (error) { console.error("booking/cancel",error); return errorResponse(res,500,"Unable to cancel booking"); }
}

export async function handleProductionExtendSession(req: Request, res: Response) {
  const user = getUser(req); if (!user) return errorResponse(res,401,"Authentication required"); const sessionId=parseId(req); const minutes=Number(req.body?.minutes ?? req.body?.extensionMinutes);
  if (!sessionId || !Number.isInteger(minutes) || minutes<30 || minutes>360 || minutes%30!==0) return errorResponse(res,400,"Extension must be 30–360 minutes in 30-minute increments");
  try {
    const db=await getMongoDb(); const client=getMongoClient(); if(!client) return errorResponse(res,503,"MongoDB transaction support is unavailable"); const tx=client.startSession(); let result:any;
    try { await tx.withTransaction(async()=>{ const active=await db.collection("active_sessions").findOne({id:sessionId,customerId:user.id,status:ACTIVE},{session:tx}); if(!active) throw new Error("SESSION_NOT_FOUND"); const currentEnd=new Date(active.scheduledEndAt); const proposedEnd=new Date(currentEnd.getTime()+minutes*60000); const date=String(active.originalScheduledEndAt ? new Date(active.originalScheduledEndAt).toISOString().slice(0,10) : new Date(currentEnd).toISOString().slice(0,10)); const endTime=proposedEnd.toISOString().slice(11,16); const currentTime=currentEnd.toISOString().slice(11,16); const conflict=await db.collection("bookings").findOne({systemId:active.systemId,date,bookingStatus:UPCOMING,startTime:{ $lt:endTime },endTime:{ $gt:currentTime },id:{$ne:active.bookingId}},{session:tx}); if(conflict) throw new Error("EXTENSION_CONFLICT"); result=await db.collection("active_sessions").findOneAndUpdate({_id:active._id,status:ACTIVE},{ $set:{scheduledEndAt:proposedEnd,updatedAt:new Date()},$inc:{extensionMinutes:minutes}},{session:tx,returnDocument:"after"}); if(!result) throw new Error("SESSION_STATE_RACE"); }); } finally { await tx.endSession(); }
    await writeAuditLog({actorId:user.id,actorRole:user.role,action:"SESSION_EXTENDED",entityType:"active_session",entityId:result.id,metadata:{minutes}}); return res.json({success:true,session:result});
  } catch(error:any){ if(error.message==="SESSION_NOT_FOUND") return errorResponse(res,404,"Active session not found"); if(error.message==="EXTENSION_CONFLICT") return errorResponse(res,409,"The requested extension conflicts with another booking"); if(error.message==="SESSION_STATE_RACE") return errorResponse(res,409,"Session was changed by another request"); console.error("session/extend",error); return errorResponse(res,500,"Unable to extend session"); }
}

export async function handleProductionEndSession(req: Request, res: Response) {
  const user=getUser(req); if(!user) return errorResponse(res,401,"Authentication required"); const sessionId=parseId(req); if(!sessionId) return errorResponse(res,400,"Session id is required");
  try { const db=await getMongoDb(); const client=getMongoClient(); if(!client) return errorResponse(res,503,"MongoDB transaction support is unavailable"); const tx=client.startSession(); let result:any; let booking:any;
    try { await tx.withTransaction(async()=>{ const active=await db.collection("active_sessions").findOne({id:sessionId,customerId:user.id,status:ACTIVE},{session:tx}); if(!active) throw new Error("SESSION_NOT_FOUND"); booking=await db.collection("bookings").findOne({id:active.bookingId,customerId:user.id},{session:tx}); if(!booking) throw new Error("BOOKING_NOT_FOUND"); const now=new Date(); result=await db.collection("active_sessions").findOneAndUpdate({_id:active._id,status:ACTIVE},{ $set:{status:COMPLETED,endedAt:now,updatedAt:now}},{session:tx,returnDocument:"after"}); if(!result) throw new Error("SESSION_STATE_RACE"); await db.collection("bookings").updateOne({id:active.bookingId,bookingStatus:ACTIVE},{ $set:{bookingStatus:COMPLETED,completedAt:now.toISOString(),actualEndAt:now.toISOString(),updatedAt:now}},{session:tx}); await db.collection("gaming_systems").updateOne({id:active.systemId,activeBookingId:active.bookingId},{ $set:{status:STATION_AVAILABLE,updatedAt:now},$unset:{activeBookingId:""},$inc:{bookingVersion:1}},{session:tx}); }); } finally { await tx.endSession(); }
    const invoice=await issueSessionInvoice(db,result,booking); await writeAuditLog({actorId:user.id,actorRole:user.role,action:"SESSION_ENDED",entityType:"active_session",entityId:result.id,metadata:{invoiceId:invoice?.id || null}}); return res.json({success:true,session:result,invoice});
  } catch(error:any){ if(error.message==="SESSION_NOT_FOUND") return errorResponse(res,404,"Active session not found"); if(error.message==="BOOKING_NOT_FOUND") return errorResponse(res,404,"Booking not found"); if(error.message==="SESSION_STATE_RACE") return errorResponse(res,409,"Session was changed by another request"); console.error("session/end",error); return errorResponse(res,500,"Unable to end session"); }
}

export async function handleProductionMyActiveSession(req: Request,res: Response){ const user=getUser(req); if(!user)return errorResponse(res,401,"Authentication required"); try{ const active=await (await getMongoDb()).collection("active_sessions").findOne({customerId:user.id,status:ACTIVE},{sort:{startedAt:-1}}); if(!active)return res.json({success:true,session:null}); const remainingMs=Math.max(0,new Date(active.scheduledEndAt).getTime()-Date.now()); return res.json({success:true,session:active,remainingSeconds:Math.floor(remainingMs/1000),remainingMinutes:Math.ceil(remainingMs/60000)}); }catch(error){console.error("session/me",error);return errorResponse(res,503,"Session status temporarily unavailable");} }
