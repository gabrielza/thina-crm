#!/usr/bin/env node
/**
 * scripts/cost-report.mjs
 *
 * Pulls Google Cloud spend for the Thina CRM project from the BigQuery
 * billing export and prints a per-service breakdown for:
 *   - Month-to-date (current calendar month, project timezone Africa/Johannesburg)
 *   - Last 7 days
 *
 * Required env vars (.env.local):
 *   GCP_BILLING_PROJECT_ID   GCP project that owns the billing export dataset
 *                            (often the same as your billing-admin project)
 *   GCP_BILLING_DATASET      BigQuery dataset name (e.g. "billing_export")
 *   GCP_BILLING_TABLE        Table name. Standard export is
 *                            "gcp_billing_export_v1_<BILLING_ACCOUNT_ID>"
 *                            with dashes replaced by underscores.
 *
 * Optional:
 *   GCP_PROJECT_FILTER       Limit to a specific project (defaults to "thina-crm")
 *   --save                   Also write a markdown report to docs/billing/
 *
 * Auth: uses Application Default Credentials. Run once locally:
 *   gcloud auth application-default login
 *
 * Note on freshness: Google's billing export pipeline lands data with a
 * ~24h delay. There is NO real-time cost API. "MTD" here therefore means
 * "as of the most recent export, ~yesterday".
 *
 * See docs/billing/SETUP.md for the one-time GCP setup.
 */

import { BigQuery } from "@google-cloud/bigquery";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

// ─── Load .env.local manually (avoid adding dotenv just for a script) ─────
function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvFile(join(REPO_ROOT, ".env.local"));

// ─── Config ───────────────────────────────────────────────────────────────
const PROJECT = process.env.GCP_BILLING_PROJECT_ID;
const DATASET = process.env.GCP_BILLING_DATASET;
const TABLE = process.env.GCP_BILLING_TABLE;
const PROJECT_FILTER = process.env.GCP_PROJECT_FILTER || "thina-crm";
const SAVE = process.argv.includes("--save");

if (!PROJECT || !DATASET || !TABLE) {
  console.error("\n❌ Missing config. Add to .env.local:");
  console.error("   GCP_BILLING_PROJECT_ID=your-project-id");
  console.error("   GCP_BILLING_DATASET=billing_export");
  console.error("   GCP_BILLING_TABLE=gcp_billing_export_v1_XXXXXX_XXXXXX_XXXXXX");
  console.error("\nSee docs/billing/SETUP.md for one-time setup steps.\n");
  process.exit(1);
}

const FQN = `\`${PROJECT}.${DATASET}.${TABLE}\``;

// ─── Helpers ──────────────────────────────────────────────────────────────
const fmtUsd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const fmtZar = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" });

function printTable(title, rows) {
  console.log(`\n━━━ ${title} ━━━`);
  if (rows.length === 0) {
    console.log("  (no charges)");
    return;
  }
  const nameW = Math.max(...rows.map((r) => r.service.length), 8);
  console.log(`  ${"Service".padEnd(nameW)}  ${"Cost (USD)".padStart(12)}`);
  console.log(`  ${"-".repeat(nameW)}  ${"-".repeat(12)}`);
  let total = 0;
  for (const r of rows) {
    total += r.cost;
    console.log(`  ${r.service.padEnd(nameW)}  ${fmtUsd.format(r.cost).padStart(12)}`);
  }
  console.log(`  ${"-".repeat(nameW)}  ${"-".repeat(12)}`);
  console.log(`  ${"TOTAL".padEnd(nameW)}  ${fmtUsd.format(total).padStart(12)}  (~${fmtZar.format(total * 18.5)})`);
  return total;
}

// ─── Queries ──────────────────────────────────────────────────────────────
// The standard billing export schema is documented at:
//   https://cloud.google.com/billing/docs/how-to/export-data-bigquery-tables/standard-usage
//
// Cost is `cost` (gross). Credits are in the `credits` ARRAY — sum them and add
// to get net cost. We multiply by -1 because credit amounts are negative.
const NET_COST_EXPR = `
  SUM(cost) +
  SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0))
`;

function buildQuery({ since, label }) {
  return `
    SELECT
      service.description AS service,
      ROUND(${NET_COST_EXPR}, 4) AS cost
    FROM ${FQN}
    WHERE project.id = @projectId
      AND usage_start_time >= @since
    GROUP BY service
    HAVING cost > 0.0001
    ORDER BY cost DESC
  `;
}

async function runQuery(bq, query, params) {
  try {
    const [rows] = await bq.query({ query, params, location: "US" });
    return rows.map((r) => ({ service: r.service, cost: Number(r.cost) }));
  } catch (err) {
    if (err.message?.includes("Not found: Table") || err.message?.includes("Not found: Dataset")) {
      console.error(`\n❌ Billing export table not found: ${FQN}`);
      console.error("   This usually means the BigQuery billing export hasn't been enabled yet,");
      console.error("   or it's still backfilling (~24h after first enabling).");
      console.error("   See docs/billing/SETUP.md\n");
      process.exit(2);
    }
    throw err;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n📊 Google Cloud cost report — project: ${PROJECT_FILTER}`);
  console.log(`   Source: ${FQN}`);
  console.log(`   Note: billing data lags ~24h. Real-time spend is not available from any Google API.\n`);

  const bq = new BigQuery({ projectId: PROJECT });

  // First day of current month, UTC. Billing export usage_start_time is UTC.
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const mtdRows = await runQuery(
    bq,
    buildQuery({ since: monthStart, label: "MTD" }),
    { projectId: PROJECT_FILTER, since: monthStart.toISOString() }
  );
  const weekRows = await runQuery(
    bq,
    buildQuery({ since: sevenDaysAgo, label: "7d" }),
    { projectId: PROJECT_FILTER, since: sevenDaysAgo.toISOString() }
  );

  const mtdTotal = printTable(`Month-to-date (${monthStart.toISOString().slice(0, 10)} → today)`, mtdRows);
  const weekTotal = printTable("Last 7 days", weekRows);

  console.log("");

  if (SAVE) {
    const date = now.toISOString().slice(0, 10);
    const dir = join(REPO_ROOT, "docs", "billing");
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `${date}.md`);
    const md = [
      `# Google Cloud spend report — ${date}`,
      "",
      `Project: \`${PROJECT_FILTER}\` · Source: \`${FQN}\``,
      `Note: billing data lags ~24h.`,
      "",
      `## Month-to-date (${monthStart.toISOString().slice(0, 10)} → ${date})`,
      "",
      "| Service | Cost (USD) |",
      "|---|---:|",
      ...mtdRows.map((r) => `| ${r.service} | ${fmtUsd.format(r.cost)} |`),
      `| **Total** | **${fmtUsd.format(mtdTotal ?? 0)}** |`,
      "",
      "## Last 7 days",
      "",
      "| Service | Cost (USD) |",
      "|---|---:|",
      ...weekRows.map((r) => `| ${r.service} | ${fmtUsd.format(r.cost)} |`),
      `| **Total** | **${fmtUsd.format(weekTotal ?? 0)}** |`,
      "",
    ].join("\n");
    writeFileSync(file, md);
    console.log(`💾 Saved report to ${file}\n`);
  }
}

main().catch((err) => {
  console.error("\n❌ Cost report failed:", err.message);
  if (err.message?.includes("Could not load the default credentials")) {
    console.error("\n   Run: gcloud auth application-default login\n");
  }
  process.exit(1);
});
