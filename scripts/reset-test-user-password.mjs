#!/usr/bin/env node
/**
 * Resets the E2E test user password to a known value via firebase-admin.
 * Idempotent: creates the user if missing.
 * Usage: node scripts/reset-test-user-password.mjs
 */
import { readFileSync } from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const envContent = readFileSync(".env.local", "utf-8");
const m = envContent.match(/FIREBASE_SERVICE_ACCOUNT_KEY=(.+)/);
if (!m) {
  console.error("FIREBASE_SERVICE_ACCOUNT_KEY missing in .env.local");
  process.exit(1);
}
const serviceAccount = JSON.parse(m[1].trim());

initializeApp({ credential: cert(serviceAccount) });

const email = "e2e-test@thina-crm.test";
const password = "E2eTestPass123!";

try {
  let user;
  try {
    user = await getAuth().getUserByEmail(email);
    await getAuth().updateUser(user.uid, { password, emailVerified: true });
    console.log(`Updated existing user ${email}`);
  } catch (e) {
    if (e.code === "auth/user-not-found") {
      user = await getAuth().createUser({ email, password, emailVerified: true });
      console.log(`Created new user ${email}`);
    } else {
      throw e;
    }
  }
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log(`UID:      ${user.uid}`);
  process.exit(0);
} catch (e) {
  console.error("Failed:", e.message);
  process.exit(1);
}
