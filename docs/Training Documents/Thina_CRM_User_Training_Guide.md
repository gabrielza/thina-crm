# Thina CRM — User Training Guide

**Version:** 0.12.0  
**Date:** April 2026  
**Application URL:** https://thina-crm--thina-crm.europe-west4.hosted.app

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Navigating Thina](#2-navigating-thina)
3. [Dashboard Overview](#3-dashboard-overview)
4. [Managing Leads](#4-managing-leads)
5. [Pipeline Board](#5-pipeline-board)
6. [Managing Contacts](#6-managing-contacts)
7. [Task Management](#7-task-management)
8. [Transactions & Commissions](#8-transactions--commissions)
9. [Property Listings](#9-property-listings)
10. [CMA Reports](#10-cma-reports)
11. [Show Days & Open Houses](#11-show-days--open-houses)
12. [Inbound Lead Capture](#12-inbound-lead-capture)
13. [Speed-to-Lead Auto-Response](#13-speed-to-lead-auto-response)
14. [Follow-up Sequences](#14-follow-up-sequences)
15. [Messaging (SMS)](#15-messaging-sms)
16. [Buyer-Property Matching](#16-buyer-property-matching)
17. [Document Vault](#17-document-vault)
18. [Lead ROI Analytics](#18-lead-roi-analytics)
19. [Reports & Data Export](#19-reports--data-export)
20. [Compliance (POPIA, FICA, VAT, CPD)](#20-compliance-popia-fica-vat-cpd)
21. [Command Palette & Shortcuts](#21-command-palette--shortcuts)
22. [Tips & Best Practices](#22-tips--best-practices)

---

## 1. Getting Started

### 1.1 Signing In

1. Open the Thina CRM URL in your browser (Chrome, Edge, or Firefox recommended).
2. On the login screen you will see **"Welcome to Thina"**.
3. Choose your sign-in method:
   - **Google Sign-In** — Click "Continue with Google" and select your Google account.
   - **Email & Password** — Enter your email and password, then click "Sign In".
4. **First-time users:** Click "Create Account" to switch to sign-up mode, fill in your email and password, then click "Sign Up".
5. After successful authentication you will be redirected to the Dashboard.

### 1.2 Signing Out

1. Look at the bottom of the sidebar (left-hand panel).
2. You will see your avatar, name, and email.
3. Click the **Sign Out** button to log out.

### 1.3 Switching Themes

Thina supports **Light Mode** and **Dark Mode**.

- Click the **sun/moon icon** at the bottom of the sidebar to toggle between themes.
- You can also use the Command Palette (`Ctrl+K`) and search for "Light Mode", "Dark Mode", or "System".

---

## 2. Navigating Thina

### 2.1 Sidebar Navigation

The left sidebar is organised into six workflow groups that follow your sales process:

| Group | Pages | Purpose |
|-------|-------|---------|
| **Overview** | Dashboard | Your daily snapshot — KPIs and agency health |
| **Prospecting** | Inbound Leads, Show Days, Speed-to-Lead, Lead ROI | Generate and capture new leads |
| **Pipeline** | Leads, Pipeline Board, Contacts, Buyer Match, Sequences, Messaging | Nurture, qualify, and communicate with leads |
| **Listings** | Properties, CMA Reports | Manage your property inventory and valuations |
| **Transactions** | Deals, Documents | Close the deal — OTP through commission |
| **Operations** | Tasks, Reports, Compliance | Run the business — tasks, analytics, POPIA/FICA |

Click any item in the sidebar to navigate to that page.

### 2.2 Mobile Navigation

On mobile devices, the sidebar is replaced by a **bottom tab bar** showing the first 4 navigation items plus a **"More"** button. Tap "More" to see a slide-up menu with all navigation groups.

### 2.3 Command Palette (Quick Navigation)

Press **Ctrl+K** (or **Cmd+K** on Mac) to open the Command Palette. Type any page name to instantly navigate, or use quick actions like "Add Lead" or "New Transaction".

---

## 3. Dashboard Overview

The Dashboard is your home screen. It shows a personalised greeting and a complete overview of your business.

### What You'll See

| Section | What It Shows |
|---------|---------------|
| **KPI Cards (Row 1)** | Total Leads, Won Deals, Won Revenue, Pipeline Value |
| **Quick Stats** | Contacts count, Pending Tasks, Overdue Tasks, Total Activities |
| **Transaction KPIs** | Active Transactions, Pending Commission, Expected Income, Earned Commission |
| **Pipeline Forecast** | Weighted pipeline value by probability of close |
| **Charts** | Visual lead data analysis |
| **Recent Activity** | Last 8 interactions (calls, emails, meetings, notes) |
| **Recent Leads** | Last 5 leads with status and value — click to view detail |

> **Tip:** Click on any KPI card to jump directly to the related page.

---

## 4. Managing Leads

**Path:** Sidebar → Pipeline → **Leads**

### 4.1 Viewing Leads

- The Leads page shows all your leads in a table.
- Use the **search bar** to find leads by name, email, or company.
- Use the **status filter tabs** (All, New, Contacted, Qualified, Proposal, Won, Lost) to filter the list. Each tab shows a count.

### 4.2 Adding a New Lead

1. Click the **"Add Lead"** button (top right).
2. A slide-over form appears on the right.
3. Fill in the details:
   - **Name** (required)
   - **Email**, **Phone**, **Company**
   - **Status** — select from: New, Contacted, Qualified, Proposal, Won, Lost
   - **Source** — where this lead came from
   - **Value** — the estimated deal value in Rands
   - **Contact** — optionally link to an existing contact
   - **Notes**
4. Click **"Create Lead"** to save.

### 4.3 Editing a Lead

1. In the leads table, hover over a row to reveal the action icons.
2. Click the **pencil icon** to open the edit form.
3. Update the fields and click **"Save Changes"**.

### 4.4 Deleting a Lead

1. Hover over the lead row and click the **trash icon**.
2. Confirm the deletion when prompted.

### 4.5 Viewing Lead Detail

Click on any lead's **name** in the table to open their detail page, which shows:
- Full lead information
- Activity timeline
- Linked contact information
- Score and status

---

## 5. Pipeline Board

**Path:** Sidebar → Pipeline → **Pipeline Board**

The Pipeline Board gives you a visual Kanban view of all your leads across 6 stages.

### 5.1 Pipeline Stages

| Stage | Colour | Meaning |
|-------|--------|---------|
| New | Blue | Fresh lead, not yet contacted |
| Contacted | Violet | Initial contact made |
| Qualified | Amber | Lead meets your criteria |
| Proposal | Orange | Offer or proposal sent |
| Won | Green | Deal closed successfully |
| Lost | Red | Lead did not convert |

### 5.2 Moving Leads Between Stages

1. **Drag** a lead card by the grip icon on the left.
2. **Drop** it onto the target stage column.
3. The lead's status updates immediately.

> **Special:** When you drag a lead to **Won**, Thina will ask if you want to create a Transaction for this deal.

### 5.3 Pipeline Stats

At the top of the page you'll see:
- **Pipeline Value** — total value of all active deals
- **Won Value** — total value of closed deals

---

## 6. Managing Contacts

**Path:** Sidebar → Pipeline → **Contacts**

### 6.1 Viewing Contacts

- Contacts are displayed in a searchable table.
- Search by name, email, or company.

### 6.2 Adding a Contact

1. Click **"Add Contact"**.
2. Fill in: Name, Email, Phone, Company, Title, Notes.
3. Click **"Create Contact"**.

### 6.3 Editing & Deleting

- **Edit:** Click the pencil icon on any row.
- **Delete:** Click the trash icon and confirm.
- **Quick actions:** Click the email icon to send an email, or the phone icon to call.

### 6.4 Contact Detail Page

Click a contact's name to view their full profile, including linked leads and activity history.

---

## 7. Task Management

**Path:** Sidebar → Operations → **Tasks**

### 7.1 Overview

The Tasks page helps you track to-dos and follow-ups with four KPI cards:
- **Pending** — tasks waiting to be done
- **Overdue** — past due date (shown in red)
- **Due Today** — tasks due today
- **Completed** — finished tasks

### 7.2 Creating a Task

1. Click **"New Task"** to reveal the inline form.
2. Fill in:
   - **Title** (required)
   - **Description**
   - **Due Date** (required)
   - **Priority** — Low, Medium, or High
3. Click **"Create Task"**.

### 7.3 Managing Tasks

- **Complete a task:** Click the circular checkbox on the left of the task.
- **Filter tasks:** Use the tabs (All, Pending, Overdue, Completed).
- **Delete a task:** Click the delete button on the task card.

> **Note:** Overdue tasks are highlighted with a red border and red date. Tasks are sorted by priority (High → Medium → Low), with completed tasks at the bottom.

---

## 8. Transactions & Commissions

**Path:** Sidebar → Transactions → **Deals**

### 8.1 Understanding Transaction Stages

Transactions follow a 9-stage workflow reflecting the SA real estate process:

| # | Stage | Description |
|---|-------|-------------|
| 1 | OTP Signed | Offer to Purchase signed by both parties |
| 2 | FICA Submitted | FICA documents submitted for verification |
| 3 | FICA Verified | FICA documents verified and approved |
| 4 | Bond Applied | Bond application submitted to bank |
| 5 | Bond Approved | Bond approved by bank |
| 6 | Transfer Lodged | Transfer documents lodged with Deeds Office |
| 7 | Transfer Registered | Transfer registered at Deeds Office |
| 8 | Commission Paid | Commission received — deal complete |
| — | Fallen Through | Deal cancelled at any point |

### 8.2 Creating a Transaction

1. Click **"New Transaction"**.
2. Fill in the form:
   - **Property Address** and sale details
   - **Sale Price** and **Commission Rate (%)**
   - Toggle **VAT Included** if registered for VAT
   - **Buyer Name**, **Seller Name**
   - **Conveyancer**, **Bond Originator**
   - **Notes** and optionally link to a Lead
3. The form auto-calculates: Gross Commission, VAT Amount, and Agent Net Commission.
4. Click **"Create Transaction"**.

### 8.3 Filtering & Searching

- Use the **search bar** to find transactions by address, buyer, or seller name.
- Use the **stage filter tabs** to view transactions at specific stages.

### 8.4 Transaction Detail Page

Click a transaction row to view full details including:
- Stage timeline with visual progress
- Commission calculator breakdown
- FICA compliance status for buyer and seller
- Parties involved (buyer, seller, conveyancer, bond originator)
- Key dates and stage history

### 8.5 Transaction Pipeline Board

**Path:** Sidebar → Transactions → **Deals** → Pipeline view

A Kanban board showing transactions across all 9 stages with drag-and-drop.

---

## 9. Property Listings

**Path:** Sidebar → Listings → **Properties**

### 9.1 Overview

The Properties page manages your property listings with KPI cards:
- **Total Listings** — all properties
- **Active** — currently listed
- **Portfolio Value** — total value of active listings
- **Expiring Soon** — mandates expiring within 30 days

### 9.2 Adding a Property

1. Click **"Add Property"**.
2. Fill in the form:
   - **Location:** Address, Suburb, City
   - **Details:** Type (house/apartment/townhouse/land/commercial/farm), Asking Price, Beds, Baths, Garages, Erf Size, Floor Size
   - **Mandate:** Type (sole/open/dual/auction), Status, Start & End Date
   - **Description & Features** — add feature tags like "pool", "security estate", "sea view"
   - **Seller Details:** Name, Phone, Email
3. Click **"Create Property"**.

### 9.3 Mandate Tracking

Properties display their mandate type as a colour-coded badge:
- **Sole** — exclusive listing
- **Open** — multiple agents
- **Dual** — shared mandate
- **Auction** — auction listing

> **Warning:** Properties with mandates expiring within 30 days are highlighted in amber.

---

## 10. CMA Reports

**Path:** Sidebar → Listings → **CMA Reports**

Comparative Market Analysis reports help you value properties using comparable sales data.

### 10.1 Overview

KPI cards show:
- **Total Reports** — all CMA reports
- **Avg Estimated Value** — average property valuation
- **Avg Price/sqm** — average price per square metre
- **Final Reports** — reports marked as final or presented

### 10.2 Creating a CMA Report

1. Click **"New CMA"**.
2. **Subject Property** section: Enter the property details (address, suburb, city, type, beds, baths, erf size, floor size).
3. **Comparables** section: Add comparable sales:
   - Click "Add Comparable"
   - Enter: Address, Suburb, Sale Price, Sale Date, Beds, Baths, Erf Size, Floor Size, Days on Market, Notes
   - Add as many comparables as needed (3+ recommended for high confidence)
4. **Valuation** section: The estimated value and price/sqm can be auto-calculated from comparables.
5. Set the **Confidence Level** (Low/Medium/High) and **Status** (Draft/Final/Presented).
6. Click **"Create Report"**.

### 10.3 Confidence Levels

| Level | Meaning |
|-------|---------|
| **Low** | Few comparables or significant differences |
| **Medium** | Reasonable comparable data available |
| **High** | Strong comparable data, 3+ similar recent sales |

### 10.4 Report Status Workflow

**Draft** → **Final** → **Presented**
- Start in Draft while gathering data
- Mark as Final when the valuation is confirmed
- Mark as Presented after sharing with the client

---

## 11. Show Days & Open Houses

**Path:** Sidebar → Prospecting → **Show Days**

### 11.1 Creating a Show Day

1. Click **"New Show Day"**.
2. Enter: Property Address, Date, Time Slot, Notes.
3. Click **"Create"**.

### 11.2 QR Code Lead Capture

Each show day automatically generates a **QR code** that links to a public registration form.

1. Click on a show day card to view the detail.
2. You'll see a large QR code with **"Copy Link"** and **"Open Form"** buttons.
3. **Print the QR code** and display it at your open house.
4. Visitors scan the QR code with their phone and fill in: Name, Email, Phone, Budget, Bedrooms, Notes, and Marketing Consent.
5. Registrations appear in real-time in the show day detail view.

> **Key advantage:** The public registration form requires **no login** — buyers simply scan and register.

---

## 12. Inbound Lead Capture

**Path:** Sidebar → Prospecting → **Inbound Leads**

### 12.1 Importing Portal Leads

When you receive a lead notification email from Property24 or Private Property:

1. Click **"Paste Lead Email"**.
2. Select the **Source** (Property24, Private Property, or Manual).
3. Paste the full email notification text.
4. Click **"Parse & Import"** — Thina auto-extracts: Name, Email, Phone, Property Reference, Address, and Message.
5. The lead appears in your inbound queue with status **Pending**.

### 12.2 Accepting or Rejecting Leads

- **Accept:** Click the green check button → the lead is automatically created in your Pipeline as a new lead.
- **Reject:** Click the red X button → the lead is marked as rejected.

### 12.3 Filtering

Use the tabs to filter: All, Pending, Accepted, Rejected.

---

## 13. Speed-to-Lead Auto-Response

**Path:** Sidebar → Prospecting → **Speed-to-Lead**

### 13.1 Why Speed Matters

Studies show that responding to a lead within 5 minutes increases conversion by 21x. Speed-to-Lead lets you set up automatic response rules.

### 13.2 Creating a Rule

1. Click **"New Rule"**.
2. Configure:
   - **Rule Name** — e.g. "Instant Portal Response"
   - **Trigger** — when to fire: New Lead Created, Portal Lead Received, or Show Day Registration
   - **Enabled** toggle
   - **Agent Name** and **Phone** (used in templates)
   - **Delay** — minutes before sending (0 = instant)
   - **Message Template** — use variables: `{{name}}`, `{{property}}`, `{{agent_name}}`, `{{agent_phone}}`
3. Click **"Create Rule"**.

### 13.3 Managing Rules

- Toggle the **active switch** to enable/disable a rule.
- Click the **pencil icon** to edit.
- Click **delete** to remove.

---

## 14. Follow-up Sequences

**Path:** Sidebar → Pipeline → **Sequences**

Sequences are automated drip campaigns that send messages over time.

### 14.1 Creating a Sequence

1. Click **"New Sequence"**.
2. Enter a **Sequence Name** and select the **Trigger**:
   - New Lead Created
   - Show Day Registration
   - Proposal Sent
   - Manual Enrollment
3. **Add Steps:** Each step has:
   - **Day** — number of days after enrollment (e.g. Day 1, Day 3, Day 7)
   - **Channel** — SMS, Email, or WhatsApp
   - **Message Template** — supports `{name}` and `{property}` variables
4. Add as many steps as you need.
5. Click **"Create Sequence"**.

### 14.2 Managing Sequences

- **Pause/Resume:** Click the play/pause button on any sequence card.
- **View steps:** Each sequence shows a visual timeline of its steps.
- **Delete:** Remove a sequence entirely.

---

## 15. Messaging (SMS)

**Path:** Sidebar → Pipeline → **Messaging**

### 15.1 Overview

Track all SMS messages with KPI cards: Total, Sent, Queued, Failed.

### 15.2 Sending a Message

1. Click **"Compose"**.
2. Optionally select a **Contact** (auto-fills the phone number).
3. Enter or confirm the **Phone Number**.
4. Type your **Message** (160 character limit with countdown).
5. Click **"Send SMS"**.

### 15.3 Message History

The table shows all messages with: delivery status icon, recipient phone number, message preview, status badge, and date.

---

## 16. Buyer-Property Matching

**Path:** Sidebar → Pipeline → **Buyer Match**

### 16.1 How Matching Works

Thina automatically matches buyer profiles against your active property listings based on: budget range, preferred areas (suburb/city), property type, bedrooms, and bathrooms.

### 16.2 Creating a Buyer Profile

1. Click **"New Buyer Profile"**.
2. Select a **Contact** from your contacts list.
3. Enter criteria: Min/Max Budget, Areas (suburbs/cities), Property Types, Min Bedrooms, Min Bathrooms, Desired Features, Notes.
4. Click **"Create Profile"**.

### 16.3 Viewing Matches

Each buyer profile card shows:
- Contact name and criteria summary
- A **match count badge** (green if matches found)
- Matched properties listed with address, type, price, and specs

---

## 17. Document Vault

**Path:** Sidebar → Transactions → **Documents**

### 17.1 Overview

Centralised document storage organised by type: FICA, OTP, Mandate, Bond, Transfer, Other.

### 17.2 Uploading a Document

1. Click **"Upload"**.
2. Enter: Document Name, Type, and optionally link to a Transaction or Contact.
3. Select the file.
4. Click **"Upload"**.

### 17.3 Finding Documents

- Use the **search bar** to find by name or type.
- KPI cards show counts by category: Total, FICA, OTPs, Other.

---

## 18. Lead ROI Analytics

**Path:** Sidebar → Prospecting → **Lead ROI**

### 18.1 Tracking Source Performance

This page shows which lead sources give you the best return on investment.

**KPI Cards:** Total Leads, Won Revenue, Annual Spend, Overall ROI.

### 18.2 Setting Source Costs

1. Click **"Set Source Cost"**.
2. Enter the **monthly cost** for each lead source (e.g. Property24 subscription = R2,500/month).
3. Save — costs are stored locally.

### 18.3 Understanding the ROI Table

| Column | Meaning |
|--------|---------|
| Source | Lead source name |
| Total Leads | Number of leads from this source |
| Won | Leads that converted to deals |
| Conversion Rate | Won ÷ Total as a percentage |
| Won Revenue | Revenue from converted leads |
| Monthly Cost | What you spend per month |
| Annual Cost | Monthly × 12 |
| Cost/Lead | Annual cost ÷ total leads |
| Cost/Deal | Annual cost ÷ won leads |
| ROI% | (Revenue − Cost) ÷ Cost × 100 |

---

## 19. Reports & Data Export

**Path:** Sidebar → Operations → **Reports**

### 19.1 Available Reports

| Report | Type | What It Shows |
|--------|------|---------------|
| Pipeline by Stage | Bar chart | Lead count and value per stage |
| Lead Status Distribution | Pie chart | Breakdown of lead statuses |
| Revenue by Source | Pie chart | Won revenue by lead source |
| Activity Trend | Line chart | 30-day activity count |
| Activity by Type | Pie chart | Calls vs emails vs meetings vs notes |
| Top Deals | Table | Top 10 leads by value |

### 19.2 Exporting Data

Click the export buttons at the top of the page:
- **"Leads CSV"** — exports all leads
- **"Contacts CSV"** — exports all contacts
- **"Tasks CSV"** — exports all tasks

CSV files are downloaded to your browser's default download folder and can be opened in Excel.

---

## 20. Compliance (POPIA, FICA, VAT, CPD)

**Path:** Sidebar → Operations → **Compliance**

This page has four tabs covering South African regulatory requirements.

### 20.1 POPIA Tab — Consent Management

- View consent status for all contacts: Consented, Pending, Revoked.
- Click **"Manage"** on any contact to record or update consent.
- Record the method (electronic, verbal, written) and channel opt-ins (email, SMS, phone, WhatsApp).
- Revoke consent when a data subject requests it.

### 20.2 FICA Tab — Know Your Customer

- Track FICA document status for all active transactions.
- View buyer and seller FICA status: Complete, Partial, or Missing.
- Monitor overall compliance rate.

### 20.3 Commission & VAT Tab

- Track your rolling 12-month commission income.
- See a progress bar toward the **R1,000,000 VAT registration threshold**.
- View monthly average and projected annual income.

### 20.4 CPD Points Tab

- Track Continuing Professional Development hours for your FFC (Fidelity Fund Certificate) renewal.
- Add CPD entries: Title, Provider, Date, Hours, Category (verifiable/non-verifiable).
- Set your FFC renewal date to see a countdown.

---

## 21. Command Palette & Shortcuts

### 21.1 Opening the Command Palette

Press **Ctrl+K** (Windows) or **Cmd+K** (Mac) at any time. You can also click the search bar at the top of the sidebar.

### 21.2 Available Commands

| Category | Commands |
|----------|----------|
| **Navigation** | Dashboard, Inbound Leads, Show Days, Speed-to-Lead, Lead ROI, Leads, Pipeline Board, Contacts, Buyer Match, Sequences, Messaging, Properties, CMA Reports, Deals, Transaction Pipeline, Documents, Tasks, Reports, Compliance |
| **Actions** | Add Lead, Add Contact, Add Task, New Transaction, Seed Sample Data |
| **Theme** | Light Mode, Dark Mode, System |

Just start typing and Thina will filter the results instantly.

---

## 22. Tips & Best Practices

### Daily Workflow

1. **Start at the Dashboard** — check KPIs, overdue tasks, and recent activity.
2. **Check Inbound Leads** — accept or reject portal leads.
3. **Work the Pipeline** — move leads through stages on the Pipeline Board.
4. **Complete Tasks** — tick off pending and overdue items.
5. **Log Activities** — record calls, emails, and meetings on lead/contact detail pages.
6. **End of day** — review the Reports page for trends.

### Lead Management Tips

- **Always set a value** on leads — this powers pipeline forecasting and ROI analytics.
- **Link leads to contacts** — this connects the full customer journey.
- **Use sources consistently** — accurate source data makes ROI analytics meaningful.
- **Move leads promptly** through the pipeline to keep your board accurate.

### Property & CMA Tips

- **Use CMA reports before pricing** — add 3+ comparables for a high confidence valuation.
- **Track mandate expiry dates** — the Properties page warns you 30 days before expiry.
- **Add features to listings** — this helps buyer matching find the right properties.

### Show Day Tips

- **Print the QR code** the day before the show day.
- **Check registrations** after the event to follow up while interest is fresh.
- **Set up a Speed-to-Lead rule** for show day registrations to send an instant thank-you.

### Compliance Tips

- **Record POPIA consent** when you first capture a contact — don't wait.
- **Track FICA early** in the transaction process — missing documents delay transfers.
- **Monitor the VAT threshold** — you must register once you exceed R1M in rolling 12-month income.
- **Log CPD points** as you complete training — don't leave it until renewal time.

---

## Need Help?

- **Command Palette:** Press `Ctrl+K` to quickly find any page or action.
- **Sample Data:** Visit the Seed page (`/seed`) to generate realistic test data for training purposes.
- **Dark Mode:** Use the theme toggle at the bottom of the sidebar if you prefer a darker interface.

---

*This training guide covers Thina CRM v0.12.0. For technical details, refer to the Thina CRM System Specification document.*
