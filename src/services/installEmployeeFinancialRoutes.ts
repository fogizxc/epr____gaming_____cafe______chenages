import type { Express, RequestHandler } from "express";
import { handleEmployeeWalkInFinancial, handleEmployeeFnbFinancial } from "./productionEmployeeFinancialHandlers.js";

function replaceRoute(app: Express, method: string, path: string, handler: RequestHandler) {
  const router: any = (app as any)._router;
  const stack: any[] = router?.stack || [];
  for (const layer of stack) {
    if (!layer?.route || layer.route.path !== path || !layer.route.methods?.[method]) continue;
    layer.route.stack = layer.route.stack.filter((entry: any) => entry?.name === "apiSecurityPolicy" || entry?.name === "requireAuth" || entry?.name === "requireRole");
    layer.route.stack.push({ handle: handler, name: handler.name || "productionFinancialHandler", keys: [], regexp: /(?:)/, method });
    layer.route._methods = undefined;
    return true;
  }
  return false;
}

export function installEmployeeFinancialRoutes(app: Express) {
  replaceRoute(app, "post", "/api/employee/walk-in", handleEmployeeWalkInFinancial);
  replaceRoute(app, "post", "/api/employee/fnb/order", handleEmployeeFnbFinancial);
}
