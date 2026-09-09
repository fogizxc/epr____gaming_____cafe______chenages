import express from "express";
import { apiSecurityPolicy } from "./security.js";
import { handleGameCatalog, handleGameCatalogDetail } from "../services/productionGameCatalogHandlers.js";

const originalGet=(express.application as any).get;
if(typeof originalGet==="function"){
  (express.application as any).get=function(path:any,...handlers:any[]){
    if(path==="/api/games") return originalGet.call(this,path,apiSecurityPolicy,handleGameCatalog);
    if(path==="/api/games/:id") return originalGet.call(this,path,apiSecurityPolicy,handleGameCatalogDetail);
    return originalGet.call(this,path,...handlers);
  };
}
