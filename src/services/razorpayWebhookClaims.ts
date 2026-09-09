import type { Db } from "mongodb";

const CLAIM_TIMEOUT_MS = 5 * 60 * 1000;

export type WebhookClaim = {
  duplicate: boolean;
  key: string;
  claimId?: string;
};

/**
 * Atomically claims a Razorpay webhook for processing. A stale PROCESSING claim
 * can be reclaimed after five minutes, allowing provider retries to recover from
 * transient application/database failures without permanently dropping events.
 */
export async function claimRazorpayWebhook(db: Db, key: string, metadata: Record<string, unknown> = {}): Promise<WebhookClaim> {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - CLAIM_TIMEOUT_MS);
  const result = await db.collection("razorpay_webhook_events").findOneAndUpdate(
    {
      key,
      $or: [
        { status: { $exists: false } },
        { status: "FAILED" },
        { status: "PROCESSING", processingAt: { $lt: staleBefore } },
      ],
    },
    {
      $set: {
        status: "PROCESSING",
        processingAt: now,
        lastAttemptAt: now,
        updatedAt: now,
        ...metadata,
      },
      $setOnInsert: { key, receivedAt: now, attempts: 0 },
      $inc: { attempts: 1 },
    },
    { upsert: true, returnDocument: "after" },
  );

  if (result?.value?.status === "PROCESSING" && result.value.processingAt?.getTime?.() === now.getTime()) {
    return { duplicate: false, key, claimId: String(result.value._id) };
  }

  return { duplicate: true, key };
}

export async function completeRazorpayWebhook(db: Db, key: string, metadata: Record<string, unknown> = {}) {
  await db.collection("razorpay_webhook_events").updateOne(
    { key, status: "PROCESSING" },
    { $set: { status: "PROCESSED", processedAt: new Date(), updatedAt: new Date(), ...metadata }, $unset: { processingAt: "" } },
  );
}

export async function failRazorpayWebhook(db: Db, key: string, error: unknown) {
  await db.collection("razorpay_webhook_events").updateOne(
    { key, status: "PROCESSING" },
    { $set: { status: "FAILED", failedAt: new Date(), updatedAt: new Date(), lastError: String((error as any)?.message || error).slice(0, 500) }, $unset: { processingAt: "" } },
  );
}
