import express from "express";
import { apiSecurityPolicy } from "./security.js";

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
