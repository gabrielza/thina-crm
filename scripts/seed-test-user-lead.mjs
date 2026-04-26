#!/usr/bin/env node
/**
 * Seeds a single lead document owned by the E2E test user so UI tests
 * that need at least one row can run.
 * Idempotent: skips if the user already has a lead.
 */
import { readFileSync } from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const envContent = readFileSync(".env.local", "utf-8");
const m = envContent.match(/FIREBASE_SERVICE_ACCOUNT_KEY=(.+)/);
if (!m) {
  console.error("FIREBASE_SERVICE_ACCOUNT_KEY missing in .env.local");
  process.exit(1);
}
const serviceAccount = JSON.parse(m[1].trim());
initializeApp({ credential: cert(serviceAccount) });

const email = "e2e-test@thina-crm.test";
const user = await getAuth().getUserByEmail(email);
const db = getFirestore();

const existing = await db.collection("leads").where("ownerId", "==", user.uid).limit(1).get();
if (!existing.empty) {
  console.log(`Test user already has ${existing.size} lead(s) — nothing to do.`);
  process.exit(0);
}

const ref = await db.collection("leads").add({
  name: "E2E Star Test Lead",
  email: "star-test@example.com",
  phone: "+27821234567",
  company: "E2E Test Co",
  status: "new",
  source: "Website",
  notes: "Seeded for E2E star toggle test.",
  value: 1500000,
  ownerId: user.uid,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
});
console.log(`Created lead ${ref.id} for ${email}`);
