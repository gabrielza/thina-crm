# Thina CRM — Copilot Instructions

## Project Overview
Thina CRM is a South African real estate CRM built with Next.js 15 (App Router) + Firebase + Tailwind CSS. Deployed on Firebase App Hosting (africa-south1).

## Tech Stack
- **Framework:** Next.js 15 (App Router, `"use client"` components)
- **Auth:** Firebase Auth (Google + email/password), `__session` cookie for middleware
- **Database:** Firestore (16 collections, owner-based security rules)
- **Storage:** Firebase Storage (document uploads)
- **UI:** Tailwind CSS 3, Radix UI primitives, shadcn/ui components, Lucide icons, Geist font
- **State:** React hooks (useState/useEffect) — no state library
- **Validation:** Zod schemas in `src/lib/schemas.ts`
- **PDF:** @react-pdf/renderer for CMA reports
- **Charts:** Recharts
- **AI:** Google Gemini (@google/genai) with Search grounding
- **Monitoring:** Sentry (@sentry/nextjs)
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Linting:** ESLint 9 flat config

## Key Conventions
- All pages are `"use client"` — no RSC data fetching
- All Firestore documents have `ownerId` field for access control
- CRUD functions live in `src/lib/firestore.ts`
- Zod schemas in `src/lib/schemas.ts` — validate with `parseDoc()`
- Components use shadcn/ui pattern: `src/components/ui/` for primitives
- Path alias: `@/` → `src/`
- Currency is South African Rand (ZAR) — use `formatCurrency()` from `src/lib/utils.ts`
- Dates via `date-fns`

## File Structure
```
src/
  app/           — Pages (App Router)
  app/api/       — API routes (server-side, use firebase-admin)
  components/    — React components
  components/ui/ — shadcn/ui primitives
  lib/           — Shared utilities
    firebase.ts      — Client SDK (lazy init)
    firebase-admin.ts — Admin SDK (server only)
    firestore.ts     — All CRUD functions
    schemas.ts       — Zod schemas + parseDoc()
    scoring.ts       — Lead scoring + forecasting
    rate-limit.ts    — In-memory rate limiter
    utils.ts         — cn(), formatCurrency(), helpers
    hooks/           — Custom React hooks
```

## OneDrive Warning
This workspace is inside OneDrive. Always remind user to **pause OneDrive sync** before running `npm run dev` or `npm run build`. OneDrive corrupts `.next` cache files.

## Commands
- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run test` — Vitest unit tests
- `npm run test:e2e` — Playwright E2E tests (against live deployment)
- `npm run lint` — ESLint
