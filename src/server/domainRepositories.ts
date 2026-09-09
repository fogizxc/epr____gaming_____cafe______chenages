import { ClientSession, Db, ObjectId } from "mongodb";
import { getMongoDb } from "./mongodb.js";

export type DomainCollection =
  | "users" | "gaming_systems" | "games" | "game_media" | "bookings" | "active_sessions"
  | "membership_plans" | "customer_memberships" | "wallet_accounts" | "wallet_transactions"
  | "invoices" | "payments" | "fnb_products" | "fnb_orders" | "tournaments"
  | "tournament_teams" | "tournament_matches" | "waitlist" | "maintenance_tickets"
  | "support_tickets" | "refunds" | "employee_shifts" | "cash_ledger" | "pricing_rules"
  | "price_history" | "promotion_codes" | "audit_logs" | "business_settings";

type DomainDocument = Record<string, any>;

export async function collection<T extends DomainDocument>(name: DomainCollection) {
  const db = await getMongoDb();
  return db.collection<T>(name);
}

export async function findById<T extends DomainDocument>(name: DomainCollection, id: string) {
  const col = await collection<T>(name);
  const query: any = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };
  return col.findOne(query);
}

export async function findMany<T extends DomainDocument>(name: DomainCollection, filter: Record<string, any> = {}, options?: { limit?: number; skip?: number; sort?: Record<string, 1 | -1> }) {
  const col = await collection<T>(name);
  let cursor = col.find(filter as any);
  if (options?.sort) cursor = cursor.sort(options.sort);
  if (options?.skip) cursor = cursor.skip(options.skip);
  if (options?.limit) cursor = cursor.limit(Math.min(options.limit, 500));
  return cursor.toArray();
}

export async function insertOne<T extends DomainDocument>(name: DomainCollection, document: T, session?: ClientSession) {
  const col = await collection<T>(name);
  const result = await col.insertOne(document as any, session ? { session } : undefined);
  return { ...document, _id: result.insertedId } as T;
}

export async function updateById<T extends DomainDocument>(name: DomainCollection, id: string, update: Record<string, any>, session?: ClientSession) {
  const col = await collection<T>(name);
  const query: any = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };
  return col.updateOne(query, update as any, session ? { session } : undefined);
}

export async function withTransaction<T>(work: (db: Db, session: ClientSession) => Promise<T>) {
  const db = await getMongoDb();
  const session = db.client.startSession();
  try {
    return await session.withTransaction(() => work(db, session), {
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
      maxCommitTimeMS: 10000,
    });
  } finally {
    await session.endSession();
  }
}

export async function reserveBookingAtomic<T extends DomainDocument>(booking: T, systemId: string, date: string, startTime: string, endTime: string) {
  return withTransaction(async (db, session) => {
    const systems = db.collection("gaming_systems");
    const bookings = db.collection<T>("bookings");
    const station = await systems.findOneAndUpdate(
      { id: systemId, status: { $nin: ["MAINTENANCE", "OFFLINE"] } },
      { $inc: { bookingVersion: 1 } },
      { session, returnDocument: "after" }
    );
    if (!station) throw new Error("STATION_UNAVAILABLE");
    const conflict = await bookings.findOne({ systemId, date, bookingStatus: { $in: ["UPCOMING", "ACTIVE"] }, startTime: { $lt: endTime }, endTime: { $gt: startTime } } as any, { session });
    if (conflict) throw new Error("BOOKING_CONFLICT");
    const result = await bookings.insertOne(booking as any, { session });
    return { ...booking, _id: result.insertedId } as T;
  });
}

export async function writeAuditLog(input: { actorId?: string; actorRole?: string; action: string; entityType: string; entityId?: string; metadata?: Record<string, unknown> }) {
  return insertOne("audit_logs", { ...input, createdAt: new Date() });
}
