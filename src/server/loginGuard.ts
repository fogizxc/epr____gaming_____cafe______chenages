import type { Db } from "mongodb";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;

function keyPart(value: string) {
  return value.trim().toLowerCase().slice(0, 160);
}

function guardKey(identifier: string, ip: string) {
  return `${keyPart(identifier)}:${keyPart(ip || "unknown")}`;
}

/**
 * Mongo-backed login abuse protection so the limit works across multiple app instances.
 * Failure records contain no password/token material.
 */
export async function ensureLoginGuardIndexes(db: Db) {
  await db.collection("auth_login_guards").createIndex({ key: 1 }, { unique: true });
  await db.collection("auth_login_guards").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}

export async function isLoginBlocked(db: Db, identifier: string, ip: string) {
  const key = guardKey(identifier, ip);
  const record = await db.collection("auth_login_guards").findOne({ key });
  if (!record) return false;
  const now = Date.now();
  if (record.expiresAt instanceof Date && record.expiresAt.getTime() <= now) return false;
  return typeof record.lockedUntil === "number" && record.lockedUntil > now;
}

export async function recordLoginFailure(db: Db, identifier: string, ip: string) {
  const key = guardKey(identifier, ip);
  const now = new Date();
  const collection = db.collection("auth_login_guards");
  const existing = await collection.findOne({ key });

  if (!existing || !(existing.windowStartedAt instanceof Date) || now.getTime() - existing.windowStartedAt.getTime() >= WINDOW_MS) {
    await collection.updateOne(
      { key },
      { $set: { key, failures: 1, windowStartedAt: now, lockedUntil: null, expiresAt: new Date(now.getTime() + WINDOW_MS) } },
      { upsert: true },
    );
    return;
  }

  const failures = Number(existing.failures || 0) + 1;
  const lockedUntil = failures >= MAX_FAILURES ? now.getTime() + LOCK_MS : null;
  await collection.updateOne(
    { key },
    { $set: { failures, lockedUntil, expiresAt: new Date(now.getTime() + WINDOW_MS) } },
  );
}

export async function clearLoginFailures(db: Db, identifier: string, ip: string) {
  await db.collection("auth_login_guards").deleteOne({ key: guardKey(identifier, ip) });
}
