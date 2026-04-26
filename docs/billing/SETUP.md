# Google Cloud Billing — One-Time Setup

This is the setup needed before `npm run cost-report` will work.

## Why this is needed

Google does **not** offer a real-time cost API. The only way to get accurate, per-service spend data is to enable BigQuery export of your billing data, then query that table. The export runs continuously but lags real spend by **~24 hours**.

You only do this once per billing account.

## Step 1 — Enable BigQuery billing export

1. Go to **Google Cloud Console → Billing → [Billing export](https://console.cloud.google.com/billing/export)**.
2. Pick your billing account (the one paying for `thina-crm`).
3. Under **BigQuery export → Standard usage cost**, click **Edit settings**.
4. Choose:
   - **Project:** `thina-crm` (or any project with BigQuery enabled — it can be the same project the data describes)
   - **Dataset:** create a new one called `billing_export` (location: `US` is cheapest and fine for query latency from anywhere)
5. Click **Save**.

> First export run lands within ~24 h. Don't worry if `npm run cost-report` errors out today with "table not found" — wait until tomorrow.

## Step 2 — Find the table name

Once the export has run, BigQuery will contain a table named like:
```
gcp_billing_export_v1_01ABCD_23EFGH_45IJKL
```
The suffix is your billing account ID with dashes replaced by underscores.

Find it via the CLI:
```powershell
gcloud config set project thina-crm
bq ls billing_export
```
Or in the [BigQuery console](https://console.cloud.google.com/bigquery).

## Step 3 — Add to `.env.local`

```env
GCP_BILLING_PROJECT_ID=thina-crm
GCP_BILLING_DATASET=billing_export
GCP_BILLING_TABLE=gcp_billing_export_v1_01ABCD_23EFGH_45IJKL
# Optional — defaults to "thina-crm"
GCP_PROJECT_FILTER=thina-crm
```

## Step 4 — Authenticate locally

The script uses Application Default Credentials so you don't need a service-account key file:

```powershell
gcloud auth application-default login
```

This opens a browser, you sign in once, and credentials are cached at `%APPDATA%\gcloud\application_default_credentials.json`.

You also need the **BigQuery Data Viewer** + **BigQuery Job User** roles on the project that owns the export dataset. If you're the owner of the GCP project you already have these.

## Step 5 — Set a budget (optional but strongly recommended)

While you're in the Console:
1. Billing → **Budgets & alerts** → **Create budget**.
2. Scope to project `thina-crm`.
3. Set a monthly amount (suggested starting point: **$20 USD**, ~R370).
4. Add alert thresholds at **50%, 90%, 100%, 120%**.
5. Add your email as the alert recipient.

This is independent of the cost-report script and gives you Google-side email alerts if you blow through budget between deploys.

## Step 6 — Test it

```powershell
npm run cost-report
```

Expected output (after the first 24 h of export data):

```
📊 Google Cloud cost report — project: thina-crm
   Source: `thina-crm.billing_export.gcp_billing_export_v1_...`
   Note: billing data lags ~24h.

━━━ Month-to-date (2026-04-01 → today) ━━━
  Service                          Cost (USD)
  -------------------------------  ------------
  Cloud Firestore                       $0.0421
  Cloud Logging                         $0.0103
  ...
```

Pass `--save` to also write a Markdown report under `docs/billing/YYYY-MM-DD.md`:

```powershell
npm run cost-report -- --save
```

## When to run it

- **Manually** — any time you want a snapshot.
- **After every deploy** — the deployment skill (`.github/skills/deployment/SKILL.md`) now lists this as a post-deploy step. Pass `--save` so each deploy day produces a dated report you can commit alongside the release tag.

## What this report does NOT include

- **Real-time spend** — data lags ~24 h. Nothing you can do about that.
- **Forecasts** — only actual posted charges. Use Console → Billing → Reports for forecasts.
- **Quotas** — quota usage is in Cloud Monitoring, not billing export.
- **Per-API-call breakdown within a service** — e.g. you'll see "Maps" as one line, not "Place Details vs Autocomplete." For that level use Console → Billing → Reports → group by SKU.

## Troubleshooting

| Error | Fix |
|---|---|
| `Not found: Table` | Export not enabled yet, or first export hasn't landed (wait 24 h). |
| `Could not load the default credentials` | Run `gcloud auth application-default login`. |
| `Permission denied: bigquery.jobs.create` | Grant your account `roles/bigquery.jobUser` on the project. |
| Empty results but I know there's spend | Wrong `GCP_PROJECT_FILTER` — check that it matches your project ID exactly. |
