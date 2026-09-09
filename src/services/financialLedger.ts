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

export async function recordFinancialTransaction(entry: FinancialEntry) {
  if (!entry.id || !entry.sourceId) throw new Error("FINANCIAL_ENTRY_ID_REQUIRED");
  if (!Number.isSafeInteger(entry.amountPaise) || entry.amountPaise < 0) throw new Error("INVALID_FINANCIAL_AMOUNT");
  const db = await getMongoDb();
  try {
    await db.collection("financial_ledger").insertOne({ ...entry, immutable: true });
  } catch (error: any) {
    if (error?.code === 11000) return { duplicate: true };
    throw error;
  }
  return { duplicate: false };
}

export async function financialEntryExists(id: string) {
  const db = await getMongoDb();
  return Boolean(await db.collection("financial_ledger").findOne({ id }, { projection: { _id: 1 } }));
}
