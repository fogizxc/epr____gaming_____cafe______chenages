import express from "express";
import { apiSecurityPolicy } from "./security.js";
import { registerAuthRoutes } from "./authRoutes.js";
import { ensureAuthIndexes } from "./auth.js";

const methods = ["get", "post", "put", "patch", "delete"] as const;

for (const method of methods) {
  const original = (express.application as any)[method];
  if (typeof original !== "function") continue;
  (express.application as any)[method] = function (path: any, ...handlers: any[]) {
    if (typeof path === "string" && path.startsWith("/api/") && !path.startsWith("/api/auth/")) {
      return original.call(this, path, apiSecurityPolicy, ...handlers);
    }
    return original.call(this, path, ...handlers);
  };
}

const originalListen = (express.application as any).listen;
(express.application as any).listen = function (...args: any[]) {
  // Authentication routes are injected once, immediately before the application starts accepting traffic.
  registerAuthRoutes(this);
  void ensureAuthIndexes().catch((error) => {
    console.error("Authentication index bootstrap failed:", error);
    process.exitCode = 1;
  });
  return originalListen.apply(this, args);
};
