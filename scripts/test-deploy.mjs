/**
 * Post-deploy smoke test — validates a live Thina CRM deployment is healthy.
 * Run: npm run test:deploy
 * Or:  node scripts/test-deploy.mjs [url]
 *
 * Checks:
 * 1. /api/health returns 200 with status: "healthy"
 * 2. Firestore is reachable
 * 3. Environment variables are configured
 * 4. Home page returns 200
 */

const DEFAULT_URL = "https://thina-crm--thina-crm.europe-west4.hosted.app";
const baseUrl = process.argv[2] || DEFAULT_URL;

const results = [];
let allPassed = true;

function log(pass, name, detail = "") {
  const icon = pass ? "✅" : "❌";
  const msg = `${icon} ${name}${detail ? ` — ${detail}` : ""}`;
  console.log(msg);
  results.push({ pass, name, detail });
  if (!pass) allPassed = false;
}

async function checkHealth() {
  try {
    const res = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(15000) });
    const data = await res.json();

    log(res.status === 200, "Health endpoint responds", `HTTP ${res.status}`);
    log(data.status === "healthy", "Overall status is healthy", data.status);
    log(data.version !== "unknown", "App version detected", `v${data.version}`);

    if (data.checks) {
      log(data.checks.envVars?.status === "pass", "Environment variables configured");
      log(
        data.checks.firestore?.status === "pass",
        "Firestore database reachable",
        data.checks.firestore?.detail || ""
      );
      log(data.checks.project?.status === "pass", "Firebase project configured", data.checks.project?.detail || "");
    }
  } catch (err) {
    log(false, "Health endpoint responds", err.message);
  }
}

async function checkHomePage() {
  try {
    const res = await fetch(baseUrl, {
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });
    log(res.status === 200 || res.status === 307, "Home page loads", `HTTP ${res.status}`);
  } catch (err) {
    log(false, "Home page loads", err.message);
  }
}

async function checkLoginPage() {
  try {
    const res = await fetch(`${baseUrl}/login`, { signal: AbortSignal.timeout(15000) });
    log(res.status === 200, "Login page loads", `HTTP ${res.status}`);
  } catch (err) {
    log(false, "Login page loads", err.message);
  }
}

// ─── Run all checks ──────────────────────────────────────

console.log(`\n🔍 Post-deploy smoke test: ${baseUrl}\n`);

await checkHealth();
await checkHomePage();
await checkLoginPage();

const passed = results.filter((r) => r.pass).length;
const failed = results.filter((r) => !r.pass).length;

console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${results.length} checks`);

if (!allPassed) {
  console.log("\n⚠️  DEPLOYMENT MAY BE UNHEALTHY — review failed checks above.\n");
  process.exit(1);
} else {
  console.log("\n🎉 Deployment is healthy!\n");
  process.exit(0);
}
