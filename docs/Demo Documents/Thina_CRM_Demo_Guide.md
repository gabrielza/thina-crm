# Thina CRM — Demo Guide

**Version:** 0.12.0  
**Date:** April 2026  
**Application URL:** https://thina-crm--thina-crm.europe-west4.hosted.app  
**Estimated Demo Time:** 30–45 minutes (full) | 15–20 minutes (express)

---

## Table of Contents

1. [Pre-Demo Checklist](#1-pre-demo-checklist)
2. [Demo Flow Overview](#2-demo-flow-overview)
3. [Opening — Login & First Impressions](#3-opening--login--first-impressions)
4. [Act 1 — Command Centre (Dashboard)](#4-act-1--command-centre-dashboard)
5. [Act 2 — Lead Generation (Prospecting)](#5-act-2--lead-generation-prospecting)
6. [Act 3 — Working the Pipeline](#6-act-3--working-the-pipeline)
7. [Act 4 — Property Listings & Valuations](#7-act-4--property-listings--valuations)
8. [Act 5 — Closing the Deal (Transactions)](#8-act-5--closing-the-deal-transactions)
9. [Act 6 — Running the Business (Operations)](#9-act-6--running-the-business-operations)
10. [Closing — Wow Moments](#10-closing--wow-moments)
11. [Express Demo Script (15 minutes)](#11-express-demo-script-15-minutes)
12. [Handling Common Questions](#12-handling-common-questions)
13. [Demo Environment Setup](#13-demo-environment-setup)

---

## 1. Pre-Demo Checklist

Complete these steps **before** the audience arrives:

- [ ] Open the app URL in Chrome or Edge (full screen recommended)
- [ ] Ensure you are signed in and on the Dashboard
- [ ] Verify seed data is loaded (dashboard should show KPI numbers, not zeros)
- [ ] If data is empty, navigate to `/seed` and click **"Seed All Data"** (takes ~30 seconds to generate 1,604 records)
- [ ] Set theme to **Dark Mode** for visual impact (or Light Mode if presenting on a projector in a bright room)
- [ ] Close all other browser tabs to avoid distractions
- [ ] Have the Command Palette ready (test `Ctrl+K` to confirm it works)
- [ ] Open a second browser tab to the public Show Day form (find a show day → copy the QR link) for the show day demo
- [ ] Prepare your demo talking points based on the audience:
  - **Estate agents:** Focus on Acts 2–5 (lead capture → pipeline → listings → transactions)
  - **Agency principals:** Focus on Acts 1, 5, and 6 (dashboard, commissions, compliance, reports)
  - **Technical audience:** Show the Command Palette, dark mode, responsive design, and data seeder

---

## 2. Demo Flow Overview

The demo follows a real estate agent's daily workflow in six acts:

```
Login → Dashboard → Lead Generation → Pipeline → Listings → Transactions → Operations
         (2 min)      (5 min)          (8 min)    (5 min)     (5 min)        (5 min)
```

**Narrative:** *"Let me walk you through a typical day as an estate agent using Thina CRM."*

---

## 3. Opening — Login & First Impressions (2 minutes)

### What to Show

1. **Login Screen**
   - Show the clean login page with "Welcome to Thina" heading.
   - Mention: *"Thina means 'Us' in Zulu and Xhosa — it's built for South African real estate."*
   - Show both sign-in options: Google OAuth and email/password.
   - Sign in (use your demo account).

2. **First Impression**
   - As the Dashboard loads, pause and let the audience take in the design.
   - Say: *"This is your command centre. Everything you need to run your agency, in one place."*

### Talking Points
- Modern, clean interface designed for estate agents
- Works on desktop, tablet, and mobile
- Dark mode for agents who work late

---

## 4. Act 1 — Command Centre (Dashboard) (3 minutes)

### What to Show

1. **KPI Cards** — Point to each card:
   - *"Total Leads — how many prospects you're working."*
   - *"Won Deals and Revenue — your closed business."*
   - *"Pipeline Value — what's in play right now."*

2. **Transaction KPIs** — Scroll down slightly:
   - *"Active Transactions, pending commission, and what you've earned."*
   - *"These numbers update in real-time as deals progress."*

3. **Quick Stats** — Click the "Pending Tasks" card:
   - *"Click any card to jump straight to the detail."*
   - Navigate back to Dashboard.

4. **Pipeline Forecast** — Point to the chart:
   - *"This shows your weighted pipeline — the probability-adjusted value of every deal at each stage."*

5. **Recent Activity & Leads** — Scroll to bottom:
   - *"At a glance you can see what happened today and who your latest prospects are."*
   - Click on a recent lead to show the detail page.

### Transition
*"Now let's see how leads get into the system."*

---

## 5. Act 2 — Lead Generation (Prospecting) (5 minutes)

### 5.1 Inbound Lead Capture

**Navigate:** Sidebar → Prospecting → **Inbound Leads**

1. Show the KPI cards: Total, Pending, Accepted.
2. Click **"Paste Lead Email"**.
3. Select "Property24" as the source.
4. Paste a sample portal email (or describe the flow):
   - *"When you get a lead email from Property24 or Private Property, just paste it here."*
   - *"Thina automatically extracts the name, email, phone, and property — no manual typing."*
5. Show a pending lead and click **Accept**:
   - *"One click and it's in your pipeline as a new lead, ready to work."*

### 5.2 Show Day QR Registration

**Navigate:** Sidebar → Prospecting → **Show Days**

1. Click on an existing show day card.
2. Show the **QR code**: *"Print this, put it on a stand at your open house."*
3. Click **"Open Form"** (or switch to the pre-opened tab):
   - Show the clean public form: *"Buyers scan the QR code, fill in their details — no app download needed."*
   - *"You get their name, email, phone, budget, and bedroom needs — instantly."*
4. Show the registrations list: *"All registrations appear here in real-time."*

### 5.3 Speed-to-Lead (Quick Mention)

**Navigate:** Sidebar → Prospecting → **Speed-to-Lead**

- *"Studies show responding within 5 minutes increases conversion by 21x."*
- Show a rule: *"You set up rules like: when a portal lead arrives, instantly SMS them with your details."*
- Point out the delay setting: *"Zero minutes — instant response."*

### Transition
*"So leads are flowing in. Now let's work them."*

---

## 6. Act 3 — Working the Pipeline (8 minutes)

### 6.1 Leads Table

**Navigate:** Sidebar → Pipeline → **Leads**

1. Show the table with search: type a name and show instant filtering.
2. Click the **status filter tabs**: *"Filter by stage — see how your funnel is shaped."*
3. Click **"Add Lead"** — show the slide-over form:
   - Quickly fill in a name and value.
   - *"Fields slide in from the right — you never leave the page."*
   - Cancel (or create if you want).

### 6.2 Pipeline Board — The Hero Moment

**Navigate:** Sidebar → Pipeline → **Pipeline Board**

> **This is the most visual and impressive part of the demo. Take your time here.**

1. Let the board load — 6 columns with colour-coded cards.
2. Point out the **pipeline stats** at the top: total value and won value.
3. **Drag a lead** from "New" to "Contacted":
   - *"Your whole pipeline is drag-and-drop. Move deals through stages as you work them."*
4. **Drag a lead to "Won"**:
   - The system prompts: "Create a Transaction?"
   - *"When you close a deal, Thina offers to create the transaction automatically — seamless handoff from pipeline to deal management."*
   - Click Yes to show the flow (or dismiss).

### 6.3 Contacts

**Navigate:** Sidebar → Pipeline → **Contacts**

- Quick show of the contacts table.
- *"All your contacts in one place — linked to their leads and activities."*

### 6.4 Buyer-Property Matching

**Navigate:** Sidebar → Pipeline → **Buyer Match**

1. Show a buyer profile with matches:
   - *"Tell Thina what your buyer wants — budget, areas, bedrooms — and it automatically matches them to your active listings."*
2. Point to a green match badge: *"3 matches — Thina found 3 properties for this buyer."*

### 6.5 Sequences (Quick Mention)

**Navigate:** Sidebar → Pipeline → **Sequences**

- Show a sequence card with its step timeline.
- *"Automated follow-up campaigns. Day 1: SMS. Day 3: Email. Day 7: WhatsApp. Set it and forget it."*

### Transition
*"Now let's look at the listing side of the business."*

---

## 7. Act 4 — Property Listings & Valuations (5 minutes)

### 7.1 Properties

**Navigate:** Sidebar → Listings → **Properties**

1. Show KPI cards: *"Total listings, active count, portfolio value, and expiring mandates."*
2. Point to a **mandate type badge**: *"Sole, open, dual, or auction — Thina tracks it all."*
3. Point to an **expiring mandate** (amber highlight): *"30-day warning so you never lose a mandate."*
4. Click **"Add Property"** — show the comprehensive form:
   - *"Full property details, mandate tracking, seller info, and feature tags for buyer matching."*

### 7.2 CMA Reports

**Navigate:** Sidebar → Listings → **CMA Reports**

1. Show KPI cards: Total Reports, Avg Value, Price/sqm, Final Reports.
2. Click **"New CMA"** — show the form:
   - *"Comparative Market Analysis. Enter the subject property, add comparable sales..."*
   - Show the comparables section: *"Add recent sales in the area with price, date, size, and distance."*
   - *"Thina auto-calculates the estimated value and price per square metre."*
3. Point to the confidence levels: *"Low, Medium, or High — based on how many good comparables you have."*
4. *"Status goes from Draft to Final to Presented — track every report through its lifecycle."*

### Transition
*"The listing is up, the buyer is matched, they make an offer — now we track the transaction."*

---

## 8. Act 5 — Closing the Deal (Transactions) (5 minutes)

### 8.1 Transaction List

**Navigate:** Sidebar → Transactions → **Deals**

1. Show the transactions table with stage filter tabs.
2. *"9 stages from OTP Signed through to Commission Paid — the full SA conveyancing process."*
3. Click on a transaction row to show the **detail page**:
   - **Stage Timeline**: *"Visual progress bar showing exactly where this deal is."*
   - **Commission Card**: *"Sale price, commission rate, gross commission, VAT at 15%, and your net take-home."*
   - **FICA Status**: *"Buyer and seller FICA compliance tracked right here."*
   - **Parties**: *"Conveyancer, bond originator — everyone involved."*

### 8.2 Document Vault

**Navigate:** Sidebar → Transactions → **Documents**

- *"All transaction documents in one place — FICA docs, OTPs, mandates, bond applications."*
- Show the type badges: *"Organised by type so you can find anything instantly."*

### Transition
*"The deal is closed. Now let's run the business."*

---

## 9. Act 6 — Running the Business (Operations) (5 minutes)

### 9.1 Tasks

**Navigate:** Sidebar → Operations → **Tasks**

1. Show KPI cards: Pending, Overdue, Due Today, Completed.
2. Show an **overdue task** with red highlighting: *"Nothing slips through the cracks."*
3. Click a checkbox to complete a task: *"One click to mark it done."*

### 9.2 Reports & Analytics

**Navigate:** Sidebar → Operations → **Reports**

1. Show the charts: *"Pipeline by stage, revenue by source, activity trends."*
2. Show the **export buttons**: *"One click to export leads, contacts, or tasks to CSV for Excel."*
3. Show the **Lead ROI** page (quick jump via sidebar):
   - *"Which lead sources give you the best ROI? Track cost-per-lead and cost-per-deal."*

### 9.3 Compliance

**Navigate:** Sidebar → Operations → **Compliance**

1. **POPIA Tab**: *"Track marketing consent for every contact — required by law."*
2. **FICA Tab**: *"Bird's-eye view of FICA compliance across all transactions."*
3. **Commission & VAT Tab**: *"Track your income against the R1M VAT threshold."*
   - Show the progress bar: *"You can see exactly how close you are."*
4. **CPD Tab**: *"Log your CPD hours for FFC renewal."*

---

## 10. Closing — Wow Moments (2 minutes)

Finish the demo with these impressive features:

### 10.1 Command Palette

- Press **Ctrl+K**: *"Navigate anywhere in the app without touching the mouse."*
- Type "add lead": *"Quick actions — create records from anywhere."*
- Type "dark": *"Even switch themes."*

### 10.2 Mobile Responsive

- If possible, resize the browser window to mobile width (or show on a phone):
  - *"The entire app works on your phone. Check your pipeline from a viewing, update a deal from the Deeds Office."*
  - Show the bottom nav bar and slide-up menu.

### 10.3 Dark Mode Toggle

- Toggle the theme: *"Because estate agents work late and their eyes deserve it."*

### Closing Statement

> *"Thina CRM was designed specifically for South African estate agents. From portal lead capture to commission tracking, from POPIA compliance to CMA valuations — everything you need to run your business, in one system. Thina means 'Us' — because we built it for you."*

---

## 11. Express Demo Script (15 minutes)

For shorter demos, use this streamlined flow:

| Time | Screen | What to Show |
|------|--------|--------------|
| 0:00 | Login | Sign in, mention Google + email options |
| 0:30 | Dashboard | KPI cards, transaction KPIs, quick stats |
| 2:00 | Pipeline Board | **Drag-and-drop** a lead through stages, drop one on "Won" to show transaction creation |
| 4:00 | Leads | Search, status filters, add lead slide-over form |
| 5:30 | Show Days | QR code, open the public form, show registrations |
| 7:00 | Properties | KPI cards, mandate tracking, expiry warnings |
| 8:00 | CMA Reports | New CMA form, comparables, auto-calculated valuation |
| 9:30 | Transactions | Detail page with stage timeline, commission calculator, FICA status |
| 11:00 | Compliance | POPIA tab, VAT threshold progress bar |
| 12:30 | Reports | Charts, CSV export buttons |
| 13:00 | Command Palette | `Ctrl+K`, search "add lead", toggle dark mode |
| 14:00 | Mobile view | Resize browser, show bottom nav |
| 14:30 | Closing | *"Built for SA estate agents. Thina means Us."* |

---

## 12. Handling Common Questions

| Question | Suggested Answer |
|----------|-----------------|
| "Does it work on my phone?" | Yes — fully responsive. Show the mobile bottom nav. |
| "Can I import my existing data?" | Currently supports portal email import (Property24, Private Property). CSV import is on the roadmap. |
| "Is my data safe?" | Hosted on Google Cloud (Firebase). All data is encrypted in transit and at rest. Authentication required for all operations. |
| "How many users can it support?" | Multi-user — each agent sees their own data. Authenticated via Google or email. |
| "Does it send real SMSes?" | The SMS framework is built and ready. It integrates with BulkSMS or Clickatell for live sending. |
| "Is it POPIA compliant?" | Yes — full consent tracking, data subject request management, and audit trail. |
| "How much does it cost?" | [Adjust based on your pricing model] |
| "Can I try it?" | Absolutely — let me set you up with an account right now. |
| "What about commission splits?" | The commission calculator supports splits, VAT at 15%, and shows agent net commission. |
| "Does it track my CPD points?" | Yes — the Compliance page has a CPD tracker with verifiable/non-verifiable hours and FFC renewal countdown. |

---

## 13. Demo Environment Setup

### Seeding Test Data

If the demo environment is empty:

1. Navigate to `/seed` (or use Command Palette → "Seed Sample Data").
2. Click **"Seed All Data"**.
3. Wait for the progress bar to complete (~30 seconds).
4. **Result:** 1,604 realistic records across 16 collections:
   - 200 contacts, 500 leads, 300 activities, 200 tasks
   - 150 transactions, 120 properties, 30 show days
   - 80 inbound leads, 200 SMS messages
   - 8 sequences, 50 buyer profiles, 40 CMA reports, and more.

### Clearing Data

If you need a fresh start:
1. Navigate to `/seed`.
2. Click **"Clear All"** and confirm.
3. Re-seed with fresh data.

### Demo Accounts

- Create demo accounts via the login page "Create Account" flow.
- Each user only sees their own data (owner-based security).

### Browser Recommendations

- **Chrome** or **Edge** — best performance and compatibility
- Use **full-screen mode** (F11) for presentations
- Disable browser notifications and extensions that show popups

---

*This demo guide covers Thina CRM v0.12.0. Update talking points as new features are added.*
