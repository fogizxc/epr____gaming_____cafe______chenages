import fs from "node:fs";

const security = fs.readFileSync("src/server/security.ts", "utf8");
const preload = fs.readFileSync("src/server/preload.ts", "utf8");
const authRoutes = fs.readFileSync("src/server/authRoutes.ts", "utf8");
const loginGuard = fs.readFileSync("src/server/loginGuard.ts", "utf8");
const cafeContext = fs.readFileSync("src/context/CafeContext.tsx", "utf8");
const requiredPublic = [
  "/api/health",
  "/api/ready",
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/payments/webhook",
  "/api/membership/payment-webhook",
  "/api/fnb/payment-webhook",
  "/api/tournaments/payment-webhook",
];
const requiredAdmin = ["/api/admin/"];
for (const route of requiredPublic) if (!security.includes(route)) throw new Error(`SECURITY_MISSING_PUBLIC_ROUTE:${route}`);
for (const route of requiredAdmin) if (!security.includes(route)) throw new Error(`SECURITY_MISSING_ADMIN_POLICY:${route}`);
if (!security.includes("Unknown /api/*") && !security.includes("fail closed") && !security.includes("401")) throw new Error("SECURITY_FAIL_CLOSED_POLICY_NOT_DETECTABLE");

const protectedMutations = [
  "POST /api/bookings",
  "POST /api/wallet/debit",
  "POST /api/membership/purchase",
  "POST /api/fnb/orders",
  "POST /api/tournaments/payment-verify",
  "POST /api/employee/walk-in",
  "POST /api/employee/fnb/order",
];
for (const route of protectedMutations) if (!preload.includes(route)) throw new Error(`SECURITY_ROUTE_NOT_WIRED:${route}`);
if (!preload.includes("apiSecurityPolicy")) throw new Error("SECURITY_POLICY_NOT_WIRED");
if (!preload.includes('this.post("/api/integrations/google-sheets/sync",apiSecurityPolicy')) throw new Error("SECURITY_GOOGLE_SHEETS_SYNC_NOT_PROTECTED");

for (const marker of ["randomUUID", "X-Request-ID", "AUTH_RATE_LIMIT", "Retry-After", "req.ip"]) {
  if (!security.includes(marker)) throw new Error(`SECURITY_HARDENING_MISSING:${marker}`);
}
if (security.includes("x-forwarded-for") && !security.includes("req.ip")) throw new Error("SECURITY_CLIENT_IP_MUST_USE_TRUST_PROXY_CONFIGURATION");

for (const marker of ["isLoginBlocked", "recordLoginFailure", "clearLoginFailures", "Too many failed login attempts"]) {
  if (!authRoutes.includes(marker)) throw new Error(`SECURITY_LOGIN_GUARD_NOT_WIRED:${marker}`);
}
for (const marker of ["MAX_FAILURES", "LOCK_MS", "auth_login_guards", "tokenHash", "password"]) {
  if (!loginGuard.includes(marker)) throw new Error(`SECURITY_LOGIN_GUARD_INCOMPLETE:${marker}`);
}
for (const marker of ["REFRESH_COOKIE", "httpOnly: true", "CLIENT_REFRESH_MARKER", "readCookie(req, REFRESH_COOKIE)", "setRefreshCookie(res, refreshToken)", "clearRefreshCookie(res)"]) {
  if (!authRoutes.includes(marker)) throw new Error(`SECURITY_REFRESH_COOKIE_CONTRACT_MISSING:${marker}`);
}
if (!authRoutes.includes('refreshToken: CLIENT_REFRESH_MARKER')) throw new Error("SECURITY_REFRESH_TOKEN_MUST_NOT_BE_RETURNED_TO_BROWSER");
if (cafeContext.includes("password: account.password") || cafeContext.includes("password: account.passwordHash")) {
  throw new Error("SECURITY_CLIENT_ACCOUNT_SYNC_MUST_NOT_EXPORT_PASSWORDS");
}
if (!cafeContext.includes("Account creation is handled by production authentication service")) {
  throw new Error("SECURITY_LEGACY_CLIENT_ACCOUNT_CREATION_NOT_DISABLED");
}

console.log(`Security contract checks passed (${requiredPublic.length} public routes, ${protectedMutations.length} protected mutations, request tracing, auth throttling, login abuse guard, HttpOnly refresh cookies, and credential-sync protection enabled).`);
