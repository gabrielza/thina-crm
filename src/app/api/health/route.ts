import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

/**
 * Health check endpoint — validates the deployed app is functional.
 * GET /api/health
 *
 * Checks:
 * 1. App is running and responding
 * 2. Environment variables are configured
 * 3. Firestore database is reachable
 * 4. Returns app version for deploy verification
 */
export async function GET() {
  const checks: Record<string, { status: "pass" | "fail"; detail?: string }> = {};
  const version = process.env.npm_package_version || "unknown";
  let healthy = true;

  // 1. Environment variables
  const requiredEnvVars = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ];
  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
  if (missingVars.length === 0) {
    checks.envVars = { status: "pass" };
  } else {
    checks.envVars = { status: "fail", detail: `Missing: ${missingVars.join(", ")}` };
    healthy = false;
  }

  // 2. Firestore connectivity — try to read collection count
  try {
    const snapshot = await adminDb.collection("leads").count().get();
    const count = snapshot.data().count;
    checks.firestore = { status: "pass", detail: `leads collection: ${count} documents` };
  } catch (err) {
    checks.firestore = {
      status: "fail",
      detail: err instanceof Error ? err.message : "Unknown Firestore error",
    };
    healthy = false;
  }

  // 3. Project configuration
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  checks.project = {
    status: projectId ? "pass" : "fail",
    detail: projectId || "No project ID",
  };
  if (!projectId) healthy = false;

  const response = {
    status: healthy ? "healthy" : "unhealthy",
    version,
    timestamp: new Date().toISOString(),
    checks,
  };

  return NextResponse.json(response, { status: healthy ? 200 : 503 });
}
