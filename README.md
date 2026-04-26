# Thina CRM

> A modern CRM built for South African real estate agents. **Thina** — *"Us"* in Zulu — puts your team first.

[![CI — Test & Build](https://github.com/gabrielza/thina-crm/actions/workflows/firebase-hosting.yml/badge.svg)](https://github.com/gabrielza/thina-crm/actions)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Firebase Authentication (Google sign-in) |
| Database | Cloud Firestore (africa-south1) |
| Storage | Firebase Storage |
| AI | Gemini 2.5 Flash Lite via `@google/genai` |
| Hosting | Firebase App Hosting (europe-west4) |
| CI | GitHub Actions |
| Testing | Vitest (unit) + Playwright (E2E) |
| Error Tracking | Sentry (`@sentry/nextjs`) |

## Features

- **Lead & Contact Management** — Pipeline board, Kanban drag-and-drop, lead scoring, star/pin priority leads
- **Transaction Tracking** — 9-stage pipeline from OTP to commission paid
- **AI-Powered CMA** — Comparable Market Analysis with Gemini + Google Search grounding
- **Property Listings** — Full CRUD with mandate tracking and alerts
- **Show Days** — QR code registration, public landing pages
- **Messaging** — BulkSMS integration for SMS campaigns
- **Documents** — Firebase Storage upload/download with metadata
- **Compliance** — POPIA consent, FICA verification, CPD tracking
- **Reports & Analytics** — Charts, CSV export, deal forecasting
- **Buyer Matching** — Profile-based property matching
- **Speed-to-Lead** — Response time tracking and SLA monitoring
- **Sequences** — Automated follow-up workflows
- **Lead ROI** — Cost-per-lead tracking and source ROI analysis
- **Inbound webhooks** — HMAC-signed lead injection from portals (Property24, Private Property)
- **Address autocomplete** — Google Places Autocomplete + Place Details on properties and CMA pages

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project on Blaze plan
- A `.env.local` file (see below)

### Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

GEMINI_API_KEY=...
BULKSMS_TOKEN_ID=...
BULKSMS_TOKEN_SECRET=...
INBOUND_WEBHOOK_SECRET=...

# Google Maps (Places autocomplete on /properties and /cma)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...   # Browser key — referrer-restricted to your domains
GOOGLE_MAPS_SERVER_KEY=...            # Server key — used by /api/places/resolve proxy (App Hosting secret in prod)

# Optional
NEXT_PUBLIC_SENTRY_DSN=...
```

### Install & Run

```bash
npm install
npm run dev        # http://localhost:3000
```

### Build

```bash
npm run build
```

### Seed Demo Data

Visit `/seed` in the browser (dev only) or call `POST /api/seed` with a Firebase auth token. Seeds 1,600+ records across 16 Firestore collections.

## Testing

```bash
npm test           # Vitest unit tests
npm run test:e2e   # Playwright E2E tests (requires running dev server)
```

- **Unit tests**: 126 tests covering scoring, schemas, rate limiting, utility helpers, and API routes (`/api/health`, `/api/sms/send`, `/api/leads/inbound`, `/api/cma/research`, `/api/places/resolve`, `/api/seed`)
- **E2E tests**: ~90 tests covering all page routes, navigation, and key CRUD flows. Requires `E2E_EMAIL` and `E2E_PASSWORD` env vars (use `node scripts/reset-test-user-password.mjs` to provision the test user)

## Project Structure

```
src/
├── app/              # Next.js App Router pages & API routes
│   ├── api/          # REST endpoints (seed, sms, cma, health, leads)
│   ├── login/        # Auth page
│   └── [feature]/    # Feature pages (leads, contacts, pipeline, etc.)
├── components/       # Shared React components + shadcn/ui
└── lib/              # Firebase clients, Firestore CRUD, schemas, utils
```

## Deployment

The app auto-deploys to Firebase App Hosting on every push to `master`. The CI pipeline runs lint + type-check + unit tests before the build.

**Production URL**: `https://thina-crm--thina-crm.europe-west4.hosted.app`

## Security

- **Auth middleware** — Server-side `__session` cookie gate on all routes
- **Firestore-backed rate limiting** — Distributed fixed-window limiter persisted in `rateLimits` collection with TTL auto-expiry. Limits: SMS 20/min per user, CMA 10/min per user, Seed 2/min per user, Inbound webhook 60/min per source, Places 30/min per user.
- **Content-Security-Policy** — Enforcing (since 2026-04-25). Restricts script-src to `'self'` + Google identity / Maps origins (`'unsafe-inline'` retained for Next.js 15 App Router streaming hydration scripts — nonce-based hardening tracked as follow-up); connect-src to Firebase / Sentry; frame-ancestors `'none'`.
- **Other security headers** — X-Frame-Options DENY, HSTS preload, Referrer-Policy, Permissions-Policy
- **HMAC webhook auth** — `/api/leads/inbound` verifies `X-Webhook-Signature` (SHA-256) against `INBOUND_WEBHOOK_SECRET`
- **Restricted API keys** — Browser Maps key referrer-restricted; server Maps key API-restricted to Places only
- **Input sanitization** — CMA prompt inputs sanitized before Gemini interpolation
- **Seed protection** — Production guard on seed endpoint (requires `ALLOW_SEED=true`)

## License

Private — All rights reserved.
