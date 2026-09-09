import crypto from "node:crypto";
import type { Request, Response } from "express";
import { getMongoDb } from "../server/mongodb.js";
import { writeAuditLog } from "../server/domainRepositories.js";
import type { AuthenticatedRequest } from "../server/auth.js";

const fail=(res:Response,status:number,error:string)=>res.status(status).json({success:false,error});
const admin=(req:Request)=>{const u=(req as AuthenticatedRequest).user;return u&&["ADMIN","SUPER_ADMIN"].includes(String(u.role))?u:null};
const clean=(v:unknown,max=500)=>String(v??"").trim().slice(0,max);
const bool=(v:unknown)=>[true,1,"1","true","TRUE","yes","YES","visible","VISIBLE"].includes(v as any);
const slug=(v:string)=>v.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,120);

export async function handleGoogleSheetsSync(req:Request,res:Response){
  const u=admin(req);if(!u)return fail(res,403,"Admin access required");
  const expected=process.env.GOOGLE_SHEETS_WEBHOOK_SECRET?.trim();if(!expected)return fail(res,503,"Google Sheets webhook secret is not configured");
  const supplied=String(req.header("x-google-sheets-secret")||req.header("x-webhook-secret")||"");
  if(!supplied||supplied.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(supplied),Buffer.from(expected)))return fail(res,401,"Invalid sync secret");
  const rows=Array.isArray(req.body?.rows)?req.body.rows:Array.isArray(req.body)?req.body:[];if(rows.length>5000)return fail(res,400,"Maximum 5,000 rows per sync");
  const db=await getMongoDb();const games=db.collection("games"),media=db.collection("game_media");const now=new Date();let upserted=0,hidden=0,skipped=0,mediaUpserted=0;
  for(const raw of rows){
    const title=clean(raw?.title||raw?.name,180);if(!title){skipped++;continue}
    const category=clean(raw?.category||raw?.platform||"PS5",50);const gameSlug=clean(raw?.slug,120)||slug(`${category}-${title}`);if(!gameSlug){skipped++;continue}
    const visible=bool(raw?.isVisible??raw?.visible??raw?.status);
    const gameId=clean(raw?.id,120)||`GAME-${gameSlug}`;
    const doc={id:gameId,slug:gameSlug,title,description:clean(raw?.description,2000),category,isVisible:visible,shortDescription:clean(raw?.shortDescription,500),updatedAt:now,sheetRow:raw?.sheetRow??null,sheetSource:String(req.body?.spreadsheetId||process.env.GOOGLE_SHEETS_SPREADSHEET_ID||"")};
    await games.updateOne({slug:gameSlug},{$set:doc,$setOnInsert:{createdAt:now}},{upsert:true});upserted++;if(!visible)hidden++;
    const cover=clean(raw?.coverPhoto||raw?.coverImage||raw?.coverUrl,1000);const photos=[raw?.image1,raw?.image2,raw?.image3,raw?.image4,raw?.image5].map((x)=>clean(x,1000)).filter(Boolean);const video=clean(raw?.video||raw?.videoUrl||raw?.referenceVideo,1000);
    if(cover||photos.length||video){const m={gameId,slug:gameSlug,coverImage:cover||null,images:photos.slice(0,5),referenceVideo:video||null,updatedAt:now};await media.updateOne({gameId},{$set:m,$setOnInsert:{id:`MEDIA-${gameSlug}`,createdAt:now}},{upsert:true});mediaUpserted++;}
  }
  await writeAuditLog({actorId:u.id,actorRole:u.role,action:"GOOGLE_SHEETS_GAME_SYNC",entityType:"games",entityId:"bulk",metadata:{rows:rows.length,upserted,hidden,skipped,mediaUpserted}});
  return res.json({success:true,data:{rows:rows.length,upserted,hidden,skipped,mediaUpserted,syncedAt:now.toISOString()}});
}

export async function handleAdminGameSyncPreview(req:Request,res:Response){
  const u=admin(req);if(!u)return fail(res,403,"Admin access required");const rows=Array.isArray(req.body?.rows)?req.body.rows:[];if(rows.length>1000)return fail(res,400,"Maximum 1,000 preview rows");
  const preview=rows.map((r:any,i:number)=>{const title=clean(r?.title||r?.name,180);const category=clean(r?.category||r?.platform||"PS5",50);const s=clean(r?.slug,120)||slug(`${category}-${title}`);return {row:i+1,title,category,slug:s,isVisible:bool(r?.isVisible??r?.visible??r?.status),valid:Boolean(title&&s)};});
  return res.json({success:true,data:{valid:preview.filter(x=>x.valid).length,invalid:preview.filter(x=>!x.valid).length,rows:preview}});
}
