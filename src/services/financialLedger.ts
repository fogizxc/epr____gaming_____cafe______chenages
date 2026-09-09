import type { ClientSession, Db } from "mongodb";
import { getMongoDb } from "../server/mongodb.js";

export type FinancialEntry = {
  id: string;
  type: "SALE" | "REFUND" | "WALLET_CREDIT" | "WALLET_DEBIT" | "CASH_IN" | "CASH_OUT";
  source: "GAMING" | "FNB" | "MEMBERSHIP" | "TOURNAMENT" | "WALLET" | "REFUND" | "CASH";
  sourceId: string;
  customerId?: string;
  paymentId?: string;
  invoiceId?: string;
  amountPaise: number;
  currency: "INR";
  occurredAt: Date;
  createdAt: Date;
  metadata?: Record<string, unknown>;
};

export async function recordFinancialTransaction(entry: FinancialEntry, options?: { db?: Db; session?: ClientSession }) {
  if (!entry.id || !entry.sourceId) throw new Error("FINANCIAL_ENTRY_ID_REQUIRED");
  if (!Number.isSafeInteger(entry.amountPaise) || entry.amountPaise < 0) throw new Error("INVALID_FINANCIAL_AMOUNT");
  const db = options?.db || await getMongoDb();
  try {
    await db.collection("financial_ledger").insertOne({ ...entry, transactionId: entry.id, immutable: true }, { session: options?.session });
  } catch (error: any) {
    if (error?.code === 11000) return { duplicate: true };
    throw error;
  }
  return { duplicate: false };
}

export async function financialEntryExists(id: string, db?: Db) {
  const database = db || await getMongoDb();
  return Boolean(await database.collection("financial_ledger").findOne({ transactionId: id }, { projection: { _id: 1 } }));
}
