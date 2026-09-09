import "dotenv/config";
import { getMongoDb, closeMongoDb } from "../src/server/mongodb.js";
import { hashPassword } from "../src/server/auth.js";

async function main() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const name = process.env.ADMIN_BOOTSTRAP_NAME?.trim() || "Bytes & Brew Administrator";
  const staffCode = process.env.ADMIN_BOOTSTRAP_STAFF_CODE?.trim();

  if (!email || !password || !staffCode) throw new Error("ADMIN_BOOTSTRAP_EMAIL, ADMIN_BOOTSTRAP_PASSWORD and ADMIN_BOOTSTRAP_STAFF_CODE are required");
  if (password.length < 12) throw new Error("Bootstrap admin password must be at least 12 characters");

  const db = await getMongoDb();
  const existing = await db.collection("users").findOne({ $or: [{ email }, { staffCode }] });
  if (existing) {
    console.log("Bootstrap skipped: an account with this email or staff code already exists.");
    return;
  }

  const { hash, salt } = hashPassword(password);
  await db.collection("users").insertOne({
    name,
    email,
    staffCode,
    passwordHash: hash,
    passwordSalt: salt,
    role: "ADMIN",
    permissions: ["admin:*"],
    isActive: true,
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log(`Bootstrap admin created for ${email}. Credentials are read only from environment variables.`);
}

main().catch((error) => { console.error("Admin bootstrap failed:", error); process.exitCode = 1; }).finally(() => closeMongoDb());
