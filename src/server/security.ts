import type { NextFunction, Request, Response } from "express";
import { requireAuth, requireRole, optionalAuth } from "./auth.js";

const PUBLIC_EXACT = new Set([
  "/api/health",
  "/api/ready",
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/payments/webhook",
  "/api/membership/payment-webhook",
  "/api/fnb/payment-webhook",
  "/api/tournaments/payment-webhook",
  "/api/integrations/google-forms/tournament-response",
  "/api/games",
]);
const PUBLIC_PREFIXES=["/api/games/"];
const CUSTOMER_PREFIXES=["/api/me","/api/stations","/api/bookings","/api/sessions","/api/wallet","/api/membership","/api/rewards","/api/referrals","/api/fnb","/api/support","/api/payments","/api/tournaments"];
const STAFF_PREFIXES=["/api/employee/"];
const ADMIN_PREFIXES=["/api/admin/"];
function startsWithAny(path:string,prefixes:string[]){return prefixes.some(prefix=>path===prefix||path.startsWith(prefix))}

function applyApiSecurityHeaders(req:Request,res:Response){
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("X-Frame-Options","DENY");
  res.setHeader("Referrer-Policy","no-referrer");
  res.setHeader("Permissions-Policy","camera=(), microphone=(), geolocation=()");
  res.setHeader("Cache-Control","no-store");
  const configuredOrigin=process.env.APP_URL?.trim().replace(/\/$/,"");
  const origin=req.header("origin");
  if(configuredOrigin&&origin===configuredOrigin){
    res.setHeader("Access-Control-Allow-Origin",configuredOrigin);
    res.setHeader("Vary","Origin");
    res.setHeader("Access-Control-Allow-Credentials","true");
    res.setHeader("Access-Control-Allow-Headers","Authorization, Content-Type, Idempotency-Key, X-Razorpay-Signature, X-Google-Forms-Secret");
    res.setHeader("Access-Control-Allow-Methods","GET,POST,PUT,PATCH,DELETE,OPTIONS");
  }
}

export function apiSecurityPolicy(req:Request,res:Response,next:NextFunction){
  if(req.path.startsWith("/api/")) applyApiSecurityHeaders(req,res);
  if(req.method==="OPTIONS"&&req.path.startsWith("/api/")) return res.sendStatus(204);
  if(PUBLIC_EXACT.has(req.path)||startsWithAny(req.path,PUBLIC_PREFIXES))return next();
  if(!req.path.startsWith("/api/"))return next();
  if(startsWithAny(req.path,ADMIN_PREFIXES))return requireRole("ADMIN","SUPER_ADMIN")(req as any,res,next);
  if(req.path.startsWith("/api/brevo/")||req.path==="/api/env/status")return requireRole("ADMIN","SUPER_ADMIN")(req as any,res,next);
  if(req.path==="/api/ai/concierge")return requireAuth(req as any,res,next);
  if(startsWithAny(req.path,STAFF_PREFIXES))return requireRole("EMPLOYEE","ADMIN","SUPER_ADMIN")(req as any,res,next);
  if(startsWithAny(req.path,CUSTOMER_PREFIXES))return requireAuth(req as any,res,next);
  return res.status(401).json({success:false,error:"Authentication required"});
}
export function attachOptionalAuth(req:Request,res:Response,next:NextFunction){return optionalAuth(req as any,res,next)}
