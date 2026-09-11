import type { Db } from "mongodb";

export type WebhookClaim = { duplicate: boolean; key: string };

/**
 * Claim a Razorpay webhook before processing it. A failed handler may release
 * the claim so Razorpay can retry safely; successfully processed events remain
 * permanently marked as PROCESSED and are idempotent.
 */
export async function claimRazorpayWebhook(db: Db, key: string, metadata: Record<string, unknown> = {}): Promise<WebhookClaim> {
  const now = new Date();
  try {
    await db.collection("razorpay_webhook_events").insertOne({ key, ...metadata, status: "PROCESSING", receivedAt: now, processingStartedAt: now, attempts: 1 });
    return { duplicate: false, key };
  } catch (error: any) {
    if (error?.code !== 11000) throw error;
    const existing = await db.collection("razorpay_webhook_events").findOne({ key });
    if (!existing) throw error;
    if (existing.status === "PROCESSED") return { duplicate: true, key };
    const claimed = await db.collection("razorpay_webhook_events").findOneAndUpdate(
      { _id: existing._id, status: { $ne: "PROCESSED" }, $or: [{ processingStartedAt: { $exists: false } }, { processingStartedAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } }] },
      { $set: { status: "PROCESSING", processingStartedAt: now, lastAttemptAt: now }, $inc: { attempts: 1 } },
      { returnDocument: "after" },
    );
    return { duplicate: !claimed, key };
  }
}

export async function markRazorpayWebhookProcessed(db: Db, key: string) {
  await db.collection("razorpay_webhook_events").updateOne({ key }, { $set: { status: "PROCESSED", processedAt: new Date() }, $unset: { processingStartedAt: "" } });
}

export async function releaseRazorpayWebhookClaim(db: Db, key: string, error: unknown) {
  await db.collection("razorpay_webhook_events").updateOne({ key, status: "PROCESSING" }, { $set: { status: "FAILED", lastError: String((error as any)?.message || error).slice(0, 500), failedAt: new Date() }, $unset: { processingStartedAt: "" } });
}
