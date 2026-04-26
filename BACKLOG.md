# Thina CRM — Backlog

## ✅ Completed Security Sprint (v1.3.5 — 2026-04-26)

All three high-priority items from the 2026-04-25 audit shipped:

| ID | Item | Commit | Notes |
|----|------|--------|-------|
| F-01 | Firestore-backed distributed rate limiter | `999d272` | TTL policy on `rateLimits.expiresAt` enabled in Firebase console (Status: Serving) |
| F-02 | Content-Security-Policy enforcing | `29993af` | Verified live: response header is `content-security-policy` (not `-Report-Only`). **Hotfix `15cc843`** added `'unsafe-inline'` to `script-src` after E2E showed Next.js 15 App Router streaming scripts (`self.__next_f.push`) were blocked, breaking client hydration. Future: middleware-injected nonce + `'strict-dynamic'`. |
| F-05 | Per-source inbound webhook rate limit | `1f77502` | Reuses F-01 limiter, keyed by `X-Webhook-Source` |

Audit doc: [docs/Security/Thina-CRM-Security-Audit.docx](docs/Security/Thina-CRM-Security-Audit.docx)
Resulting rating after sprint: **~9.0 / 10** (target met).

---

## Security Remediation (from 2026-04-25 audit)

Audit doc: [docs/security/Thina-CRM-Security-Audit.docx](docs/security/Thina-CRM-Security-Audit.docx)
Current rating: **7.5 / 10**. Target after these items: **~9.0 / 10**.

### High Priority

#### F-02 — Add Content-Security-Policy header
- **Status:** ✅ Report-Only shipped (2026-04-25). Awaiting 24–48 h preview observation, then flip to enforcing.
- **Severity:** High
- **Effort:** Half-day
- **Files:** [next.config.js](next.config.js), [e2e/app.spec.ts](e2e/app.spec.ts)
- **Plan:**
  1. Add `Content-Security-Policy-Report-Only` header to `next.config.js` headers array.
  2. Deploy to a preview channel; observe browser console + Sentry for 24–48 h across login, Google OAuth popup, dashboards, CMA PDF generation, document upload, show-day public form.
  3. Tune origins until report-only is clean.
  4. Flip header name from `-Report-Only` to enforcing `Content-Security-Policy`.
  5. Add a Playwright smoke check that visits each major route and fails on `Refused to load` console errors.
- **Starter policy:**
  ```
  default-src 'self';
  script-src 'self' https://apis.google.com https://accounts.google.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  font-src 'self' data:;
  connect-src 'self' https://*.googleapis.com https://*.firebaseio.com
    https://firestore.googleapis.com https://identitytoolkit.googleapis.com
    https://securetoken.googleapis.com https://firebasestorage.googleapis.com
    https://*.ingest.sentry.io;
  frame-src https://accounts.google.com https://*.firebaseapp.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  object-src 'none';
  upgrade-insecure-requests
  ```
- **Trade-off:** `style-src 'unsafe-inline'` retained for Tailwind/shadcn runtime styles. Nonce-based hardening deferred.

#### F-01 — Replace in-memory rate limiter with Firestore-backed limiter
- **Status:** ✅ Done (2026-04-25). Action required pre-deploy: enable Firestore TTL policy on `rateLimits.expiresAt` via Firebase console.
- **Severity:** High
- **Effort:** 1–2 days
- **Files:** [src/lib/rate-limit.ts](src/lib/rate-limit.ts), [src/app/api/sms/send/route.ts](src/app/api/sms/send/route.ts), [src/app/api/cma/research/route.ts](src/app/api/cma/research/route.ts), [src/app/api/seed/route.ts](src/app/api/seed/route.ts), [firestore.rules](firestore.rules)
- **Problem:** In-process `Map` resets per instance; multiplied by warm App Hosting instances.
- **Plan:**
  1. New collection `rateLimits/{bucket:uid:windowStart}` with shape `{ count, expiresAt }`.
  2. Refactor `rate-limit.ts` to use a Firestore transaction (`runTransaction` → read, increment, write) via Admin SDK.
  3. Keep the same exported limiter API but make `check()` async; update all callers to `await`.
  4. Add Firestore rule: `match /rateLimits/{doc} { allow read, write: if false; }` (Admin-only).
  5. Enable Firestore TTL policy on `rateLimits.expiresAt` via Firebase console; document in `.github/skills/deployment/SKILL.md`.
  6. Unit test (Vitest) mocking `runTransaction` for allow-then-deny behaviour.
  7. E2E test sending 21 requests in a minute and asserting 429 on the 21st.
- **Cost:** ~2 Firestore ops per request; well within free tier at expected volume.
- **Trade-off:** Adds 30–80 ms latency; fixed-window not sliding-window (acceptable v1).

### Medium Priority (bundled with above)

#### F-05 — Add per-source rate limiting on inbound webhook
- **Status:** ✅ Done (2026-04-25). Reuses Firestore limiter, keyed by `X-Webhook-Source` (falls back to `x-forwarded-for`).
- **Severity:** Medium
- **Effort:** Half-day (after F-01 lands)
- **Files:** [src/app/api/leads/inbound/route.ts](src/app/api/leads/inbound/route.ts)
- **Plan:** Reuse the new Firestore limiter, keyed by `X-Webhook-Source` header.

### PR Sequencing

| PR | Scope | Risk |
|----|-------|------|
| PR 1 | CSP report-only header + Playwright smoke check | Low |
| PR 2 | Flip CSP to enforcing (after 48 h clean) | Low |
| PR 3 | Firestore rate-limit collection + rules + TTL + refactored limiter + caller updates + tests | Medium |
| PR 4 | Apply rate limiter to inbound webhook (closes F-05) | Low |

---

## Product Roadmap — SA Real Estate Agent Value

Selection criteria: features that (a) close a workflow currently done outside the CRM by SA agents, (b) directly affect commission earned or retained, or (c) are SA-specific and not provided by Salesforce / HubSpot. Existing surface area considered: leads, contacts, pipeline, transactions, properties+mandates, show-days, messaging (BulkSMS), documents, compliance (POPIA/FICA/CPD), reports, buyer-match, speed-to-lead, sequences, inbound, CMA.

Effort key: S = ≤3 days, M = 1–2 weeks, L = >2 weeks.

### Tier 1 — Highest agent value, fills clear gap

#### R-01 — WhatsApp Business integration (Cloud API)
- **Why:** WhatsApp is the dominant client channel in SA — outranks email and SMS for active conversations. Today the CRM only sends SMS via BulkSMS.
- **Scope:** Send templated messages via WhatsApp Cloud API; receive replies via webhook into a `whatsappMessages` collection; thread to lead/contact; opt-out tracking; POPIA consent gate.
- **Effort:** L. Requires Meta Business Manager + WABA approval; templated-message review.
- **Reuses:** `inboundLimiter` for webhook; existing `messaging` page UI pattern.

#### R-02 — Bond pre-qualification & affordability calculator
- **Why:** First question every buyer asks. Currently sent to ooba/BetterBond — agent loses control of the interaction.
- **Scope:** Public widget (embeddable on agent's listing page) and an internal calculator on each lead; uses SARB repo rate (cron-refreshed); outputs max purchase price, monthly bond instalment, transfer + bond costs.
- **Effort:** M.
- **New collection:** `affordabilityProfiles` (linked to lead).

#### R-03 — Commission split calculator
- **Why:** Every transaction in SA real estate involves splits (agency cut, mentor split, referral fee, VAT). The current `transactions` page tracks gross commission only.
- **Scope:** Per-transaction split table (agency %, agent %, referral %, mentor %, VAT 15%); per-agent default templates; net-to-agent line on the transactions report.
- **Effort:** S.
- **Touches:** `Transaction` schema, transactions page, reports page.

#### R-04 — Mandate expiry & renewal workflow
- **Why:** Sole mandates lapse after 90 days by default — missing this loses the listing. Open mandates also need pruning.
- **Scope:** Countdown badge on each property; auto-task created 30/14/7 days before expiry; one-click renewal flow that bumps the mandate end-date and logs an activity.
- **Effort:** S.
- **Touches:** `Property` / mandate fields; `tasks` collection; properties page.

#### R-05 — Compliance Certificate (CoC) tracker
- **Why:** Transfers in SA cannot register without valid Electrical, Gas, Plumbing, Beetle (KZN/WC) and Electric Fence certificates. Agents currently track these in spreadsheets.
- **Scope:** Per-property CoC checklist with type, contractor, issue date, expiry, cost, document link; status badge on the transaction page; alert when a CoC expires before scheduled transfer date.
- **Effort:** S.
- **New collection:** `complianceCertificates`.

#### R-06 — Bond originator referral tracking
- **Why:** Most agents refer to ooba / BetterBond / MortgageMax and earn referral kickbacks. Currently invisible to the CRM.
- **Scope:** New `bondReferrals` collection; status pipeline (referred → pre-qualified → application → approved → registered); links to lead + property; payout amount + paid-on date; report row.
- **Effort:** S.

#### R-07 — Agent compliance: FFC, CPD, EAAB renewal reminders
- **Why:** Agents trading without a current Fidelity Fund Certificate forfeit commissions; FFC renews annually with EAAB. CPD points must be renewed too. CPD already tracked in localStorage — promote to Firestore + reminders.
- **Scope:** Move CPD entries to `cpdEntries` collection; track FFC issue/expiry/number; auto-task at 60/30/7 days before expiry; agency-level dashboard for principals.
- **Effort:** S.
- **Touches:** Existing CPD widget; new `agentLicences` collection.

#### R-08 — Branded single-property listing brochure (PDF)
- **Why:** CMA PDF exists, but agents also need a one-pager brochure per listing for show days, owners, and email.
- **Scope:** `@react-pdf/renderer` template using property photos + description + agent contact + agency branding; download from property page.
- **Effort:** S.
- **Reuses:** Existing CMA PDF infrastructure.

#### R-09 — Seller weekly activity report
- **Why:** Top reason owners cancel mandates is "I never hear from my agent". Auto-sending a report is a proven retention lever.
- **Scope:** Cron-triggered weekly email per active sole mandate: portal views, show-day attendance, enquiries, offers, marketing actions taken. Editable before send.
- **Effort:** M.
- **Touches:** New scheduled function; sequences pattern; properties + activities collections.

#### R-10 — Buyer client portal (light)
- **Why:** Buyers want self-service for OTP status and saved searches; reduces support questions.
- **Scope:** Read-only public route per buyer (signed token URL), shows: matched listings, OTP stage, document checklist, contact agent button.
- **Effort:** M.
- **Touches:** New `buyerPortalTokens` collection; reuses existing buyer-match data.

#### R-27 — Google Places address autocomplete on the CMA module ✅ Done
- **Status:** Shipped — Subject Property, Comparable rows, and the Properties form all use `<AddressAutocomplete />` with server-proxied Place Details + Firestore cache (30-day TTL). Geocoded `lat`/`lng`/`placeId`/`formattedAddress` are persisted on `cmaReports`, each `CmaComparable`, and `properties`. Subject coordinates are passed into the Gemini research prompt for location-anchored comparable searches.
- **Why:** Today the CMA form takes free-text `subjectAddress`, `subjectSuburb`, `subjectCity` and free-text comparable addresses ([src/app/cma/page.tsx](src/app/cma/page.tsx#L62-L68)). Typos and inconsistent suburb naming (e.g. "Sea Point" vs "Seapoint") corrupt comparable lookups and skew the Gemini-grounded research that uses these strings as the search seed.
- **Scope:**
  1. Add a reusable `<AddressAutocomplete />` component wrapping the Google Places Autocomplete (New) widget, restricted to `country: "za"` and `types: ["address"]`.
  2. Use it in the CMA "Subject Property" form (replacing the three free-text inputs) and in the "Add Comparable" row. Populate `subjectAddress`, `subjectSuburb`, `subjectCity`, plus capture `placeId`, `lat`, `lng`, `formattedAddress` for richer downstream use.
  3. Pass `lat`/`lng` and `placeId` into [src/app/api/cma/research/route.ts](src/app/api/cma/research/route.ts) so the Gemini prompt can be anchored on a verified location, not a typed string.
  4. Persist the geocoded fields on the `cmaReports` document so future map-based features (R-08 brochure, R-09 seller report) can reuse them.
  5. Reuse the same component on the Properties form so listings carry the same canonical address shape.
- **Tech notes:**
  - Use the **Places Autocomplete (New)** Web Component (`gmp-place-autocomplete`) — billed per-session, not per-keystroke, and avoids the deprecated legacy widget.
  - Loader: `@googlemaps/js-api-loader` with `libraries: ["places"]`. Lazy-load only on pages that need it.
  - Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` env var; restrict the key to HTTP referrers (production domain + localhost) and to Places API + Maps JS API only. Document in [README.md](README.md).
  - **CSP impact (F-02):** add `https://maps.googleapis.com` and `https://maps.gstatic.com` to `script-src` and `connect-src` in [next.config.js](next.config.js). Catch this during the report-only soak before flipping CSP to enforcing.
  - Cost guard: cap to one Place Details request per submitted form (Place Details is the expensive call); use Autocomplete-only sessions for type-ahead.
- **Validation:** Zod schema for the new geocoded fields (`placeId: z.string()`, `lat: z.number().min(-90).max(90)`, `lng: z.number().min(-180).max(180)`).
- **Effort:** S.
- **Files touched:** new `src/components/address-autocomplete.tsx`; [src/app/cma/page.tsx](src/app/cma/page.tsx); [src/app/api/cma/research/route.ts](src/app/api/cma/research/route.ts); [src/lib/schemas.ts](src/lib/schemas.ts); [next.config.js](next.config.js); [README.md](README.md); follow-up: properties form.

### Tier 1b — CMA Excellence (mandate-winning improvements)

Research-driven gap analysis vs. Lightstone / PropStats / Cloud CMA. The CMA's real job is to **win the sole mandate**, not just to be technically accurate. Items ordered by effort × impact.

#### R-28 — Static Map of subject + comparables in CMA PDF
- **Why:** Single highest visual-credibility gain. Sellers expect to see where comps are in relation to their property.
- **Scope:** Render a Google Static Maps image (subject = gold pin, comps = teal pins, numbered) and embed as `<Image>` in the CMA PDF on the comparables page. Reuses geocoded `lat`/`lng` already persisted from R-27.
- **Tech:** Server-side Static Maps API call (uses existing `GOOGLE_MAPS_SERVER_KEY`); cache the PNG by `reportId` to avoid re-billing on every download. Add `https://maps.googleapis.com` to `img-src` in CSP if not already covered.
- **Effort:** S.
- **Files:** [src/components/cma-pdf-document.tsx](src/components/cma-pdf-document.tsx); new `src/app/api/cma/map/route.ts` (or inline server util).

#### R-29 — Net-to-Seller calculator (SA-specific)
- **Why:** Sellers obsess over the take-home figure. Today they handwrite this from list price minus bond settlement, rates clearance, compliance certs (electrical/gas/beetle/plumbing/electric fence), commission, VAT on commission. Owning this calculation owns the mandate conversation.
- **Scope:** New section on the CMA page (form) and a dedicated PDF page. Inputs: outstanding bond, rates owing, CoC quotes, commission %, VAT 15%. Outputs three scenarios (asking / market / quick-sale) side-by-side with net to seller for each.
- **Effort:** M.
- **Touches:** `CmaReport` schema (new `netToSeller` block); CMA page; CMA PDF; reuses R-03 commission logic if shipped.

#### R-30 — Tighten Gemini prompt: forbid invented addresses, require source URL per comp
- **Why:** Single biggest credibility risk today is fabricated comps. Sellers will Google a comp address; if it doesn't exist the mandate is dead.
- **Scope:** Update [src/app/api/cma/research/route.ts](src/app/api/cma/research/route.ts) prompt: add `sourceUrl` field per comp, instruct "if you cannot verify a real listing/sale, return null — do NOT invent". Pre-seed prompt with `site:property24.com sold ${suburb}` and `site:privateproperty.co.za` to bias the Search tool. Render comps with a "Verify ↗" link in PDF + UI when `sourceUrl` present, and a "AI-suggested, unverified" pill when missing.
- **Effort:** S.
- **Touches:** Gemini route; `CmaComparable` schema (`sourceUrl?: string`, `source: "verified" | "ai-suggested" | "manual"`); CMA page comp cards; CMA PDF comp cards.

#### R-31 — Comparable adjustment grid
- **Why:** Industry-standard appraisal technique — adjust each comp's price for differences from the subject (pool +R150k, smaller floor +R8k/m², older build −R50k). Today agents do this on paper.
- **Scope:** Per-comp adjustment table (feature, +/- ZAR, justification). Adjusted price + adjusted R/m² shown next to gross. Sum drives a refined estimated value.
- **Effort:** M.
- **Touches:** `CmaComparable.adjustments: { feature; amount; note }[]`; CMA page comp editor; CMA PDF comp cards + comparison matrix.

#### R-32 — Comparable quality score + filters
- **Why:** Not all comps are equal. Industry rule of thumb: ≤1.5 km, sold ≤6 months, ±20% floor size, ±1 bed.
- **Scope:** Compute a 0–100 quality score per comp (distance via Haversine from subject `lat`/`lng`, recency, size delta, bed delta). Show as a pill on each comp card. Add filter chips ("hide low quality", "verified only").
- **Effort:** S.
- **Touches:** new `src/lib/cma-comp-score.ts`; CMA page; CMA PDF.

#### R-33 — Days-on-market forecast
- **Why:** Top mandate-winning sentence: "If you list at R3.2m, expect to sell in ~45 days based on 8 comparable sales." Currently DoM data on comps is captured but never surfaced.
- **Scope:** Compute median DoM across comps, display per pricing tier in the Pricing Strategy section (asking / market / quick-sale), with confidence band.
- **Effort:** S.
- **Touches:** CMA page Pricing Strategy section; CMA PDF.

#### R-34 — Agent track-record auto-page in CMA PDF
- **Why:** "Why list with me" page is a standard mandate-pitch tool. We already have all the data in Firestore — listings count, avg sale-to-list ratio, avg DoM, total ZAR transacted across the agent's transactions over the trailing 12 months.
- **Scope:** New PDF page generated from the agent's `transactions` and `properties` for the trailing 12 months. Headline metrics + small bar chart. Skip gracefully if agent has < 3 closed deals.
- **Effort:** S.
- **Touches:** [src/components/cma-pdf-document.tsx](src/components/cma-pdf-document.tsx); new server-side aggregator (or compute client-side at PDF generation time).

#### R-35 — "Generate CMA from Property" one-click button
- **Why:** Today the agent re-types the subject address even when the property already exists in the system.
- **Scope:** Add a "Run CMA" button on `/properties/[id]` that pre-fills a new CMA from the property's address, type, beds, baths, sizes and persisted `lat`/`lng`. Save back-link from CMA report to source property.
- **Effort:** S.
- **Touches:** properties detail page; CMA page (accept query string seed); `CmaReport.sourcePropertyId?: string`.

#### R-36 — Shareable web CMA + view tracking
- **Why:** Cloud CMA charges $99/mo principally for this feature. "Seller opened your CMA 3 times, spent 8 min on the marketing plan page" is gold for follow-up timing.
- **Scope:** Signed-token public route `/cma/share/[token]` rendering the report as HTML (mobile-friendly). Log opens + section dwell time to a `cmaShareEvents` collection. Surface a "Seller activity" widget on the CMA card. Email-from-app with branded template instead of "download then attach".
- **Effort:** L.
- **Touches:** new public route; new `cmaShareTokens` + `cmaShareEvents` collections; CMA page (Share button + activity panel); email transport.

#### R-37 — SA compliance & process appendix in CMA PDF
- **Why:** Cheap credibility win. Static one-pager makes the report feel veteran-grade.
- **Scope:** Appendix page covering: compliance certs needed at transfer (with cost estimates), mandate types (sole/open/dual) explained, FICA documents required, transfer process timeline (~90 days), POPIA notice on data handling.
- **Effort:** S (mostly content).
- **Touches:** [src/components/cma-pdf-document.tsx](src/components/cma-pdf-document.tsx) only.

#### R-38 — Suburb-cached CMA research
- **Why:** Same suburb + property type queried twice in a week shouldn't burn Gemini tokens twice.
- **Scope:** Hash `suburb + city + propertyType + bedroomBand` → 7-day TTL cache document in `cmaResearchCache`. Hit before calling Gemini. Show a subtle "from cache" indicator.
- **Effort:** S.
- **Touches:** [src/app/api/cma/research/route.ts](src/app/api/cma/research/route.ts); new `cmaResearchCache` collection + Firestore TTL.

#### R-39 — Lightstone / WinDeed / Property24 sold-prices grounding (premium)
- **Why:** True deeds-verified comps. R-30 makes the AI honest about what it can verify; this gives it real data to verify against.
- **Scope:** Server-side fetcher: Tier-A = Property24 public sold-prices scraper (free, fragile); Tier-B = Lightstone API (paid, reliable). Anchor at least 1–2 comps to a real registered sale; tag comp `source: "verified-deeds"`.
- **Effort:** L (commercial + integration). Supersedes/extends R-24.
- **Touches:** new `src/lib/comp-sources/`; CMA route; comp data model.

#### R-40 — CMA versioning & diff
- **Why:** Agents revise CMAs after seller feedback. Today the only option is overwrite or duplicate.
- **Scope:** Each save snapshots the report as a `cmaReportVersions` subdoc. UI shows v1 / v2 / v3 with timestamp + agent note; diff view highlights changed comps and price.
- **Effort:** M.
- **Touches:** CMA page; new subcollection.

### Recommended CMA next sprint
Three items, ~1 day total, biggest perceived quality jump:
1. **R-28 Static Map** — visual wow, lowest risk, reuses existing geocoding.
2. **R-29 Net-to-Seller** — SA-specific, mandate-winning conversation.
3. **R-30 Tighter Gemini prompt + source URLs** — closes the #1 trust gap (fabricated comps).

#### R-41 — Agent Profile system (collection + denorm) — partially shipped
- **Status:** ✅ MVP shipped — `agentProfiles` collection (keyed by uid), `/settings/profile` page, `useAgentProfile()` hook, photo + agency logo upload to Firebase Storage, CMA PDF renders rich agent block (photo, agency logo, FFC#, full contact details), agent snapshot saved on each `cmaReports` write so historical reports keep their preparer details.
- **Remaining:** Denormalize `agentSnapshot` onto leads / contacts / properties / transactions on assign (extends today's `assignedAgentId` + `assignedAgentName` pattern). Apply on every create + every reassignment. Backfill script for existing records owned by current user.
- **Scope (remaining):**
  1. Add `agentSnapshot?: AgentSnapshot` to `Lead`, `Contact`, `Property`, `Transaction` interfaces and Zod schemas.
  2. Update create paths in [src/app/leads/page.tsx](src/app/leads/page.tsx), [src/app/contacts/page.tsx](src/app/contacts/page.tsx), [src/app/properties/page.tsx](src/app/properties/page.tsx), [src/app/transactions/page.tsx](src/app/transactions/page.tsx) to call `buildAgentSnapshot(profile)` and embed.
  3. Update CMA PDF, listing brochure (R-08), and seller weekly report (R-09) to prefer snapshot fields where available.
  4. Backfill script `scripts/backfill-agent-snapshot.mjs` that, for current uid, reads owned docs in each collection and patches in the snapshot if missing.
- **Effort:** S (remaining work).
- **Touches:** schemas + 4 page create handlers + 1 backfill script.

### Tier 2 — Strong impact, broader CRM features

#### R-11 — 2-way calendar sync (Google + Microsoft)
- **Why:** Show days, viewings and OTP signings live in agents' personal calendars; double-entry causes missed appointments.
- **Scope:** OAuth connect; sync show-day + task events with reminder offsets.
- **Effort:** M.

#### R-12 — Email open / click tracking on sequences
- **Why:** Sequences exist but engagement is invisible.
- **Scope:** Pixel + redirect-link tracker; per-step open/click counters; surface "warm leads" widget on dashboard.
- **Effort:** S–M.

#### R-13 — Inbound lead routing (round-robin + geo)
- **Why:** Agencies with multiple agents need automatic distribution by suburb / area / floor-time.
- **Scope:** Routing rules per source / suburb / property type; round-robin with availability flag; reassignment activity log.
- **Effort:** M.

#### R-14 — AI listing description generator
- **Why:** Agents copy-paste from old listings. Gemini already wired in — extend it.
- **Scope:** From property attributes + uploaded photos, generate listing copy in 3 length variants and 2 tones; save with edit history.
- **Effort:** S.
- **Reuses:** `@google/genai` client used by CMA.

#### R-15 — AI follow-up suggestions ("next best action")
- **Why:** Surfaces stale leads and recommends a concrete action (call, send brochure, drop in price-drop alert).
- **Scope:** Daily batch over leads with no activity in N days; Gemini classifies state + recommends action; appears in a "Today" widget on dashboard.
- **Effort:** M.

#### R-16 — Voice notes → transcription → activity log
- **Why:** Agents work from the car. Currently they don't log activity at all.
- **Scope:** Mobile record button; upload audio to Storage; Gemini audio transcription; auto-create activity tied to last-viewed lead.
- **Effort:** M.

#### R-17 — Show-day digital sign-in (kiosk mode)
- **Why:** Walk-up attendees who don't scan the QR are lost. Kiosk mode lets the agent hand over a tablet at the door.
- **Scope:** New `/showday/{id}/kiosk` route — full-screen, large form, autoreset after submit, embedded POPIA consent.
- **Effort:** S.
- **Touches:** Existing show-day public page.

#### R-18 — Post-viewing buyer feedback survey
- **Why:** Feeds the seller report (R-09) and surfaces objections quickly.
- **Scope:** Auto-send 2 hours after show day end with 3-question SMS/WhatsApp survey ("Interested? / Price feedback / What put you off?"); responses on the property page.
- **Effort:** S.

#### R-19 — Click-to-call + call logging
- **Why:** Today calls happen off-platform and don't create activities.
- **Scope:** `tel:` deep-links from lead/contact pages; post-call modal asks duration + outcome → creates activity.
- **Effort:** S.

#### R-20 — AI universal email parser
- **Why:** Current parsers handle Property24 / PrivateProperty only. Many other portals + direct enquiries fall through.
- **Scope:** Replace regex parsers with a Gemini-backed extractor that returns the same `{ name, email, phone, propertyRef, message }` shape; keep regex as fallback.
- **Effort:** S.
- **Touches:** [src/app/api/leads/inbound/route.ts](src/app/api/leads/inbound/route.ts).

### Tier 3 — Strategic / multi-tenant / scale

#### R-21 — Agency & branch hierarchy with manager dashboards
- **Why:** Required to sell to franchises (Pam Golding, Seeff, RE/MAX, Chas Everitt) where principals oversee teams.
- **Scope:** New `organisations`, `branches`, `agentMemberships` collections; role: agent / branch-manager / principal; manager dashboards (leaderboards, conversion, pipeline by agent).
- **Effort:** L. Touches Firestore rules across most collections (rules become role-aware).

#### R-22 — Trust-account reconciliation
- **Why:** Agencies must hold deposits in an audited trust account; current process is Excel.
- **Scope:** New `trustAccountTransactions` collection; deposit + payout entries linked to OTP; monthly reconciliation export.
- **Effort:** M–L.

#### R-23 — Rental property management module
- **Why:** Most SA agencies do both sales and rentals. Today the CRM is sales-only.
- **Scope:** Lease entity (start, end, rent, escalation); tenant linked from contacts; TPN credit-check integration; monthly invoice generation; maintenance jobs.
- **Effort:** L.

#### R-24 — Lightstone / Propstats sold comparables
- **Why:** Agents pay for these separately; integrating into the CMA lifts perceived value massively.
- **Scope:** Paid API integration; replace Gemini-grounded comparables (or augment) with verified sold data on the CMA page.
- **Effort:** M (integration) — depends on commercial contract.

#### R-25 — Deeds Office owner search
- **Why:** Verifies the seller is the true owner; also enables prospecting (find owners of properties not on market).
- **Scope:** Lookup by erf / deed number; results saved to property record; consent + audit log for POPIA.
- **Effort:** M (paid integration).

#### R-26 — Mobile PWA + offline mode
- **Why:** Show days happen in basements and rural areas. Current app needs reliable signal.
- **Scope:** Service worker, offline cache for active properties + today's show-days, queued writes that sync when online.
- **Effort:** M.

### Tier 4 — Compliance & reliability follow-ups (from security audit)

These are already enumerated in the audit but tracked here for execution alongside product work.

| ID | Title | Effort |
|----|-------|--------|
| F-03 | Commit and deploy `storage.rules` (owner-scoped, size-capped) | S |
| F-06 | Add POPIA consent hard-gate before SMS/email/WhatsApp dispatch | S |
| NEW-02 | Enable Firestore TTL on `rateLimits.expiresAt` (Firebase console) | XS |
| F-08 | Email format validation in Firestore rules for `showDayLeads` | XS |
| F-09 | POPIA / GDPR data subject access + erasure endpoints | M |

### Recommended next sprint

Pull from Tier 1, biased to short / high-value first:
1. **R-04 Mandate renewal workflow** (S) — directly protects commission.
2. **R-03 Commission split calculator** (S) — money on the line, visible value.
3. **R-08 Listing brochure PDF** (S) — visible polish, reuses CMA infra.
4. **R-05 Compliance certificate tracker** (S) — avoids transfer delays.
5. **F-03 + NEW-02 + F-06** — close out remaining audit items.

That delivers five customer-visible features + finishes the security audit in roughly one sprint.
