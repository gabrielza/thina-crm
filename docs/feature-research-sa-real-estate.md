# Thina CRM — Feature Research: SA Real Estate Agent Needs

**Date:** 19 April 2026  
**Purpose:** Prioritised feature recommendations for a CRM designed for South African real estate sales agents  
**Methodology:** Competitor analysis (Prop Data, Rex, Flow), SA regulatory research (EAAB, FIC Act, POPIA), industry workflow analysis, integration ecosystem mapping

---

## Executive Summary

South African real estate agents operate in a unique regulatory and communication environment. The SA market is dominated by WhatsApp communication, portal-driven leads (Property24, Private Property), strict FICA/POPIA compliance requirements, and a commission-based income model with VAT thresholds. The biggest gaps in Thina CRM versus competitors like Prop Data (R259+/mo, 20,000+ users) and Rex ($511bn property sold) are in **communication automation**, **property/listing management**, and **compliance workflows**.

---

## Category Analysis

### 1. Lead Generation & Capture

**How SA agents actually get leads:**
- **Property portals** (Property24, Private Property) — by far the #1 source. Leads arrive as email notifications with buyer name, phone, email, property reference. Agents pay monthly listing fees.
- **Facebook Marketplace / Meta ads** — increasingly dominant for the under-40 buyer market. Agents run ads linking to WhatsApp or landing pages.
- **Gumtree** — still relevant for lower-value properties and rentals
- **Open houses (show days)** — Saturday/Sunday show days are a SA institution. Agents collect sign-in sheets (paper or digital).
- **Referrals** — word-of-mouth is huge; agents need to track referral sources and reward referrers
- **Street signage / "For Sale" boards** — generates phone call leads
- **Walk-ins** — agency office foot traffic
- **Developer partnerships** — new development sales
- **Area farming** — door-knocking, area newsletters, "just sold" mailers

**What's missing from Thina CRM:**
- ✅ Portal lead injection (planned v0.11.0)
- ❌ Facebook/Meta lead form integration (Facebook Lead Ads webhook)
- ❌ Open house digital sign-in (QR code → form → auto-create lead)
- ❌ Referral tracking with source attribution
- ❌ Landing page / web form builder for agents' own marketing
- ❌ QR code generation for signage (scan → lead form)

### 2. Communication & Follow-up

**SA-specific communication landscape:**
- **WhatsApp is king.** 95%+ of SA adults use WhatsApp. It is THE primary business communication tool. Agents negotiate deals, send property photos, share documents, and schedule viewings — all on WhatsApp. This is non-negotiable for any SA CRM.
- **SMS** — still important for automated notifications, especially for older demographics and areas with poor data coverage. Bulk SMS providers: BulkSMS, Clickatell, Africa's Talking.
- **Email** — primarily for formal communication, OTP documents, correspondence with conveyancers. Less used for lead nurturing than in US/EU markets.
- **Phone calls** — critical for initial lead contact. Speed-to-lead matters enormously. First agent to call usually wins.

**What agents need:**
- WhatsApp Business API integration (send/receive messages from CRM, templates for follow-ups, property share links)
- Click-to-call / click-to-WhatsApp from contact records
- Automated follow-up sequences (WhatsApp preferred, SMS fallback, email for formal)
- Speed-to-lead alerts (push notification when new lead arrives, countdown timer)
- Template library for common messages (viewing confirmation, OTP follow-up, FICA request, "just listed" alerts)
- Drip campaigns by buyer type (first-time buyer education series, investor updates)
- Communication log (all WhatsApp/SMS/email/calls logged against contact)

**Competitors:**
- Prop Data: Email marketing, portal integration, newsletters
- Rex: SMS campaigns, email templates, 800,000+ calls from mobile app
- Flow: Transaction-focused communication tracking

### 3. Property Matching & Listings

**How SA agents work with properties:**
- Agents hold **mandates** (authority to sell) — can be **sole mandate** (exclusive, typically 3 months) or **open mandate** (multiple agents)
- Sole mandates are more valuable — higher commission, more control
- Agents need to match **buyer requirements** (area, price range, bedrooms, features) to **available listings**
- Property alerts: "New listing matches your criteria" — sent via WhatsApp/email
- Comparative Market Analysis (CMA) — agents need to show sellers what similar properties sold for

**What's missing from Thina CRM:**
- ❌ Listings/mandates collection (property address, price, features, mandate type, expiry date, photos)
- ❌ Buyer requirement profiles (budget range, area preferences, bedroom count, must-haves)
- ❌ Auto-matching engine (match buyer requirements to new listings, send alerts)
- ❌ Mandate expiry tracking and renewal reminders
- ❌ Property viewing scheduling and feedback collection
- ❌ CMA report generation (with Lightstone data integration)

### 4. Document Management

**Key documents in SA real estate transactions:**
- **OTP (Offer to Purchase)** — the foundational deal document
- **FICA documents** — ID/passport, proof of address, bank statements (required by FIC Act for both buyer and seller)
- **Bond/mortgage application** — submitted to banks via bond originators (ooba, BetterBond)
- **Mandate agreement** — authority to sell, signed by seller
- **Title deed** — from Deeds Office
- **Compliance certificate** — electrical, plumbing, gas, beetle, electric fence
- **HOA/Body Corporate** — levy clearance figures
- **Voetstoots clause / defect disclosure** — property condition report

**What agents need:**
- Document upload per transaction (photos of FICA docs from phone)
- FICA document checklist with status tracking (collected/pending/verified)
- Document expiry tracking (proof of address must be < 3 months old)
- Secure document sharing with conveyancers and bond originators
- Template OTP with auto-populated fields from CRM data
- E-signature integration (DocuSign, SigniFlow — SA e-signature provider)

### 5. Financial Tracking

**Beyond existing commission calculator:**
- **Monthly/quarterly income projections** — based on pipeline stage probabilities
- **Tax planning** — SA agents are typically sole proprietors or commission earners
  - Income tax (progressive rates, provisional tax payments)
  - **VAT registration threshold: R1,000,000 turnover** — agents earning above this MUST register for VAT. This is a critical threshold many agents approach.
  - Once VAT-registered: must charge 15% VAT on commission, can claim input VAT
- **Trust account tracking** — buyer deposits are held in agency trust account (EAAB requirement)
- **Commission split tracking** — agency split (typically 50/50 or 60/40), franchise fees, marketing levies
- **Expense tracking** — marketing spend, portal listing fees, fuel, phone, Lightstone subscriptions
- **Invoice generation** — commission invoices to agency or developers

### 6. Compliance & Regulatory

**EAAB (Estate Agency Affairs Board):**
- All agents must be registered with EAAB and hold a valid Fidelity Fund Certificate (FFC)
- FFC must be renewed annually (deadline: end of each year)
- **CPD (Continuing Professional Development)** — agents must accumulate CPD points annually to maintain registration. Categories include ethics, legislation, practical skills.
- Trust account audits — agencies must have audited trust accounts

**FIC Act (Financial Intelligence Centre Act) / FICA:**
- Estate agents are **accountable institutions** under the FIC Act
- Must perform Customer Due Diligence (CDD) — verify identity of buyer and seller
- Must keep records for 5 years after transaction
- Must report suspicious transactions to FIC
- Risk Management and Compliance Programme (RMCP) required
- Thina already has basic FICA tracking in transactions — needs expansion

**POPIA (Protection of Personal Information Act):**
- SA's data protection law (similar to GDPR)
- Penalties: R1M–R10M fines or 1–10 years imprisonment
- Requires: consent for data collection, data minimisation, right to access/delete
- CRM implications: consent tracking, data retention policies, opt-out management, data export capability
- Direct marketing requires opt-in consent (Section 69)

**What's missing from Thina CRM:**
- ❌ FFC expiry tracking and renewal reminders
- ❌ CPD points log and progress tracker
- ❌ POPIA consent management (consent capture, opt-out, data export)
- ❌ FICA compliance reporting (which transactions have complete FICA)
- ❌ Automated FICA reminders to buyers/sellers
- ❌ Record retention policy enforcement (5-year rule)

### 7. Mobile-First Features

**What agents do in the field:**
- Show properties (Saturday/Sunday show days are peak)
- Meet buyers and sellers at properties
- Capture leads at open houses
- Take property photos and videos
- Make calls and send WhatsApp messages
- Need quick access to contact details, property info, showing schedule
- Voice-to-text for noting conversations after viewings

**Key mobile features:**
- Progressive Web App (already Next.js — good foundation)
- Quick-add lead from phone (minimal fields: name, phone, source)
- One-tap call/WhatsApp from any contact
- Camera integration for document capture (FICA docs, property photos)
- Offline capability for areas with poor signal (common in rural SA)
- Voice-to-note after property viewings
- Show day mode (streamlined interface for rapid lead capture at open houses)
- Push notifications for new leads and task reminders
- Location-based property check-in

### 8. Integrations

**SA-specific integration ecosystem:**

| Integration | Purpose | Value | API Available? |
|---|---|---|---|
| **Lightstone Property** | Property valuations, suburb reports, ownership history, CMA data | Very High | Yes (subscription-based toolkit) |
| **Property24** | Portal lead ingestion, listing syndication | Very High | Email parsing (planned), limited API |
| **Private Property** | Portal lead ingestion, listing syndication | Very High | Email parsing (planned), limited API |
| **ooba** | Bond origination status tracking, pre-approval referrals | High | Limited — referral links available |
| **BetterBond** | Bond origination status tracking, pre-approval referrals | High | Limited — referral links available |
| **WhatsApp Business API** | Two-way messaging, templates, media sharing | Very High | Yes (via BSPs: Twilio, MessageBird, Clickatell) |
| **BulkSMS / Clickatell** | SMS notifications and campaigns | High | Yes (REST API) |
| **SigniFlow** | SA e-signature for OTPs and mandates | Medium-High | Yes |
| **Deeds Office (DeedsWeb)** | Title deed searches, ownership verification | Medium | Limited (web scraping, no public API) |
| **CIPC** | Company/trust verification for entity buyers | Medium | Limited |
| **Google Maps / Places** | Property location, driving directions, area info | Medium | Yes |
| **PayProp / WeConnectU** | Rental management (if expanding to rentals) | Low (future) | Yes |
| **Xero / Sage** | Accounting integration for commission income | Medium | Yes |

### 9. AI/Automation Opportunities

**High-value automation for SA agents:**
- **Speed-to-lead auto-response** — when portal lead arrives, immediately send WhatsApp template ("Hi {name}, thanks for your enquiry about {property}. I'm {agent}, would you like to schedule a viewing?")
- **Smart lead scoring** — weight by: response time, budget vs listing price match, area match, pre-approval status, communication engagement
- **Automated task creation** — when lead stage changes, auto-create tasks (e.g., lead→qualified: "Schedule viewing", OTP signed: "Collect FICA docs")
- **Follow-up reminders** — "You haven't contacted {lead} in 7 days" with suggested next action
- **Property matching alerts** — "New listing in Sandton matches 3 of your buyer profiles"
- **Commission forecasting** — based on pipeline stages with historical conversion rates
- **Market value suggestion** — when entering a property listing, suggest price range based on area, size, recent sales (Lightstone integration)
- **Email/WhatsApp classification** — auto-tag incoming communication by intent (viewing request, price negotiation, document submission)
- **Show day report generation** — after open house, auto-generate summary of leads captured, follow-up tasks
- **Bond application status prediction** — based on buyer profile, estimate approval probability

### 10. Reporting & Business Intelligence

**What successful SA agents track:**
- **Commission earned** — monthly, quarterly, YTD, vs target
- **Commission pipeline** — expected commission by stage with probability weighting
- **Lead source ROI** — cost per lead by source (Property24 listing fees vs leads generated)
- **Conversion funnel** — lead → qualified → viewing → OTP → registered → commission paid
- **Average days to close** — from lead to commission, by area and price bracket
- **Listing performance** — days on market, price reductions, viewing-to-offer ratio
- **Area performance** — which suburbs are generating the most activity/commission
- **Activity metrics** — calls made, viewings conducted, OTPs written
- **VAT threshold tracker** — running total towards R1M turnover
- **Mandate pipeline** — active mandates, expiry dates, sole vs open ratio
- **Year-on-year comparison** — same period last year performance
- **Referral source tracking** — who refers the most business

---

## Top 15 Prioritised Features

| # | Feature | Category | Agent Value | Complexity | Differentiator? | Impl. Order |
|---|---------|----------|-------------|------------|------------------|-------------|
| **1** | **WhatsApp Business API Integration** | Communication | 🔴 Critical | High | ✅ Yes — Prop Data lacks this, Rex is AU/UK focused | Phase 1 |
| | Two-way WhatsApp messaging from CRM. Send property links, follow-ups, FICA requests. Template messages. Click-to-WhatsApp from any contact. Message history logged against contacts. Use a BSP like Twilio or Clickatell. | | | | | |
| **2** | **Property Listings / Mandate Management** | Listings | 🔴 Critical | Medium | ⚠️ Partial — Prop Data has this, but Thina's transaction-first approach is novel | Phase 1 |
| | Track properties with: address, price, bedrooms, features, photos, mandate type (sole/open), mandate expiry, listing status. Link listings to transactions. Mandate expiry reminders. This is the "other half" of a real estate CRM — agents manage properties AND people. | | | | | |
| **3** | **Speed-to-Lead Auto-Response** | AI/Automation | 🔴 Critical | Medium | ✅ Yes — no SA CRM does this well | Phase 1 |
| | When a portal lead arrives (Property24/Private Property), automatically send a WhatsApp template within 60 seconds: "Hi {name}, thanks for your enquiry about {property_address}. I'm {agent_name}. Would you like to schedule a viewing? Here are some times: ...". First agent to respond wins 78% of the time. Requires WhatsApp integration (#1) and portal injection (already planned v0.11.0). | | | | | |
| **4** | **Automated Follow-up Sequences** | Communication | 🟠 High | Medium | ✅ Yes — unique in SA market for individual agents | Phase 1 |
| | Configurable drip campaigns via WhatsApp/SMS/email. Pre-built sequences: "New lead nurture" (Day 0: intro, Day 1: property suggestions, Day 3: viewing invite, Day 7: check-in), "Post-viewing follow-up", "FICA document chase", "Bond application check-in". Agents just click "Start sequence" on a lead. | | | | | |
| **5** | **Buyer Requirement Profiles + Auto-Matching** | Listings | 🟠 High | Medium | ✅ Yes — individual-agent level matching is rare | Phase 2 |
| | Capture what each buyer is looking for: price range, areas, bedrooms, property type, must-haves. When a new listing is added or a price drops, auto-notify matching buyers via WhatsApp. "Hi {name}, a new 3-bed in Sandton just listed at R2.8M — matches what you're looking for. Want to see it?" | | | | | |
| **6** | **Open House / Show Day Mode** | Mobile/Lead Gen | 🟠 High | Low | ✅ Yes — no competitor has dedicated show day UX | Phase 1 |
| | Dedicated mobile UI for Saturday show days. QR code at property entrance → visitors scan → mini form (name, phone, email, budget, current area, pre-approved?). Leads auto-created in CRM with source="Show Day: {property_address}". Post-show-day summary report. Follow-up sequence auto-started for each captured lead. | | | | | |
| **7** | **POPIA Consent Management** | Compliance | 🟠 High | Low | ⚠️ Partial — basic requirement, but proper implementation is rare | Phase 2 |
| | Consent capture at lead creation ("I consent to {agency} contacting me about property"). Consent timestamp stored. Opt-out mechanism (one-click unsubscribe). Data export on request (POPIA Section 23 right of access). Data deletion workflow. Consent audit trail. Marketing consent separate from transactional consent. | | | | | |
| **8** | **FICA Compliance Dashboard** | Compliance | 🟠 High | Low | ⚠️ Partial — Thina has basic FICA tracking, this expands it significantly | Phase 2 |
| | Dedicated compliance view: which transactions have complete FICA for both buyer and seller? Document expiry warnings (proof of address > 3 months). One-click "Send FICA reminder" via WhatsApp. FICA completion percentage per transaction. Compliance report for agency principal. 5-year retention tracking. Suspicious transaction flagging. | | | | | |
| **9** | **SMS Integration (BulkSMS/Clickatell)** | Communication | 🟠 High | Low | ❌ No — standard, but necessary | Phase 1 |
| | Fallback when WhatsApp isn't available. Automated notifications: "New viewing confirmed for Saturday 10am at 12 Main Rd, Sandton". Bulk SMS for "Just Listed" announcements to buyer database. Pay-per-SMS model. SA providers: BulkSMS.co.za (local, reliable), Clickatell (SA-founded, global). | | | | | |
| **10** | **Commission Forecasting & VAT Threshold Tracker** | Financial | 🟠 High | Low | ✅ Yes — VAT threshold tracking is uniquely SA | Phase 2 |
| | Pipeline-weighted commission forecast: sum of (commission × stage probability). Monthly/quarterly projection graphs. **Critical: VAT threshold tracker** — running YTD commission total with R1,000,000 marker. Alert when approaching threshold (R800K, R900K, R950K). "You'll likely cross the VAT threshold in {month} based on current pipeline." Tax estimate: provisional tax calculator based on projected annual income. | | | | | |
| **11** | **Document Upload & Management** | Documents | 🟡 Medium-High | Medium | ⚠️ Partial — basic in competitors, but mobile-first approach differentiates | Phase 2 |
| | Per-transaction document hub. Phone camera → upload FICA docs directly. Document categories: FICA (buyer), FICA (seller), OTP, Bond Application, Compliance Certs, Mandate. Status per doc: pending, uploaded, verified. Firebase Storage for secure file hosting. Share documents with conveyancers via secure link. | | | | | |
| **12** | **Lightstone Property Data Integration** | Integrations | 🟡 Medium-High | High | ✅ Yes — no individual-agent CRM integrates Lightstone | Phase 3 |
| | Pull property data into CRM: estimated value, ownership history, suburb statistics, recent area sales. Use for: CMA reports for sellers, price guidance when listing, buyer education on area trends. Lightstone offers Property Reports, Suburb Reports, Seller Reports, Buyer Reports. Subscription-based API access. Would transform Thina from a "CRM with data entry" to a "CRM with market intelligence." | | | | | |
| **13** | **Lead Source ROI Reporting** | Reporting | 🟡 Medium | Low | ✅ Yes — most SA CRMs don't track cost-per-lead by source | Phase 2 |
| | Track marketing spend per source (Property24: R2,500/mo, Facebook Ads: R3,000/mo, Lightstone: R500/mo). Calculate: cost per lead, cost per qualified lead, cost per transaction, ROI per source. Dashboard widget: "Property24 generated 15 leads, 3 deals, R180K commission this quarter. Cost: R7,500. ROI: 24x." Helps agents allocate marketing budget intelligently. | | | | | |
| **14** | **CPD Points Tracker** | Compliance | 🟡 Medium | Low | ✅ Yes — no CRM includes this | Phase 3 |
| | Log CPD activities: course name, provider, date, points earned, category (ethics/legislation/practical). Annual target progress bar. Reminder when behind schedule. Upload certificates. Track FFC renewal date and send 60/30/7-day reminders. Small feature but builds loyalty — agents check it regularly. | | | | | |
| **15** | **Bond Originator Referral Links** | Integrations | 🟡 Medium | Low | ⚠️ Partial — useful but basic | Phase 3 |
| | One-click referral to ooba or BetterBond from transaction detail page. Pre-fill buyer details in referral link/form. Track bond application status manually (applied → approved → declined). Bond originators handle all banks (ABSA, FNB, Nedbank, Standard Bank, Investec) — agents benefit from tracking which bank approved. Pre-approval status on buyer contact record. | | | | | |

---

## Implementation Phases

### Phase 1 — "Must Have Now" (v0.13–v0.15)
*Focus: Communication and lead capture — the daily workflow*

1. **WhatsApp Business API Integration** — via Twilio/Clickatell BSP
2. **SMS Integration** — BulkSMS or Clickatell
3. **Speed-to-Lead Auto-Response** — WhatsApp template on portal lead arrival
4. **Automated Follow-up Sequences** — configurable drip campaigns
5. **Open House / Show Day Mode** — QR code lead capture
6. **Property Listings / Mandate Management** — the other half of real estate CRM

### Phase 2 — "Competitive Edge" (v0.16–v0.18)
*Focus: Compliance, intelligence, and financial tracking*

7. **POPIA Consent Management**
8. **FICA Compliance Dashboard**
9. **Buyer Requirement Profiles + Auto-Matching**
10. **Commission Forecasting & VAT Threshold Tracker**
11. **Document Upload & Management**
12. **Lead Source ROI Reporting**

### Phase 3 — "Market Leadership" (v0.19+)
*Focus: Data integrations and professional development*

13. **Lightstone Property Data Integration**
14. **CPD Points Tracker**
15. **Bond Originator Referral Links**

---

## Competitive Landscape Summary

| Feature Area | Thina CRM (Current) | Prop Data | Rex | Flow |
|---|---|---|---|---|
| **Lead Management** | ✅ Full CRUD + scoring | ✅ Portal integration | ✅ Prospecting & capture | ✅ Basic |
| **Transaction Pipeline** | ✅ 9-stage SA pipeline | ⚠️ Basic | ✅ Full pipeline | ✅ Core focus |
| **Commission Calculator** | ✅ VAT + splits | ⚠️ Unknown | ✅ Trust accounting | ✅ Basic |
| **WhatsApp Integration** | ❌ | ❌ | ❌ (AU/UK focused) | ❌ |
| **Property Listings** | ❌ | ✅ Full syndication | ✅ Full portfolio mgmt | ⚠️ Basic |
| **FICA Compliance** | ⚠️ Basic checklist | ⚠️ Unknown | ❌ (not SA) | ⚠️ Basic |
| **Mobile App** | ⚠️ PWA (responsive) | ⚠️ Responsive | ✅ Dedicated mobile app | ⚠️ Unknown |
| **Auto Follow-up** | ❌ | ⚠️ Email only | ✅ Workflow automation | ❌ |
| **Lightstone Integration** | ❌ | ✅ Partnership | ❌ | ❌ |
| **AI Features** | ⚠️ Lead scoring | ❌ | ✅ AI content generation | ❌ |
| **Price** | Free/Low cost | From R259/mo | Premium (AU pricing) | Unknown |
| **Target Market** | Individual agents, small agencies | Agencies & groups | Medium-large agencies | Transaction management |

**Thina's key differentiators should be:**
1. **WhatsApp-native** — first SA real estate CRM built around WhatsApp as primary communication
2. **Individual agent focused** — Prop Data and Rex target agencies; Thina targets the individual agent or small team
3. **SA compliance built-in** — FICA, POPIA, EAAB, VAT threshold — not bolted on
4. **Affordable** — compete on price against Prop Data's R259+/mo
5. **Speed-to-lead automation** — the #1 thing that wins deals in SA real estate

---

## Technical Notes

- **WhatsApp Business API**: Requires Facebook Business verification, WhatsApp Business account, and a BSP (Business Solution Provider). Recommended: Twilio (best docs, Firebase Cloud Functions compatible) or Clickatell (SA-founded). Cost: ~R0.50-R1.50 per conversation per 24h window.
- **SMS**: BulkSMS.co.za REST API, ~R0.30-R0.45 per SMS depending on volume.
- **Firebase Cloud Functions**: Ideal for webhook handlers (portal lead parsing, WhatsApp webhooks, SMS callbacks).
- **Firebase Storage**: For document uploads with security rules per user/transaction.
- **Lightstone API**: Requires commercial subscription. Contact Lightstone directly for API access and pricing.
- **Next.js PWA**: Already a good foundation for mobile — add service worker for offline, push notifications via Firebase Cloud Messaging.

---

*This research document should be updated as features are implemented and market conditions change.*
