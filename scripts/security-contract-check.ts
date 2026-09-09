import fs from "node:fs";

const security=fs.readFileSync("src/server/security.ts","utf8");
const preload=fs.readFileSync("src/server/preload.ts","utf8");
const requiredPublic=["/api/health","/api/ready","/api/auth/register","/api/auth/login","/api/auth/refresh","/api/payments/webhook","/api/membership/payment-webhook","/api/fnb/payment-webhook","/api/tournaments/payment-webhook"];
const requiredAdmin=["/api/admin/"];
for(const route of requiredPublic)if(!security.includes(route))throw new Error(`SECURITY_MISSING_PUBLIC_ROUTE:${route}`);
for(const route of requiredAdmin)if(!security.includes(route))throw new Error(`SECURITY_MISSING_ADMIN_POLICY:${route}`);
if(!security.includes("Unknown /api/*" ) && !security.includes("fail closed") && !security.includes("401"))throw new Error("SECURITY_FAIL_CLOSED_POLICY_NOT_DETECTABLE");
const protectedMutations=["POST /api/bookings","POST /api/wallet/debit","POST /api/membership/purchase","POST /api/fnb/orders","POST /api/tournaments/payment-verify","POST /api/employee/walk-in","POST /api/employee/fnb/order"];
for(const route of protectedMutations)if(!preload.includes(route))throw new Error(`SECURITY_ROUTE_NOT_WIRED:${route}`);
if(!preload.includes("apiSecurityPolicy"))throw new Error("SECURITY_POLICY_NOT_WIRED");
console.log(`Security contract checks passed (${requiredPublic.length} public routes, ${protectedMutations.length} protected mutations).`);
