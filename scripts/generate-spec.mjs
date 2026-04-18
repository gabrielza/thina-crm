/**
 * Thina CRM — System Specification Document Generator
 * Generates a comprehensive .docx specification document.
 * Run: node scripts/generate-spec.mjs
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  TableOfContents,
  StyleLevel,
  PageBreak,
  Footer,
  Header,
  ImageRun,
  ShadingType,
  convertInchesToTwip,
  LevelFormat,
  ExternalHyperlink,
} from "docx";
import { writeFileSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const VERSION = "0.6.0";
const DOC_DATE = new Date().toLocaleDateString("en-ZA", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level, spacing: { before: 300, after: 120 } });
}

function h2(text) {
  return heading(text, HeadingLevel.HEADING_2);
}

function h3(text) {
  return heading(text, HeadingLevel.HEADING_3);
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 100 },
    ...opts,
    children: [new TextRun({ text, size: 22, font: "Aptos", ...opts })],
  });
}

function bold(text) {
  return new TextRun({ text, bold: true, size: 22, font: "Aptos" });
}

function normal(text) {
  return new TextRun({ text, size: 22, font: "Aptos" });
}

function italics(text) {
  return new TextRun({ text, italics: true, size: 22, font: "Aptos" });
}

function bullet(text, level = 0) {
  return new Paragraph({
    spacing: { after: 40 },
    bullet: { level },
    children: [normal(text)],
  });
}

function bulletBold(label, value) {
  return new Paragraph({
    spacing: { after: 40 },
    bullet: { level: 0 },
    children: [bold(label + ": "), normal(value)],
  });
}

function bulletBoldL1(label, value) {
  return new Paragraph({
    spacing: { after: 40 },
    bullet: { level: 1 },
    children: [bold(label + ": "), normal(value)],
  });
}

function codeBlock(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    shading: { type: ShadingType.CLEAR, fill: "F4F4F5" },
    children: [new TextRun({ text, font: "Consolas", size: 18 })],
  });
}

function emptyPara() {
  return new Paragraph({ spacing: { after: 40 }, children: [] });
}

function tableHeader(...cells) {
  return new TableRow({
    tableHeader: true,
    children: cells.map(
      (text) =>
        new TableCell({
          shading: { type: ShadingType.CLEAR, fill: "18181B" },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [new TextRun({ text, bold: true, size: 20, font: "Aptos", color: "FFFFFF" })],
            }),
          ],
          width: { size: 100 / cells.length, type: WidthType.PERCENTAGE },
        })
    ),
  });
}

function tableRow(...cells) {
  return new TableRow({
    children: cells.map(
      (text) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text, size: 20, font: "Aptos" })],
            }),
          ],
        })
    ),
  });
}

function makeTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [tableHeader(...headers), ...rows.map((r) => tableRow(...r))],
  });
}

// ─── Title Page ───────────────────────────────────────────────────────────────

function titlePage() {
  return [
    new Paragraph({ spacing: { before: 4000 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "THINA CRM",
          bold: true,
          size: 72,
          font: "Aptos",
          color: "4F46E5",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: "System Specification Document",
          size: 36,
          font: "Aptos",
          color: "52525B",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: `Version ${VERSION}`,
          size: 28,
          font: "Aptos",
          color: "71717A",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: DOC_DATE,
          size: 24,
          font: "Aptos",
          color: "71717A",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1600 },
      children: [
        new TextRun({
          text: '"Thina" — Zulu/Xhosa for "Us"',
          italics: true,
          size: 24,
          font: "Aptos",
          color: "A1A1AA",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "A modern Customer Relationship Management system built with Next.js, Firebase, and Tailwind CSS",
          size: 22,
          font: "Aptos",
          color: "71717A",
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function sectionTableOfContents() {
  return [
    heading("Table of Contents"),
    new TableOfContents("Table of Contents", {
      hyperlink: true,
      headingStyleRange: "1-3",
      stylesWithLevels: [
        new StyleLevel("Heading1", 1),
        new StyleLevel("Heading2", 2),
        new StyleLevel("Heading3", 3),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function sectionExecutiveSummary() {
  return [
    heading("1. Executive Summary"),
    para(
      'Thina CRM is a full-featured Customer Relationship Management system designed for small to medium-sized businesses. The name "Thina" means "Us" in Zulu and Xhosa, reflecting the collaborative nature of the platform. The system provides comprehensive lead management, contact tracking, sales pipeline visualisation, task management, activity logging, and business reporting capabilities.'
    ),
    emptyPara(),
    para(
      "The application is built on a modern technology stack featuring Next.js 15 with the App Router, React 19, Firebase for authentication and database services, and Tailwind CSS with shadcn/ui for a premium user interface following the \"Linear Aesthetic\" design philosophy."
    ),
    emptyPara(),
    h2("1.1 Key Highlights"),
    bulletBold("Framework", "Next.js 15.1 (App Router) with React 19"),
    bulletBold("Database", "Google Cloud Firestore (NoSQL)"),
    bulletBold("Authentication", "Firebase Auth (Google OAuth + Email/Password)"),
    bulletBold("Hosting", "Firebase App Hosting (europe-west4)"),
    bulletBold("UI Library", "shadcn/ui (Radix UI primitives) with Tailwind CSS 3.4"),
    bulletBold("Design System", 'Linear Aesthetic / "Calm & Command" philosophy'),
    bulletBold("Current Version", `v${VERSION}`),
    bulletBold("Production URL", "https://thina-crm--thina-crm.europe-west4.hosted.app"),
    bulletBold("Repository", "https://github.com/gabrielza/thina-crm"),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function sectionSystemArchitecture() {
  return [
    heading("2. System Architecture"),

    h2("2.1 Architecture Overview"),
    para(
      "Thina CRM follows a modern Jamstack architecture pattern with server-side rendering (SSR) and client-side interactivity. The application uses Next.js App Router for file-based routing, React Server Components for initial page loads, and client components for interactive features."
    ),
    emptyPara(),

    h3("2.1.1 Architecture Layers"),
    makeTable(
      ["Layer", "Technology", "Purpose"],
      [
        ["Presentation", "React 19 + Tailwind CSS + shadcn/ui", "User interface rendering and interaction"],
        ["Routing", "Next.js 15 App Router", "File-based routing with layouts and dynamic segments"],
        ["State Management", "React Hooks (useState, useEffect, useCallback)", "Client-side state and side effects"],
        ["Authentication", "Firebase Auth SDK", "User identity via Google OAuth and Email/Password"],
        ["Data Layer", "Firebase Firestore SDK", "Real-time NoSQL document database"],
        ["Server Admin", "Firebase Admin SDK", "Server-side privileged Firestore/Auth access"],
        ["Hosting", "Firebase App Hosting", "Cloud deployment with automatic SSL and CDN"],
      ]
    ),
    emptyPara(),

    h3("2.1.2 Application Structure"),
    codeBlock("c:\\Users\\...\\CRM System\\"),
    codeBlock("├── src/"),
    codeBlock("│   ├── app/                    # Next.js App Router pages"),
    codeBlock("│   │   ├── layout.tsx           # Root layout (fonts, theme provider)"),
    codeBlock("│   │   ├── page.tsx             # Dashboard"),
    codeBlock("│   │   ├── globals.css          # Global styles & CSS variables"),
    codeBlock("│   │   ├── contacts/            # Contacts list + detail"),
    codeBlock("│   │   ├── leads/               # Leads list + detail"),
    codeBlock("│   │   ├── login/               # Authentication page"),
    codeBlock("│   │   ├── pipeline/            # Pipeline visualisation"),
    codeBlock("│   │   ├── reports/             # Business reports & charts"),
    codeBlock("│   │   ├── seed/                # Data seeding utility"),
    codeBlock("│   │   └── tasks/               # Task management"),
    codeBlock("│   ├── components/              # Reusable UI components"),
    codeBlock("│   │   ├── ui/                  # shadcn/ui primitives"),
    codeBlock("│   │   └── *.tsx                # Feature components"),
    codeBlock("│   └── lib/                     # Utilities & services"),
    codeBlock("│       ├── firebase.ts          # Client Firebase init"),
    codeBlock("│       ├── firebase-admin.ts    # Server Firebase init"),
    codeBlock("│       ├── firestore.ts         # Database CRUD operations"),
    codeBlock("│       ├── scoring.ts           # Lead scoring & forecasting"),
    codeBlock("│       ├── utils.ts             # Class name merging utility"),
    codeBlock("│       └── hooks/use-auth.ts    # Authentication hook"),
    codeBlock("├── scripts/                     # Build & utility scripts"),
    codeBlock("├── apphosting.yaml              # Firebase App Hosting config"),
    codeBlock("├── firebase.json                # Firebase project config"),
    codeBlock("├── tailwind.config.js           # Tailwind CSS configuration"),
    codeBlock("├── tsconfig.json                # TypeScript configuration"),
    codeBlock("└── next.config.js               # Next.js configuration"),
    emptyPara(),

    h2("2.2 Firebase Initialisation Pattern"),
    para(
      "The application uses a lazy initialisation pattern for the Firebase SDK to prevent crashes during the Next.js build process when environment variables are not yet available."
    ),
    emptyPara(),
    h3("2.2.1 Client-Side Firebase (src/lib/firebase.ts)"),
    para(
      "Uses getApps().length check to avoid duplicate initialisation. Exports getFirebaseAuth() and getFirebaseDb() functions that lazily create singletons. Also exports convenience auth and db constants guarded by typeof window check for client-only usage."
    ),
    emptyPara(),
    h3("2.2.2 Server-Side Firebase Admin (src/lib/firebase-admin.ts)"),
    para(
      "Initialises the Firebase Admin SDK with either a FIREBASE_SERVICE_ACCOUNT environment variable (JSON string) or falls back to Application Default Credentials when running on Google Cloud infrastructure (App Hosting)."
    ),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function sectionFrameworks() {
  return [
    heading("3. Technology Stack & Frameworks"),

    h2("3.1 Core Frameworks"),
    makeTable(
      ["Technology", "Version", "Purpose"],
      [
        ["Next.js", "15.1.0", "React framework with App Router, SSR, file-based routing"],
        ["React", "19.0.0", "UI component library with hooks and Server Components"],
        ["TypeScript", "5.7.0", "Static type checking with strict mode enabled"],
        ["Tailwind CSS", "3.4.17", "Utility-first CSS framework with JIT compilation"],
        ["Firebase (Client)", "11.10.0", "Authentication, Firestore database (client SDK)"],
        ["Firebase Admin", "13.8.0", "Server-side privileged access to Firebase services"],
      ]
    ),
    emptyPara(),

    h2("3.2 UI Libraries"),
    makeTable(
      ["Library", "Version", "Purpose"],
      [
        ["shadcn/ui", "—", "Radix UI-based component system (copy-paste pattern)"],
        ["@radix-ui/react-avatar", "1.1.2", "Accessible avatar component"],
        ["@radix-ui/react-dialog", "1.1.4", "Accessible modal/dialog component"],
        ["@radix-ui/react-dropdown-menu", "2.1.4", "Accessible dropdown menus"],
        ["@radix-ui/react-label", "2.1.1", "Accessible form labels"],
        ["@radix-ui/react-select", "2.1.4", "Accessible select/combobox component"],
        ["@radix-ui/react-separator", "1.1.1", "Visual separator component"],
        ["@radix-ui/react-slot", "1.1.1", "Polymorphic component composition"],
        ["@radix-ui/react-tabs", "1.1.2", "Accessible tab navigation"],
        ["@radix-ui/react-toast", "1.2.4", "Accessible toast notifications"],
        ["class-variance-authority", "0.7.1", "Component variant management"],
        ["clsx", "2.1.1", "Conditional class name joining"],
        ["tailwind-merge", "2.6.0", "Intelligent Tailwind class deduplication"],
        ["lucide-react", "0.469.0", "Modern icon library (tree-shakeable SVGs)"],
      ]
    ),
    emptyPara(),

    h2("3.3 Feature Libraries"),
    makeTable(
      ["Library", "Version", "Purpose"],
      [
        ["recharts", "3.8.1", "Composable chart components (Bar, Funnel, Pie, Area)"],
        ["framer-motion", "12.38.0", "Page transition animations and micro-interactions"],
        ["cmdk", "1.1.1", "Command palette (⌘+K / Ctrl+K) for quick navigation"],
        ["date-fns", "4.1.0", "Lightweight date formatting and manipulation"],
        ["geist", "1.7.0", "Vercel's Geist Sans and Geist Mono typefaces"],
      ]
    ),
    emptyPara(),

    h2("3.4 Development Dependencies"),
    makeTable(
      ["Tool", "Version", "Purpose"],
      [
        ["ESLint", "9.17.0", "JavaScript/TypeScript linting"],
        ["eslint-config-next", "15.1.0", "Next.js-specific linting rules"],
        ["PostCSS", "8.4.49", "CSS transformation pipeline"],
        ["Autoprefixer", "10.4.20", "Automatic vendor prefix insertion"],
        ["@tailwindcss/forms", "0.5.9", "Form element styling reset plugin"],
        ["@types/react", "19.0.0", "React type definitions"],
        ["@types/node", "22.0.0", "Node.js type definitions"],
        ["docx", "9.x", "Word document generation for specification"],
      ]
    ),

    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function sectionComponents() {
  return [
    heading("4. Component Inventory"),

    h2("4.1 UI Primitives (src/components/ui/)"),
    para(
      "These components follow the shadcn/ui pattern — they are copied into the project source code and customised to match the Thina design system. All are built on top of Radix UI primitives for accessibility."
    ),
    emptyPara(),
    makeTable(
      ["Component", "File", "Description"],
      [
        ["Avatar", "avatar.tsx", "User avatar with image and fallback initial display"],
        ["Badge", "badge.tsx", "Status badges with variant support (default, secondary, destructive, outline)"],
        ["Button", "button.tsx", "Multi-variant button (default, destructive, outline, secondary, ghost, link) with size options"],
        ["Card", "card.tsx", "Container with rounded-xl corners, layered shadows (card → card-hover), 50% border opacity"],
        ["Input", "input.tsx", "Styled form input with focus ring"],
        ["Label", "label.tsx", "Accessible form label with disabled state support"],
        ["Select", "select.tsx", "Dropdown select with trigger, content, item, separator, and scroll buttons"],
        ["Separator", "separator.tsx", "Horizontal or vertical visual separator"],
        ["Sheet", "sheet.tsx", "Slide-out panel (top, bottom, left, right) for forms and detail views"],
        ["Table", "table.tsx", "Data table with no vertical borders, uppercase tracking headers, muted hover rows"],
      ]
    ),
    emptyPara(),

    h2("4.2 Application Components (src/components/)"),
    makeTable(
      ["Component", "File", "Description"],
      [
        ["AppShell", "app-shell.tsx", "Main layout wrapper — sidebar + mobile header + content area + PageTransition + MobileNav + CommandPalette"],
        ["Sidebar", "sidebar.tsx", "Dark achromatic 240px sidebar (hidden on mobile, lg:flex) with CommandTrigger search bar, navigation links with indigo active indicator, and theme toggle"],
        ["MobileNav", "sidebar.tsx", "Fixed bottom navigation bar (5 items) with backdrop blur, visible on screens < lg"],
        ["CommandPalette", "command-palette.tsx", "⌘+K command palette using cmdk library with Navigation, Actions, and Theme command groups. Framer Motion backdrop animation"],
        ["PageTransition", "page-transition.tsx", "Framer Motion wrapper that provides opacity + translateY animation on route changes"],
        ["ThemeProvider", "theme-provider.tsx", "Light/dark/system theme management via localStorage('thina-theme') with .dark class toggle on <html>"],
        ["AuthGuard", "auth-guard.tsx", "Route protection component that redirects unauthenticated users to /login"],
        ["LeadsTable", "leads-table.tsx", "Feature-rich leads data table with avatar initials, hover-reveal quick actions (Phone, Email, Edit, Delete), pill-style status filters, mobile card list"],
        ["ContactsTable", "contacts-table.tsx", "Contacts data table with same pattern as LeadsTable"],
        ["DashboardCards", "dashboard-cards.tsx", "KPI summary cards with label-above-number pattern and trend indicators"],
        ["DashboardCharts", "dashboard-charts.tsx", "Recharts-based pipeline funnel, donut, and bar chart compositions"],
        ["ActivityTimeline", "activity-timeline.tsx", "Chronological activity feed for lead/contact detail pages"],
        ["TaskList", "task-list.tsx", "Task list with completion status and priority indicators"],
        ["NewLeadSheet", "new-lead-sheet.tsx", "Sheet-based form for creating new leads"],
        ["EditLeadSheet", "edit-lead-sheet.tsx", "Sheet-based form for editing existing leads"],
        ["NewContactSheet", "new-contact-sheet.tsx", "Sheet-based form for creating new contacts"],
        ["EditContactSheet", "edit-contact-sheet.tsx", "Sheet-based form for editing existing contacts"],
      ]
    ),

    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function sectionPages() {
  return [
    heading("5. Page Routes & Features"),

    h2("5.1 Route Map"),
    makeTable(
      ["Route", "File", "Auth Required", "Description"],
      [
        ["/", "app/page.tsx", "Yes", "Dashboard with KPIs, pipeline summary, forecast, recent activities, and top leads"],
        ["/leads", "app/leads/page.tsx", "Yes", "Leads list with search, status filters, sorting, and create/edit/delete actions"],
        ["/leads/[id]", "app/leads/[id]/page.tsx", "Yes", "Lead detail with 3-column layout — contact info, deal info, notes, activity timeline, task list"],
        ["/contacts", "app/contacts/page.tsx", "Yes", "Contacts list with search, create/edit/delete actions"],
        ["/contacts/[id]", "app/contacts/[id]/page.tsx", "Yes", "Contact detail with linked leads, activities, and tasks"],
        ["/pipeline", "app/pipeline/page.tsx", "Yes", "Visual pipeline board with 6 stages (New → Won/Lost), responsive grid layout"],
        ["/tasks", "app/tasks/page.tsx", "Yes", "Task management with KPIs, status filters, priority indicators, and completion toggling"],
        ["/reports", "app/reports/page.tsx", "Yes", "Business reports with pipeline analytics, source analysis, and conversion metrics"],
        ["/login", "app/login/page.tsx", "No", "Authentication page with Google OAuth and email/password sign-in"],
        ["/seed", "app/seed/page.tsx", "Yes", "Data seeding utility to generate 1,200 test records with progress tracking"],
      ]
    ),
    emptyPara(),

    h2("5.2 Dashboard Features"),
    bullet("4 KPI cards: Total Leads, Active Pipeline Value, Won Revenue, Conversion Rate"),
    bullet("Pipeline summary with stage counts and weighted values"),
    bullet("Revenue forecast (weighted pipeline + won revenue)"),
    bullet("Recent activities feed (last 10 activities)"),
    bullet("Top leads by score"),
    emptyPara(),

    h2("5.3 Lead Management"),
    bullet("Full CRUD operations (Create, Read, Update, Delete)"),
    bullet("Status tracking: New → Contacted → Qualified → Proposal → Won / Lost"),
    bullet("Deal value tracking with currency formatting (ZAR)"),
    bullet("Source attribution (Website, LinkedIn, Referral, Cold Call, etc.)"),
    bullet("Lead scoring algorithm (0–100 scale) based on value, stage, engagement, tasks, and data completeness"),
    bullet("Contact linking via contactId"),
    bullet("Notes and activity history"),
    emptyPara(),

    h2("5.4 Contact Management"),
    bullet("Full CRUD operations"),
    bullet("Company and title tracking"),
    bullet("Linked leads display on contact detail page"),
    bullet("Activity history per contact"),
    emptyPara(),

    h2("5.5 Pipeline Visualisation"),
    bullet("6-stage visual board: New, Contacted, Qualified, Proposal, Won, Lost"),
    bullet("Responsive grid layout (2 columns mobile, 3 tablet, 6 desktop)"),
    bullet("Deal cards within each stage showing value and company"),
    bullet("Stage count and total value summaries"),
    emptyPara(),

    h2("5.6 Task Management"),
    bullet("KPI summary: Total, Pending, Completed, Overdue"),
    bullet("Pill-style status filter tabs"),
    bullet("Priority levels: Low, Medium, High"),
    bullet("Due date tracking"),
    bullet("Linked to leads or contacts"),
    emptyPara(),

    h2("5.7 Reports & Analytics"),
    bullet("Pipeline funnel chart"),
    bullet("Revenue by source breakdown"),
    bullet("Lead conversion metrics"),
    bullet("Export-ready layout with compact action buttons"),

    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function sectionFunctions() {
  return [
    heading("6. Core Functions & APIs"),

    h2("6.1 Database Operations (src/lib/firestore.ts)"),
    para(
      "All Firestore operations are centralised in the firestore module. The module exports typed interfaces and async CRUD functions for each collection."
    ),
    emptyPara(),

    h3("6.1.1 Data Models"),
    makeTable(
      ["Model", "Collection", "Key Fields"],
      [
        ["Lead", "leads", "name, email, phone, company, status, source, notes, value, contactId, score, ownerId"],
        ["Contact", "contacts", "name, email, phone, company, title, notes, ownerId"],
        ["Activity", "activities", "type (call/email/meeting/note), subject, description, leadId, contactId, ownerId"],
        ["Task", "tasks", "title, description, dueDate, status (pending/completed/overdue), priority (low/medium/high), leadId, contactId, ownerId"],
      ]
    ),
    emptyPara(),

    h3("6.1.2 Lead Functions"),
    makeTable(
      ["Function", "Signature", "Description"],
      [
        ["addLead", "addLead(lead) → Promise<string>", "Creates a new lead document. Returns the generated document ID. Auto-sets createdAt/updatedAt timestamps."],
        ["getLeads", "getLeads() → Promise<Lead[]>", "Fetches all leads ordered by createdAt descending."],
        ["getLeadById", "getLeadById(id) → Promise<Lead|null>", "Fetches a single lead by document ID."],
        ["updateLead", "updateLead(id, data) → Promise<void>", "Partially updates a lead document. Auto-sets updatedAt."],
        ["deleteLead", "deleteLead(id) → Promise<void>", "Permanently deletes a lead document."],
        ["getLeadsByContact", "getLeadsByContact(contactId) → Promise<Lead[]>", "Fetches all leads linked to a specific contact."],
      ]
    ),
    emptyPara(),

    h3("6.1.3 Contact Functions"),
    makeTable(
      ["Function", "Signature", "Description"],
      [
        ["addContact", "addContact(contact) → Promise<string>", "Creates a new contact document."],
        ["getContacts", "getContacts() → Promise<Contact[]>", "Fetches all contacts ordered by createdAt descending."],
        ["getContactById", "getContactById(id) → Promise<Contact|null>", "Fetches a single contact by ID."],
        ["updateContact", "updateContact(id, data) → Promise<void>", "Partially updates a contact."],
        ["deleteContact", "deleteContact(id) → Promise<void>", "Permanently deletes a contact."],
      ]
    ),
    emptyPara(),

    h3("6.1.4 Activity Functions"),
    makeTable(
      ["Function", "Signature", "Description"],
      [
        ["addActivity", "addActivity(activity) → Promise<string>", "Creates an activity record."],
        ["getActivities", "getActivities() → Promise<Activity[]>", "Fetches all activities."],
        ["getActivitiesByLead", "getActivitiesByLead(leadId) → Promise<Activity[]>", "Fetches activities for a specific lead."],
        ["getActivitiesByContact", "getActivitiesByContact(contactId) → Promise<Activity[]>", "Fetches activities for a specific contact."],
        ["deleteActivity", "deleteActivity(id) → Promise<void>", "Deletes an activity record."],
      ]
    ),
    emptyPara(),

    h3("6.1.5 Task Functions"),
    makeTable(
      ["Function", "Signature", "Description"],
      [
        ["addTask", "addTask(task) → Promise<string>", "Creates a new task."],
        ["getTasks", "getTasks() → Promise<Task[]>", "Fetches all tasks."],
        ["getTasksByLead", "getTasksByLead(leadId) → Promise<Task[]>", "Fetches tasks linked to a lead."],
        ["updateTask", "updateTask(id, data) → Promise<void>", "Partially updates a task."],
        ["deleteTask", "deleteTask(id) → Promise<void>", "Deletes a task."],
      ]
    ),
    emptyPara(),

    h3("6.1.6 Batch Operations"),
    makeTable(
      ["Function", "Signature", "Description"],
      [
        ["batchWrite", "batchWrite(collection, documents[], onProgress?) → Promise<string[]>", "Writes documents in batches of 450 (Firestore limit is 500). Returns array of generated IDs. Reports progress via callback."],
        ["clearCollection", "clearCollection(collection, onProgress?) → Promise<number>", "Deletes all documents in a collection using batched deletes. Returns count of deleted documents."],
      ]
    ),
    emptyPara(),

    h2("6.2 Lead Scoring (src/lib/scoring.ts)"),
    para(
      "The lead scoring algorithm evaluates leads on a 0–100 scale across five weighted dimensions:"
    ),
    makeTable(
      ["Dimension", "Max Points", "Criteria"],
      [
        ["Deal Value", "25", "Logarithmic scale normalised to R1M ceiling"],
        ["Pipeline Stage", "25", "New=5, Contacted=10, Qualified=15, Proposal=22, Won=25, Lost=0"],
        ["Activity Engagement", "25+3", "5 pts per activity (max 25) + 3 bonus for 3+ activity types"],
        ["Task Completion", "15", "12 pts × completion rate + 3 bonus for pending follow-ups"],
        ["Data Completeness", "10", "2 pts each for: email, phone, company, source, notes"],
      ]
    ),
    emptyPara(),

    h3("6.2.1 Score Labels"),
    makeTable(
      ["Score Range", "Label", "Colour"],
      [
        ["80–100", "Hot", "Red"],
        ["60–79", "Warm", "Orange"],
        ["40–59", "Interested", "Amber"],
        ["20–39", "Cool", "Blue"],
        ["0–19", "Cold", "Slate"],
      ]
    ),
    emptyPara(),

    h2("6.3 Pipeline Forecasting"),
    para(
      "The forecast engine uses weighted pipeline values based on stage-specific close probabilities:"
    ),
    makeTable(
      ["Stage", "Close Probability"],
      [
        ["New", "10%"],
        ["Contacted", "20%"],
        ["Qualified", "40%"],
        ["Proposal", "65%"],
        ["Won", "100%"],
        ["Lost", "0%"],
      ]
    ),
    emptyPara(),
    para("Forecast Output: totalPipeline, weightedPipeline, wonRevenue, and expectedClose (wonRevenue + weightedPipeline)."),

    h2("6.4 Authentication (src/lib/hooks/use-auth.ts)"),
    para(
      "Custom React hook providing authentication state and methods:"
    ),
    makeTable(
      ["Export", "Type", "Description"],
      [
        ["user", "User | null", "Current Firebase Auth user object"],
        ["loading", "boolean", "True while auth state is being resolved"],
        ["signInWithGoogle", "() → Promise", "Triggers Google OAuth popup sign-in"],
        ["signInWithEmail", "(email, password) → Promise", "Email/password sign-in"],
        ["signUpWithEmail", "(email, password) → Promise", "Email/password account creation"],
        ["signOut", "() → Promise", "Signs the user out"],
      ]
    ),

    h2("6.5 Utility Functions"),
    bulletBold("cn(...inputs)", "Merges Tailwind CSS class names using clsx + tailwind-merge to resolve conflicts intelligently"),

    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function sectionDesignSystem() {
  return [
    heading("7. Design System"),

    h2('7.1 Design Philosophy — "Calm & Command"'),
    para(
      'The Thina CRM design system follows the "Linear Aesthetic" — a premium, tool-like interface that prioritises information density, clarity, and calm visual hierarchy. The design intentionally avoids visual clutter, bright colours, and decorative elements in favour of purposeful typography, achromatic surfaces, and selective accent colour usage.'
    ),
    emptyPara(),

    h2("7.2 Colour Palette"),
    h3("7.2.1 Light Mode"),
    makeTable(
      ["Token", "Value", "Usage"],
      [
        ["--background", "0 0% 100%", "Page background (white)"],
        ["--foreground", "240 10% 3.9%", "Primary text (near-black)"],
        ["--primary", "238 84% 57%", "Indigo — primary actions and active indicators"],
        ["--muted", "240 4.8% 95.9%", "Subtle backgrounds"],
        ["--border", "240 5.9% 90%", "Dividers and borders"],
        ["--card", "0 0% 100%", "Card surface"],
        ["--sidebar-bg", "240 6% 10%", "Dark sidebar background"],
        ["--sidebar-fg", "240 4% 70%", "Sidebar text"],
        ["--sidebar-fg-active", "0 0% 98%", "Active sidebar item"],
        ["--sidebar-accent", "238 84% 57%", "Sidebar accent (indigo)"],
      ]
    ),
    emptyPara(),

    h3("7.2.2 Dark Mode"),
    para(
      "Dark mode uses inverted zinc scales with the same indigo accent. All semantic tokens swap to dark equivalents via the .dark class on <html>."
    ),
    emptyPara(),

    h2("7.3 Typography"),
    makeTable(
      ["Element", "Size", "Weight", "Tracking"],
      [
        ["Page Headings", "text-xl (20px)", "font-semibold (600)", "Normal"],
        ["Card Labels", "text-[11px]", "font-medium (500)", "tracking-wider uppercase"],
        ["Table Headers", "text-xs (12px)", "font-medium (500)", "tracking-wider uppercase"],
        ["Body / Table Cells", "text-[13px]", "font-normal (400)", "Normal"],
        ["KPI Values", "text-2xl (24px)", "font-bold (700)", "tracking-tight"],
      ]
    ),
    emptyPara(),
    bulletBold("Primary Font", "Geist Sans (variable weight)"),
    bulletBold("Monospace Font", "Geist Mono"),
    emptyPara(),

    h2("7.4 Spacing & Layout"),
    bullet("Card padding: p-5 (mobile) / p-6 (sm:)"),
    bullet("Table cell padding: px-4 py-3.5"),
    bullet("Section spacing: space-y-6 between major sections"),
    bullet("Max content width: max-w-6xl (72rem / 1152px)"),
    bullet("Sidebar width: 240px (desktop), hidden on mobile"),
    emptyPara(),

    h2("7.5 Shadows & Elevation"),
    makeTable(
      ["Token", "Value", "Usage"],
      [
        ["shadow-card", "0 1px 3px rgba(0,0,0,0.04)", "Default card resting state"],
        ["shadow-card-hover", "0 4px 6px rgba(0,0,0,0.06)", "Card hover state"],
        ["shadow-elevated", "0 10px 15px rgba(0,0,0,0.06)", "Modals, dropdowns, command palette"],
      ]
    ),
    emptyPara(),

    h2("7.6 Animations"),
    makeTable(
      ["Animation", "Duration", "Description"],
      [
        ["fade-in", "0.3s ease-out", "Opacity 0→1"],
        ["slide-up", "0.3s ease-out", "Opacity + translateY 8px→0"],
        ["slide-in-right", "0.25s ease-out", "Opacity + translateX 16px→0"],
        ["Page Transition", "0.2s ease-out", "Framer Motion opacity + translateY on route change"],
      ]
    ),
    emptyPara(),

    h2("7.7 Responsive Breakpoints"),
    makeTable(
      ["Breakpoint", "Width", "Layout Changes"],
      [
        ["Default (mobile)", "< 768px", "Single column, bottom nav, card-based lists, no sidebar"],
        ["md", "≥ 768px", "Two-column grids, table views, expanded cards"],
        ["lg", "≥ 1024px", "Sidebar visible, 3-column detail layouts, full pipeline grid"],
      ]
    ),

    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function sectionDataSeeder() {
  return [
    heading("8. Data Seeder"),

    h2("8.1 Overview"),
    para(
      "The seeder utility (accessible at /seed) generates 1,200 realistic test records for development and demonstration purposes. It uses South African names, companies, and phone formats to create authentic-looking data."
    ),
    emptyPara(),

    h2("8.2 Record Distribution"),
    makeTable(
      ["Collection", "Count", "Details"],
      [
        ["Contacts", "200", "SA, English, and international names with ZA companies, titles, and phone numbers"],
        ["Leads", "500", "Weighted status distribution (realistic funnel shape), value brackets from R5K to R1M"],
        ["Activities", "300", "Distributed across call, email, meeting, and note types with contextual subjects"],
        ["Tasks", "200", "Linked to leads, with realistic titles using name/company placeholders"],
      ]
    ),
    emptyPara(),

    h2("8.3 Data Generation Features"),
    bullet("Name pools: 30+ Zulu/Xhosa/Sotho first names, 30+ English first names, 30+ international first names"),
    bullet("50 South African company names, 26 international companies"),
    bullet("28 professional titles"),
    bullet("10 lead sources with realistic distribution"),
    bullet("Weighted lead status: New 25%, Contacted 25%, Qualified 20%, Proposal 15%, Won 10%, Lost 5%"),
    bullet("Weighted deal values: 30% R5K–50K, 30% R50K–200K, 25% R200K–500K, 15% R500K–1M"),
    bullet("South African phone format (+27 XX XXX XXXX)"),
    bullet("Date range: past 90 days for varied timeline"),
    emptyPara(),

    h2("8.4 Technical Implementation"),
    bullet("Uses Firestore writeBatch for bulk writes (450 documents per batch, Firestore limit is 500)"),
    bullet("Progress bar with real-time percentage and record count"),
    bullet("'Clear All' button to delete all existing data before re-seeding"),
    bullet("Batch write utility returns array of generated document IDs for cross-referencing"),

    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function sectionTesting() {
  return [
    heading("9. Testing & Quality Assurance"),

    h2("9.1 Build Verification"),
    para(
      "Each version undergoes a full Next.js production build verification. The build process compiles TypeScript, validates all imports, resolves module paths, and generates optimised bundles for all 11 pages."
    ),
    emptyPara(),
    h3("9.1.1 Build Metrics (v0.5.0)"),
    makeTable(
      ["Metric", "Value"],
      [
        ["Build Time", "~26 seconds"],
        ["Total Pages", "11 (including dynamic routes)"],
        ["Build Result", "Compiled successfully"],
        ["TypeScript", "Strict mode — zero type errors"],
        ["Static Pages", "login, seed"],
        ["Dynamic Pages", "Dashboard, leads, leads/[id], contacts, contacts/[id], pipeline, tasks, reports"],
      ]
    ),
    emptyPara(),

    h2("9.2 Type Safety"),
    bullet("TypeScript strict mode enabled (strict: true in tsconfig.json)"),
    bullet("All Firestore data models are typed with explicit interfaces"),
    bullet("Component props are typed via TypeScript generics and Radix UI prop types"),
    bullet("Path alias (@/*) mapped to ./src/* for clean imports"),
    emptyPara(),

    h2("9.3 Manual Testing Performed"),
    makeTable(
      ["Area", "Test Scope"],
      [
        ["Authentication", "Google OAuth sign-in, email/password sign-in and registration, sign-out, auth guard redirect"],
        ["Lead CRUD", "Create, read, update, delete leads; status transitions; value changes"],
        ["Contact CRUD", "Create, read, update, delete contacts; linked leads display"],
        ["Pipeline", "Visual board rendering; stage distribution; responsive layout"],
        ["Tasks", "Create tasks; status toggling; priority filtering; overdue detection"],
        ["Reports", "Chart rendering; KPI calculations; data aggregation"],
        ["Seed Data", "Bulk generation of 1,200 records; progress tracking; data clearing"],
        ["Responsive UI", "Mobile bottom nav; tablet grid; desktop sidebar; breakpoint transitions"],
        ["Dark Mode", "Theme toggle; localStorage persistence; all pages in both modes"],
        ["Command Palette", "⌘+K activation; navigation commands; theme commands"],
      ]
    ),
    emptyPara(),

    h2("9.4 Known Limitations"),
    bullet("No automated unit or integration test suite (planned for future versions)"),
    bullet("No end-to-end tests (Playwright/Cypress planned)"),
    bullet("No accessibility audit (WCAG compliance via Radix UI primitives)"),
    bullet("No performance benchmarking (Lighthouse audit planned)"),

    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function sectionIntegration() {
  return [
    heading("10. System Integration"),

    h2("10.1 Firebase Integration"),
    h3("10.1.1 Firebase Authentication"),
    bullet("Provider: Google OAuth 2.0 and Email/Password"),
    bullet("Client SDK: firebase/auth with onAuthStateChanged listener"),
    bullet("Auth state managed by custom useAuth() hook"),
    bullet("AuthGuard component protects all routes except /login"),
    bullet("User ownerId field links all data to the authenticated user"),
    emptyPara(),

    h3("10.1.2 Cloud Firestore"),
    bullet("NoSQL document database with 4 root collections: leads, contacts, activities, tasks"),
    bullet("Client SDK with real-time read operations"),
    bullet("Server-side access via Firebase Admin SDK for privileged operations"),
    bullet("Firestore security rules defined in firestore.rules"),
    bullet("Batch write support (writeBatch) for seed data operations"),
    emptyPara(),

    h3("10.1.3 Firebase App Hosting"),
    bullet("Automatic build and deployment from GitHub repository"),
    bullet("Region: europe-west4"),
    bullet("Configuration via apphosting.yaml"),
    bullet("Environment variables injected at build time"),
    bullet("Auto-scaling: 0–2 instances, 512 MiB memory"),
    emptyPara(),

    h2("10.2 GitHub Integration"),
    bulletBold("Repository", "https://github.com/gabrielza/thina-crm"),
    bulletBold("Branch", "master"),
    bullet("Git tags for each version (v0.1.0 through v0.5.0)"),
    bullet("Firebase App Hosting auto-deploys on push to master"),
    bullet("Commit history tracks all feature additions and design changes"),
    emptyPara(),

    h2("10.3 External Services"),
    makeTable(
      ["Service", "Purpose", "Integration Method"],
      [
        ["Google OAuth", "User authentication", "Firebase Auth SDK → Google Identity Platform"],
        ["Cloud Firestore", "Database", "Firebase Client SDK (web) + Admin SDK (server)"],
        ["Firebase App Hosting", "Deployment", "GitHub webhook → auto-build → deploy"],
        ["Google Fonts (Geist)", "Typography", "npm package, self-hosted via next/font"],
      ]
    ),

    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function sectionDeployment() {
  return [
    heading("11. Deployment"),

    h2("11.1 Deployment Architecture"),
    para(
      "Thina CRM uses Firebase App Hosting with automatic deployments triggered by pushes to the master branch on GitHub. The deployment pipeline builds the Next.js application, optimises assets, and deploys to Google Cloud infrastructure."
    ),
    emptyPara(),

    h2("11.2 Deployment Configuration"),
    h3("11.2.1 apphosting.yaml"),
    makeTable(
      ["Setting", "Value"],
      [
        ["Min Instances", "0 (scales to zero when idle)"],
        ["Max Instances", "2"],
        ["Memory", "512 MiB"],
        ["Region", "europe-west4"],
      ]
    ),
    emptyPara(),

    h3("11.2.2 Environment Variables"),
    makeTable(
      ["Variable", "Purpose"],
      [
        ["NEXT_PUBLIC_FIREBASE_API_KEY", "Firebase client API key"],
        ["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "Firebase Auth domain"],
        ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", "Firebase project identifier (thina-crm)"],
        ["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "Firebase Storage bucket URL"],
        ["NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "Firebase Cloud Messaging sender ID"],
        ["NEXT_PUBLIC_FIREBASE_APP_ID", "Firebase application identifier"],
        ["NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", "Google Analytics measurement ID"],
      ]
    ),
    emptyPara(),

    h2("11.3 Deployment Process"),
    new Paragraph({
      spacing: { after: 40 },
      children: [bold("Step 1: "), normal("Code changes committed to local repository")],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [bold("Step 2: "), normal("Git tag created for version (e.g., v0.5.0)")],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [bold("Step 3: "), normal("Push to GitHub (git push origin master --tags)")],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [bold("Step 4: "), normal("Firebase App Hosting detects push and triggers build")],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [bold("Step 5: "), normal("Next.js production build runs in cloud environment")],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [bold("Step 6: "), normal("Application deployed to https://thina-crm--thina-crm.europe-west4.hosted.app")],
    }),
    emptyPara(),

    h2("11.4 Production URL"),
    para("https://thina-crm--thina-crm.europe-west4.hosted.app"),

    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function sectionVersionHistory() {
  return [
    heading("12. Version History"),

    makeTable(
      ["Version", "Date", "Description"],
      [
        ["v0.1.0", "April 2026", "Initial project setup — Next.js 15, Firebase integration, basic authentication, project structure"],
        ["v0.2.0", "April 2026", "Core CRM features — Lead and Contact CRUD, Firestore data layer, basic UI with shadcn/ui components"],
        ["v0.3.0", "April 2026", "Pipeline & Tasks — Pipeline visualisation board, task management, activity logging, detail pages"],
        ["v0.4.0", "April 2026", "Reports & Analytics — Dashboard KPIs, pipeline charts (Recharts), lead scoring algorithm, revenue forecasting, business reports"],
        [
          "v0.5.0",
          "April 2026",
          'UI Redesign ("Linear Aesthetic") — Complete visual overhaul with Zinc/Indigo palette, Geist fonts, command palette, dark mode, page transitions, mobile-optimised bottom nav, hover-reveal table actions, responsive layouts. Added massive data seeder (1,200 records).',
        ],
        [
          "v0.6.0",
          "April 2026",
          'Performance Optimisations — Added optional limit() to all Firestore list queries, server-side getCollectionCount() via getCountFromServer, shared AuthProvider context in root layout (single onAuthStateChanged listener), lazy-loaded CommandPalette (cmdk + framer-motion) and DashboardCharts (recharts) via next/dynamic, reduced dashboard data fetching from 4 full collections to targeted queries.',
        ],
      ]
    ),

    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function sectionAppendix() {
  return [
    heading("13. Appendix"),

    h2("13.1 File Inventory"),
    para("Complete list of source files in the project:"),
    emptyPara(),
    h3("Pages (src/app/)"),
    bullet("layout.tsx — Root layout with fonts and theme provider"),
    bullet("page.tsx — Dashboard"),
    bullet("globals.css — Global styles and CSS custom properties"),
    bullet("contacts/page.tsx — Contacts list"),
    bullet("contacts/[id]/page.tsx — Contact detail"),
    bullet("leads/page.tsx — Leads list"),
    bullet("leads/[id]/page.tsx — Lead detail"),
    bullet("login/page.tsx — Authentication"),
    bullet("pipeline/page.tsx — Pipeline board"),
    bullet("reports/page.tsx — Business reports"),
    bullet("seed/page.tsx — Data seeder"),
    bullet("tasks/page.tsx — Task management"),
    emptyPara(),

    h3("Components (src/components/)"),
    bullet("activity-timeline.tsx — Activity feed component"),
    bullet("app-shell.tsx — Main layout wrapper"),
    bullet("auth-guard.tsx — Route protection"),
    bullet("auth-provider.tsx — Shared authentication context provider"),
    bullet("command-palette.tsx — ⌘+K command palette (lazy-loaded)"),
    bullet("contacts-table.tsx — Contacts data table"),
    bullet("dashboard-cards.tsx — Dashboard KPI cards"),
    bullet("dashboard-charts.tsx — Dashboard chart compositions (lazy-loaded)"),
    bullet("edit-contact-sheet.tsx — Edit contact form"),
    bullet("edit-lead-sheet.tsx — Edit lead form"),
    bullet("leads-table.tsx — Leads data table"),
    bullet("new-contact-sheet.tsx — New contact form"),
    bullet("new-lead-sheet.tsx — New lead form"),
    bullet("page-transition.tsx — Framer Motion page animation"),
    bullet("sidebar.tsx — Navigation sidebar + MobileNav"),
    bullet("task-list.tsx — Task list component"),
    bullet("theme-provider.tsx — Theme management"),
    emptyPara(),

    h3("UI Primitives (src/components/ui/)"),
    bullet("avatar.tsx, badge.tsx, button.tsx, card.tsx, input.tsx"),
    bullet("label.tsx, select.tsx, separator.tsx, sheet.tsx, table.tsx"),
    emptyPara(),

    h3("Library (src/lib/)"),
    bullet("firebase.ts — Client Firebase initialisation"),
    bullet("firebase-admin.ts — Server Firebase Admin initialisation"),
    bullet("firestore.ts — All CRUD operations and batch utilities"),
    bullet("scoring.ts — Lead scoring algorithm and pipeline forecasting"),
    bullet("utils.ts — cn() class name merge utility"),
    bullet("hooks/use-auth.ts — Authentication React hook"),
    emptyPara(),

    h2("13.2 Configuration Files"),
    bullet("package.json — Project metadata, dependencies, scripts"),
    bullet("tsconfig.json — TypeScript compiler options (strict, bundler resolution)"),
    bullet("tailwind.config.js — Tailwind theme extensions, colours, animations"),
    bullet("next.config.js — Next.js configuration (image remote patterns)"),
    bullet("postcss.config.mjs — PostCSS plugins (Tailwind, Autoprefixer)"),
    bullet("apphosting.yaml — Firebase App Hosting deployment config"),
    bullet("firebase.json — Firebase project services configuration"),
    bullet("firestore.rules — Firestore security rules"),
    bullet("firestore.indexes.json — Firestore composite indexes"),
    emptyPara(),

    h2("13.3 npm Scripts"),
    makeTable(
      ["Script", "Command", "Description"],
      [
        ["dev", "next dev", "Start development server with hot reload"],
        ["build", "next build", "Production build with TypeScript checking"],
        ["start", "next start", "Start production server"],
        ["lint", "next lint", "Run ESLint checks"],
      ]
    ),

    emptyPara(),
    emptyPara(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600 },
      children: [
        new TextRun({
          text: "— End of Document —",
          italics: true,
          size: 22,
          font: "Aptos",
          color: "A1A1AA",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `Thina CRM System Specification v${VERSION} • Generated ${DOC_DATE}`,
          size: 18,
          font: "Aptos",
          color: "A1A1AA",
        }),
      ],
    }),
  ];
}

// ─── Build Document ───────────────────────────────────────────────────────────

async function buildDocument() {
  const doc = new Document({
    creator: "Thina CRM Team",
    title: `Thina CRM — System Specification v${VERSION}`,
    description: "Comprehensive system specification for the Thina CRM platform",
    styles: {
      default: {
        document: {
          run: { font: "Aptos", size: 22 },
        },
        heading1: {
          run: { font: "Aptos", size: 36, bold: true, color: "18181B" },
          paragraph: { spacing: { before: 360, after: 160 } },
        },
        heading2: {
          run: { font: "Aptos", size: 28, bold: true, color: "27272A" },
          paragraph: { spacing: { before: 280, after: 120 } },
        },
        heading3: {
          run: { font: "Aptos", size: 24, bold: true, color: "3F3F46" },
          paragraph: { spacing: { before: 200, after: 100 } },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "thina-bullets",
          levels: [
            { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT },
            { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT },
          ],
        },
      ],
    },
    features: { updateFields: true },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.25),
              right: convertInchesToTwip(1.25),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `Thina CRM — System Specification v${VERSION}`,
                    italics: true,
                    size: 16,
                    font: "Aptos",
                    color: "A1A1AA",
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Thina CRM • Confidential",
                    size: 16,
                    font: "Aptos",
                    color: "A1A1AA",
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          ...titlePage(),
          ...sectionTableOfContents(),
          ...sectionExecutiveSummary(),
          ...sectionSystemArchitecture(),
          ...sectionFrameworks(),
          ...sectionComponents(),
          ...sectionPages(),
          ...sectionFunctions(),
          ...sectionDesignSystem(),
          ...sectionDataSeeder(),
          ...sectionTesting(),
          ...sectionIntegration(),
          ...sectionDeployment(),
          ...sectionVersionHistory(),
          ...sectionAppendix(),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = resolve(ROOT, "docs", `Thina_CRM_System_Specification_v${VERSION}.docx`);

  // Ensure docs/ directory exists
  const { mkdirSync } = await import("fs");
  mkdirSync(resolve(ROOT, "docs"), { recursive: true });

  writeFileSync(outputPath, buffer);
  console.log(`✅ Specification document generated: ${outputPath}`);
  console.log(`   Version: ${VERSION}`);
  console.log(`   Date: ${DOC_DATE}`);
  return outputPath;
}

buildDocument().catch((err) => {
  console.error("❌ Failed to generate specification:", err);
  process.exit(1);
});
