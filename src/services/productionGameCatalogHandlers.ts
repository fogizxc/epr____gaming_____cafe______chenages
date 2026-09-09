import type { Request, Response } from "express";
import { getMongoDb } from "../server/mongodb.js";

const fail=(res:Response,status:number,error:string)=>res.status(status).json({success:false,error});
const text=(v:unknown,max=200)=>String(v??"").trim().slice(0,max);

export async function handleGameCatalog(req:Request,res:Response){
  const db=await getMongoDb();
  const page=Math.max(1,Math.min(10000,Number(req.query.page)||1));
  const limit=Math.max(1,Math.min(48,Number(req.query.limit)||24));
  const category=text(req.query.category,50);
  const search=text(req.query.search,100);
  const filter:any={isVisible:true};
  if(category&&category!=="ALL") filter.category=category;
  if(search){const escaped=search.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");filter.$or=[{title:{$regex:escaped,$options:"i"}},{description:{$regex:escaped,$options:"i"}},{shortDescription:{$regex:escaped,$options:"i"}},{tags:{$regex:escaped,$options:"i"}}]}
  const [items,total,categories]=await Promise.all([
    db.collection("games").find(filter,{projection:{_id:0}}).sort({sortOrder:1,title:1}).skip((page-1)*limit).limit(limit).toArray(),
    db.collection("games").countDocuments(filter),
    db.collection("games").distinct("category",{isVisible:true})
  ]);
  const ids=items.map((g:any)=>String(g.id||g._id));
  const media=ids.length?await db.collection("game_media").find({$or:[{gameId:{$in:ids}},{slug:{$in:items.map((g:any)=>g.slug).filter(Boolean)}}]},{projection:{_id:0}}).toArray():[];
  const byId=new Map<string,any>();for(const m of media){if(m.gameId)byId.set(String(m.gameId),m);if(m.slug)byId.set(`slug:${m.slug}`,m)}
  const data=items.map((g:any)=>{const m=byId.get(String(g.id||g._id))||byId.get(`slug:${g.slug}`);return {...g,media:m?{coverImage:m.coverImage||null,images:Array.isArray(m.images)?m.images.slice(0,5):[],referenceVideo:m.referenceVideo||null}:null}});
  return res.json({success:true,data,pagination:{page,limit,total,totalPages:Math.ceil(total/limit),hasNext:page*limit<total},categories:categories.filter(Boolean).sort()});
}

export async function handleGameCatalogDetail(req:Request,res:Response){
  const key=text(req.params.id||req.params.slug,150);if(!key)return fail(res,400,"Game id or slug is required");const db=await getMongoDb();const game=await db.collection("games").findOne({isVisible:true,$or:[{id:key},{slug:key}]},{projection:{_id:0}});if(!game)return fail(res,404,"Game not found");const media=await db.collection("game_media").findOne({$or:[{gameId:String((game as any).id)},{slug:String((game as any).slug||"")}]},{projection:{_id:0}});return res.json({success:true,data:{...game,media:media?{coverImage:media.coverImage||null,images:Array.isArray(media.images)?media.images.slice(0,5):[],referenceVideo:media.referenceVideo||null}:null}})}
