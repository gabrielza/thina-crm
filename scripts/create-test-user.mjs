#!/usr/bin/env node
/**
 * Creates an E2E test user in Firebase Auth via the REST API.
 * Usage: node scripts/create-test-user.mjs
 *
 * Reads NEXT_PUBLIC_FIREBASE_API_KEY from .env.local
 */
import { readFileSync } from "fs";
import { randomBytes } from "crypto";

// Read API key from .env.local
const envContent = readFileSync(".env.local", "utf-8");
const apiKeyMatch = envContent.match(/NEXT_PUBLIC_FIREBASE_API_KEY=(.+)/);
if (!apiKeyMatch) {
  console.error("Could not find NEXT_PUBLIC_FIREBASE_API_KEY in .env.local");
  process.exit(1);
}
const apiKey = apiKeyMatch[1].trim();

const email = "e2e-test@thina-crm.test";
const password = "E2eTest!" + randomBytes(4).toString("hex");

async function createUser() {
  console.log(`Creating test user: ${email}`);

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    if (data.error?.message === "EMAIL_EXISTS") {
      console.log("User already exists — deleting and recreating...");
      // Sign in first to get idToken
      const signInRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: "placeholder", returnSecureToken: true }),
        }
      );
      if (!signInRes.ok) {
        console.log("Cannot sign in to existing user. Please delete the user manually in Firebase Console.");
        console.log("Firebase Console → Authentication → Users → search for e2e-test@thina-crm.test");
        process.exit(1);
      }
    } else {
      console.error("Firebase Auth error:", data.error?.message || JSON.stringify(data));
      process.exit(1);
    }
  }

  console.log(`\n✅ Test user created successfully!`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`\nTo run E2E tests (PowerShell):`);
  console.log(`  $env:E2E_EMAIL="${email}"; $env:E2E_PASSWORD="${password}"; npm run test:e2e`);
  console.log(`\nTo run E2E tests (bash):`);
  console.log(`  E2E_EMAIL="${email}" E2E_PASSWORD="${password}" npm run test:e2e`);
}

createUser();
