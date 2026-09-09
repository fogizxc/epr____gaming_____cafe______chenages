import crypto from "node:crypto";
import type { Request, Response } from "express";
import { getMongoDb } from "../server/mongodb.js";

const fail=(res:Response,status:number,error:string)=>res.status(status).json({success:false,error});
const text=(v:unknown,max=300)=>String(v??"").trim().slice(0,max);
function verify(req:Request){const secret=process.env.GOOGLE_FORMS_WEBHOOK_SECRET?.trim();const supplied=String(req.header("x-google-forms-secret")||"");if(!secret||supplied.length!==secret.length)return false;return crypto.timingSafeEqual(Buffer.from(secret),Buffer.from(supplied))}
function email(v:unknown){return text(v,160).toLowerCase()}
export async function handleTournamentFormResponse(req:Request,res:Response){
  if(!verify(req))return fail(res,401,"Invalid form integration secret");
  const b=req.body||{},teamId=text(b.teamId||b.registrationId,120),tournamentId=text(b.tournamentId,120),responseId=text(b.responseId||b.timestamp,160);
  if(!teamId||!tournamentId||!responseId)return fail(res,400,"teamId, tournamentId and responseId are required");
  const members=Array.isArray(b.members)?b.members.slice(0,10).map((m:any,i:number)=>({name:text(m?.name,100),email:email(m?.email),phone:text(m?.phone,30),gamerTag:text(m?.gamerTag||m?.username,100),role:i===0?"CAPTAIN":"MEMBER"})).filter((m:any)=>m.name&&m.email):[];
  if(members.length<4)return fail(res,400,"At least 4 valid team members are required");
  const db=await getMongoDb();
  const team=await db.collection("tournament_teams").findOne({id:teamId,tournamentId});
  if(!team)return fail(res,404,"Tournament team not found");
  const update={formResponseId:responseId,formSubmittedAt:new Date(),formVerified:true,formData:{members,submittedAt:text(b.submittedAt||b.timestamp,100)},updatedAt:new Date()};
  await db.collection("tournament_teams").updateOne({id:teamId,tournamentId},{$set:update});
  return res.json({success:true,data:{teamId,tournamentId,responseId,formVerified:true}});
}
