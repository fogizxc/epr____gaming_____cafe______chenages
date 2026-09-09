import express from "express";
import { apiSecurityPolicy } from "./security.js";
import { registerAuthRoutes } from "./authRoutes.js";
import { ensureAuthIndexes } from "./auth.js";
import { getMongoDb } from "./mongodb.js";

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
  registerAuthRoutes(this);
  this.get("/api/ready", async (_req: any, res: any) => {
    try {
      const db = await getMongoDb();
      await db.command({ ping: 1 });
      return res.json({ status: "ready", timestamp: new Date().toISOString(), dependencies: { mongodb: "ok" } });
    } catch {
      return res.status(503).json({ status: "not_ready", timestamp: new Date().toISOString(), dependencies: { mongodb: "unavailable" } });
    }
  });
  void ensureAuthIndexes().catch((error) => console.error("Authentication index bootstrap failed:", error));
  return originalListen.apply(this, args);
};
