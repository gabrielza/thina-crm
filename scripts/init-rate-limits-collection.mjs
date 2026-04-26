#!/usr/bin/env node
/**
 * One-off: writes a placeholder doc in the `rateLimits` collection so the
 * Google Cloud TTL policy creator can see the collection in its dropdown.
 *
 * The doc has expiresAt = yesterday, so Firestore's TTL sweep will delete it
 * within ~24h of the policy being created — leaving a clean state.
 */
import { readFileSync } from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const envContent = readFileSync(".env.local", "utf-8");
const m = envContent.match(/FIREBASE_SERVICE_ACCOUNT_KEY=(.+)/);
if (!m) {
  console.error("FIREBASE_SERVICE_ACCOUNT_KEY missing in .env.local");
  process.exit(1);
}
const serviceAccount = JSON.parse(m[1].trim());
initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();
const yesterday = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);

await db.collection("rateLimits").doc("_init").set({
  bucket: "_init",
  key: "_init",
  count: 0,
  windowStart: 0,
  expiresAt: yesterday,
});

console.log("✓ Wrote rateLimits/_init with expiresAt =", yesterday.toDate().toISOString());
console.log("  TTL policy can now find the rateLimits collection in the dropdown.");
process.exit(0);
