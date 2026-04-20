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
const VERSION = "1.3.1";
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
  const tocEntries = [
    "1. Executive Summary",
    "2. System Architecture",
    "3. Technology Stack & Frameworks",
    "4. Component Inventory",
    "5. Page Routes & Features",
    "6. Core Functions & APIs",
    "7. Design System",
    "8. Data Seeder",
    "9. Testing & Quality Assurance",
    "10. System Integration & Configuration",
    "11. Deployment",
    "12. AI-Assisted Development",
    "13. Version History",
    "14. Appendix",
  ];

  return [
    heading("Table of Contents"),
    emptyPara(),
    ...tocEntries.map(
      (entry) =>
        new Paragraph({
          spacing: { before: 80, after: 80 },
          indent: { left: convertInchesToTwip(0.3) },
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 1,
              color: "E4E4E7",
              space: 4,
            },
          },
          children: [
            new TextRun({
              text: entry,
              font: "Aptos",
              size: 24,
              color: "27272A",
            }),
          ],
        })
    ),
    emptyPara(),
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
        ["firebase/storage", "—", "Firebase Cloud Storage for document uploads"],
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
        ["Sidebar", "sidebar.tsx", "240px sidebar with grouped navigation (6 workflow groups: Overview, Prospecting, Pipeline, Listings, Transactions, Operations), CommandTrigger search bar, indigo active indicator, theme toggle, user profile"],
        ["MobileNav", "sidebar.tsx", "Fixed bottom tab bar (4 items + More) with slide-up menu showing all grouped navigation, visible on screens < lg"],
        ["CommandPalette", "command-palette.tsx", "⌘+K command palette using cmdk library with Navigation, Actions, and Theme command groups. Framer Motion backdrop animation"],
        ["PageTransition", "page-transition.tsx", "Framer Motion wrapper that provides opacity + translateY animation on route changes"],
        ["ThemeProvider", "theme-provider.tsx", "Light/dark/system theme management via localStorage('thina-theme') with .dark class toggle on <html>"],
        ["AuthGuard", "auth-guard.tsx", "Route protection component that redirects unauthenticated users to /login"],
        ["LeadsTable", "leads-table.tsx", "Feature-rich leads data table with avatar initials, hover-reveal quick actions (Phone, Email, Edit, Delete), pill-style status filters, mobile card list"],
        ["ContactsTable", "contacts-table.tsx", "Contacts data table with same pattern as LeadsTable"],
        ["DashboardCards", "dashboard-cards.tsx", "KPI summary cards with label-above-number pattern and trend indicators"],
        ["DashboardCharts", "dashboard-charts.tsx", "Recharts-based pipeline funnel, donut, and bar chart compositions"],
        ["ActivityTimeline", "activity-timeline.tsx", "Chronological activity feed for lead/contact detail pages"],
        ["ForecastChart", "forecast-chart.tsx", "Pipeline and transaction forecast visualisation"],
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

    h2("5.1 Navigation & Workflow Architecture"),
    para(
      "The application's navigation is organised into six workflow-based groups that follow the end-to-end real estate sales process. This structure guides agents through a natural progression: generate leads → work the pipeline → manage listings → close transactions → run the business."
    ),
    emptyPara(),
    makeTable(
      ["Group", "Purpose", "Pages"],
      [
        ["Overview", "Command centre — daily snapshot of KPIs and agency health", "Dashboard"],
        ["Prospecting", "Lead generation — capture, automate first response, measure source ROI", "Inbound Leads, Show Days, Speed-to-Lead, Lead ROI"],
        ["Pipeline", "Working the deal — nurture, qualify, communicate, match buyers", "Leads, Pipeline Board, Contacts, Buyer Match, Sequences, Messaging"],
        ["Listings", "Property inventory — manage mandates, specs, valuations, and listing status", "Properties, CMA Reports"],
        ["Transactions", "Closing the deal — OTP through commission, paperwork, FICA", "Deals, Documents"],
        ["Operations", "Running the business — tasks, analytics, POPIA/FICA compliance", "Tasks, Reports, Compliance"],
      ]
    ),
    emptyPara(),

    h2("5.2 Route Map"),
    h3("Overview"),
    makeTable(
      ["Route", "File", "Description"],
      [
        ["/", "app/page.tsx", "Dashboard with KPIs, pipeline summary, forecast, recent activities, and top leads"],
      ]
    ),
    emptyPara(),
    h3("Prospecting"),
    makeTable(
      ["Route", "File", "Description"],
      [
        ["/inbound", "app/inbound/page.tsx", "Inbound lead portal injection with email paste, filter tabs, and KPI cards"],
        ["/showdays", "app/showdays/page.tsx", "Show day event management with KPI cards, scheduling, and lead capture"],
        ["/showday/[id]", "app/showday/[id]/page.tsx", "Public show day registration form (QR code compatible, no auth required)"],
        ["/speed-to-lead", "app/speed-to-lead/page.tsx", "Auto-response rule management with trigger configuration and conversion stats"],
        ["/lead-roi", "app/lead-roi/page.tsx", "Lead source ROI analytics with source cost tracking and KPI cards"],
      ]
    ),
    emptyPara(),
    h3("Pipeline"),
    makeTable(
      ["Route", "File", "Description"],
      [
        ["/leads", "app/leads/page.tsx", "Leads list with search, status filters, sorting, and create/edit/delete actions"],
        ["/leads/[id]", "app/leads/[id]/page.tsx", "Lead detail with 3-column layout — contact info, deal info, notes, activity timeline, task list"],
        ["/pipeline", "app/pipeline/page.tsx", "Visual pipeline board with 6 stages (New → Won/Lost), responsive grid layout"],
        ["/contacts", "app/contacts/page.tsx", "Contacts list with search, create/edit/delete actions"],
        ["/contacts/[id]", "app/contacts/[id]/page.tsx", "Contact detail with linked leads, activities, and tasks"],
        ["/buyer-match", "app/buyer-match/page.tsx", "Buyer-property matching engine with buyer profile management and KPI cards"],
        ["/sequences", "app/sequences/page.tsx", "Follow-up sequence builder with KPI cards, automated step configuration"],
        ["/messaging", "app/messaging/page.tsx", "SMS messaging hub with compose sheet, gateway notice, and message history"],
      ]
    ),
    emptyPara(),
    h3("Listings"),
    makeTable(
      ["Route", "File", "Description"],
      [
        ["/properties", "app/properties/page.tsx", "Property/mandate management with KPI cards, search, add/edit/delete"],
        ["/cma", "app/cma/page.tsx", "Comparative Market Analysis reports with PDF export, auto-fill from properties, clone, value range, confidence auto-score, and KPI cards"],
      ]
    ),
    emptyPara(),
    h3("Transactions"),
    makeTable(
      ["Route", "File", "Description"],
      [
        ["/transactions", "app/transactions/page.tsx", "Transaction list with search, stage filters, commission tracking, and FICA status"],
        ["/transactions/[id]", "app/transactions/[id]/page.tsx", "Transaction detail with stage timeline, commission calculator, FICA compliance, parties, dates, and stage history"],
        ["/transactions/pipeline", "app/transactions/pipeline/page.tsx", "Transaction Kanban board with 9 stages (OTP Signed → Commission Paid), drag-and-drop"],
        ["/documents", "app/documents/page.tsx", "Document management with upload sheet, storage notice, and KPI cards"],
      ]
    ),
    emptyPara(),
    h3("Operations"),
    makeTable(
      ["Route", "File", "Description"],
      [
        ["/tasks", "app/tasks/page.tsx", "Task management with KPIs, status filters, priority indicators, and completion toggling"],
        ["/reports", "app/reports/page.tsx", "Business reports with pipeline analytics, source analysis, and conversion metrics"],
        ["/compliance", "app/compliance/page.tsx", "POPIA compliance and regulatory management with consent tracking and tabbed views"],
      ]
    ),
    emptyPara(),
    h3("System"),
    makeTable(
      ["Route", "File", "Description"],
      [
        ["/login", "app/login/page.tsx", "Authentication page with Google OAuth and email/password sign-in"],
        ["/seed", "app/seed/page.tsx", "Data seeding utility to generate 1,350 test records with progress tracking"],
      ]
    ),
    emptyPara(),

    h2("5.3 Dashboard Features"),
    bullet("4 KPI cards: Total Leads, Active Pipeline Value, Won Revenue, Conversion Rate"),
    bullet("Pipeline summary with stage counts and weighted values"),
    bullet("Revenue forecast (weighted pipeline + won revenue)"),
    bullet("Recent activities feed (last 10 activities)"),
    bullet("Top leads by score"),
    emptyPara(),

    h2("5.4 Lead Management"),
    bullet("Full CRUD operations (Create, Read, Update, Delete)"),
    bullet("Status tracking: New → Contacted → Qualified → Proposal → Won / Lost"),
    bullet("Deal value tracking with currency formatting (ZAR)"),
    bullet("Source attribution (Website, LinkedIn, Referral, Cold Call, etc.)"),
    bullet("Lead scoring algorithm (0–100 scale) based on value, stage, engagement, tasks, and data completeness"),
    bullet("Contact linking via contactId"),
    bullet("Notes and activity history"),
    emptyPara(),

    h2("5.5 Contact Management"),
    bullet("Full CRUD operations"),
    bullet("Company and title tracking"),
    bullet("Linked leads display on contact detail page"),
    bullet("Activity history per contact"),
    emptyPara(),

    h2("5.6 Pipeline Visualisation"),
    bullet("6-stage visual board: New, Contacted, Qualified, Proposal, Won, Lost"),
    bullet("Responsive grid layout (2 columns mobile, 3 tablet, 6 desktop)"),
    bullet("Deal cards within each stage showing value and company"),
    bullet("Stage count and total value summaries"),
    emptyPara(),

    h2("5.7 Task Management"),
    bullet("KPI summary: Total, Pending, Completed, Overdue"),
    bullet("Pill-style status filter tabs"),
    bullet("Priority levels: Low, Medium, High"),
    bullet("Due date tracking"),
    bullet("Linked to leads or contacts"),
    emptyPara(),

    h2("5.8 Reports & Analytics"),
    bullet("Pipeline funnel chart"),
    bullet("Revenue by source breakdown"),
    bullet("Lead conversion metrics"),
    bullet("Export-ready layout with compact action buttons"),
    emptyPara(),

    h2("5.9 Property Management"),
    bullet("Property/mandate CRUD with listing details"),
    bullet("Mandate types: Sole, Open, Dual, Auction"),
    bullet("KPI cards: Total Properties, Active Mandates, Avg Listing Price"),
    bullet("Search and filter functionality"),
    emptyPara(),

    h2("5.10 Show Day Management"),
    bullet("Show day event scheduling with property linking"),
    bullet("Lead capture/registration per show day"),
    bullet("KPI cards: Total Show Days, Upcoming, Leads Captured"),
    bullet("Public registration form flow (QR code compatible)"),
    emptyPara(),

    h2("5.11 Inbound Lead Portal"),
    bullet("Email paste-and-parse for portal-injected leads"),
    bullet("Filter tabs for lead status/source"),
    bullet("KPI cards: Total Inbound, Unprocessed, Conversion Rate"),
    emptyPara(),

    h2("5.12 Messaging Hub"),
    bullet("SMS compose sheet with recipient selection"),
    bullet("Message history per contact"),
    bullet("Gateway integration notice (placeholder for SA SMS providers)"),
    emptyPara(),

    h2("5.13 Follow-up Sequences"),
    bullet("Automated follow-up sequence builder"),
    bullet("Step configuration with delay and channel"),
    bullet("Enrollment management for contacts/leads"),
    bullet("KPI cards: Active Sequences, Enrolled Contacts, Completion Rate"),
    emptyPara(),

    h2("5.14 Speed-to-Lead"),
    bullet("Auto-response rule creation with trigger event selection"),
    bullet("Conversion statistics and info cards"),
    bullet("KPI cards: Active Rules, Avg Response Time, Conversion Uplift"),
    emptyPara(),

    h2("5.15 Buyer-Property Matching"),
    bullet("Buyer profile management with preference criteria"),
    bullet("Property matching engine"),
    bullet("KPI cards: Active Buyers, Matched Properties, Match Rate"),
    emptyPara(),

    h2("5.16 Document Management"),
    bullet("Document upload with metadata and tagging"),
    bullet("Documents linked to transactions and contacts"),
    bullet("Storage notice with usage tracking"),
    emptyPara(),

    h2("5.17 Lead Source ROI"),
    bullet("Source cost tracking per lead channel"),
    bullet("ROI calculation: revenue vs cost per source"),
    bullet("KPI cards: Total Sources, Best ROI, Worst ROI"),
    emptyPara(),

    h2("5.18 Compliance"),
    bullet("POPIA consent tracking with opt-in/opt-out management"),
    bullet("Tabbed views: POPIA, FICA, Rolling 12-Month income"),
    bullet("KPI cards: Consent Rate, Overdue Reviews, Compliance Score"),

    h2("5.19 CMA Reports"),
    bullet("Comparative Market Analysis report management for property valuations"),
    bullet("Subject property details: address, suburb, city, type, bedrooms, bathrooms, erf size, floor size"),
    bullet("Comparable sales management: add/remove comparables with sale price, date, distance, and adjustments"),
    bullet("Auto-calculated estimated value and price per square metre from comparables"),
    bullet("Confidence auto-score: factors comparable count AND recency (6-month window) for Low/Medium/High"),
    bullet("Value range display: statistical ±range based on comparable price standard deviation (3–15% band)"),
    bullet("Report status workflow: Draft → Final → Presented"),
    bullet("KPI cards: Total Reports, Average Value, Avg R/m², Finalised Reports"),
    bullet("Search by title, address, suburb, or contact name"),
    bullet("Inline add, edit, and delete with slide-over Sheet forms"),
    bullet("Auto-fill from existing properties: select a property to populate all subject fields"),
    bullet("Clone CMA: duplicate any report as a new draft with '(Copy)' suffix"),
    bullet("PDF export: professional 4-page PDF with cover page, subject details, valuation summary, comparables table, feature comparison, statistics, and disclaimer (via @react-pdf/renderer)"),

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
        ["Lead", "leads", "name, email, phone, company, status, source, notes, value, contactId, score, assignedAgentId, assignedAgentName, assignedAt, ownerId"],
        ["Contact", "contacts", "name, email, phone, company, title, notes, assignedAgentId, assignedAgentName, assignedAt, ownerId"],
        ["Activity", "activities", "type (call/email/meeting/note), subject, description, leadId, contactId, ownerId"],
        ["Task", "tasks", "title, description, dueDate, status (pending/completed/overdue), priority (low/medium/high), leadId, contactId, ownerId"],
        ["Transaction", "transactions", "propertyAddress, salePrice, commissionRate, commissionAmount, vatIncluded, vatAmount, splits[], agentNetCommission, stage (9 stages), stageHistory[], ficaBuyer, ficaSeller, conveyancer, bondOriginator, buyerName, sellerName, leadId, contactId, ownerId"],
        ["ShowDay", "showDays", "title, propertyId, date, startTime, endTime, address, notes, propertyId (linked listing), ownerId"],
        ["ShowDayLead", "showDayLeads", "showDayId, name, email, phone, notes, contactId (visitor link), ownerId"],
        ["Property", "properties", "title, address, suburb, city, province, price, bedrooms, bathrooms, garages, erfSize, floorSize, mandateType (sole/open/dual/auction), status, contactId (seller link), notes, ownerId"],
        ["InboundLead", "inboundLeads", "source, rawContent, parsedName, parsedEmail, parsedPhone, status, contactId (linked on acceptance), notes, ownerId"],
        ["SmsMessage", "smsMessages", "contactId, contactName, phone, message, direction, status, ownerId"],
        ["FollowUpSequence", "followUpSequences", "name, description, steps[] (delay, channel, template), isActive, ownerId"],
        ["SequenceEnrollment", "sequenceEnrollments", "sequenceId, contactId, leadId, currentStep, status, nextRunAt, ownerId"],
        ["BuyerProfile", "buyerProfiles", "name, email, phone, minPrice, maxPrice, suburbs[], bedrooms, propertyType, notes, ownerId"],
        ["StoredDocument", "documents", "name, type, size, url, transactionId, contactId, tags[], ownerId"],
        ["AutoResponseRule", "autoResponseRules", "name, triggerEvent, responseTemplate, channel, delaySeconds, isActive, ownerId"],
        ["CmaReport", "cmaReports", "title, subjectAddress, subjectSuburb, subjectCity, subjectType, subjectBedrooms, subjectBathrooms, subjectErfSize, subjectFloorSize, comparables[] (address, salePrice, saleDate, bedrooms, bathrooms, erfSize, floorSize, distanceKm, adjustedPrice), estimatedValue, pricePerSqm, confidenceLevel (low/medium/high), status (draft/final/presented), propertyId, contactId, contactName, notes, ownerId"],
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
        ["getTasksByContact", "getTasksByContact(contactId) → Promise<Task[]>", "Fetches tasks linked to a contact."],
        ["updateTask", "updateTask(id, data) → Promise<void>", "Partially updates a task."],
        ["deleteTask", "deleteTask(id) → Promise<void>", "Deletes a task."],
      ]
    ),
    emptyPara(),

    h3("6.1.6 Transaction Functions"),
    makeTable(
      ["Function", "Signature", "Description"],
      [
        ["addTransaction", "addTransaction(tx) → Promise<string>", "Creates a new transaction document. Returns generated ID."],
        ["getTransactions", "getTransactions() → Promise<Transaction[]>", "Fetches all transactions ordered by createdAt descending."],
        ["getTransactionById", "getTransactionById(id) → Promise<Transaction|null>", "Fetches a single transaction by ID."],
        ["updateTransaction", "updateTransaction(id, data) → Promise<void>", "Partially updates a transaction."],
        ["deleteTransaction", "deleteTransaction(id) → Promise<void>", "Deletes a transaction."],
        ["getTransactionsByLead", "getTransactionsByLead(leadId) → Promise<Transaction[]>", "Fetches transactions linked to a lead."],
        ["getTransactionsByContact", "getTransactionsByContact(contactId) → Promise<Transaction[]>", "Fetches transactions linked to a contact."],
      ]
    ),
    emptyPara(),

    h3("6.1.7 Batch Operations"),
    makeTable(
      ["Function", "Signature", "Description"],
      [
        ["batchWrite", "batchWrite(collection, documents[], onProgress?) → Promise<string[]>", "Writes documents in batches of 450 (Firestore limit is 500). Returns array of generated IDs. Reports progress via callback."],
        ["clearCollection", "clearCollection(collection, onProgress?) → Promise<number>", "Deletes all documents in a collection using batched deletes. Returns count of deleted documents."],
      ]
    ),
    emptyPara(),

    h3("6.1.8 Show Day Functions"),
    makeTable(
      ["Function", "Signature", "Description"],
      [
        ["addShowDay", "addShowDay(showDay) → Promise<string>", "Creates a new show day event. Returns document ID."],
        ["getShowDays", "getShowDays() → Promise<ShowDay[]>", "Fetches all show days ordered by date."],
        ["getShowDayById", "getShowDayById(id) → Promise<ShowDay|null>", "Fetches a single show day by ID."],
        ["deleteShowDay", "deleteShowDay(id) → Promise<void>", "Deletes a show day event."],
        ["addShowDayLead", "addShowDayLead(lead) → Promise<string>", "Registers a lead for a show day event."],
        ["getShowDayLeads", "getShowDayLeads(showDayId) → Promise<ShowDayLead[]>", "Fetches all leads registered for a show day."],
      ]
    ),
    emptyPara(),

    h3("6.1.9 Property Functions"),
    makeTable(
      ["Function", "Signature", "Description"],
      [
        ["addProperty", "addProperty(property) → Promise<string>", "Creates a new property listing."],
        ["getProperties", "getProperties() → Promise<Property[]>", "Fetches all properties."],
        ["getPropertyById", "getPropertyById(id) → Promise<Property|null>", "Fetches a single property by ID."],
        ["updateProperty", "updateProperty(id, data) → Promise<void>", "Partially updates a property."],
        ["deleteProperty", "deleteProperty(id) → Promise<void>", "Deletes a property listing."],
        ["getPropertiesByContact", "getPropertiesByContact(contactId) → Promise<Property[]>", "Fetches properties where contact is the seller."],
      ]
    ),
    emptyPara(),

    h3("6.1.10 Inbound Lead Functions"),
    makeTable(
      ["Function", "Signature", "Description"],
      [
        ["addInboundLead", "addInboundLead(lead) → Promise<string>", "Creates an inbound lead from portal injection."],
        ["getInboundLeads", "getInboundLeads() → Promise<InboundLead[]>", "Fetches all inbound leads."],
        ["updateInboundLead", "updateInboundLead(id, data) → Promise<void>", "Updates an inbound lead status/notes."],
      ]
    ),
    emptyPara(),

    h3("6.1.11 SMS Message Functions"),
    makeTable(
      ["Function", "Signature", "Description"],
      [
        ["addSmsMessage", "addSmsMessage(msg) → Promise<string>", "Records an SMS message."],
        ["getSmsMessages", "getSmsMessages() → Promise<SmsMessage[]>", "Fetches all SMS messages."],
        ["getSmsByContact", "getSmsByContact(contactId) → Promise<SmsMessage[]>", "Fetches SMS history for a contact."],
      ]
    ),
    emptyPara(),

    h3("6.1.12 Follow-up Sequence Functions"),
    makeTable(
      ["Function", "Signature", "Description"],
      [
        ["addSequence", "addSequence(seq) → Promise<string>", "Creates a follow-up sequence template."],
        ["getSequences", "getSequences() → Promise<FollowUpSequence[]>", "Fetches all sequences."],
        ["updateSequence", "updateSequence(id, data) → Promise<void>", "Updates a sequence template."],
        ["deleteSequence", "deleteSequence(id) → Promise<void>", "Deletes a sequence."],
        ["addEnrollment", "addEnrollment(enrollment) → Promise<string>", "Enrolls a contact in a sequence."],
        ["getEnrollments", "getEnrollments() → Promise<SequenceEnrollment[]>", "Fetches all enrollments."],
        ["updateEnrollment", "updateEnrollment(id, data) → Promise<void>", "Updates enrollment progress/status."],
      ]
    ),
    emptyPara(),

    h3("6.1.13 Buyer Profile Functions"),
    makeTable(
      ["Function", "Signature", "Description"],
      [
        ["addBuyerProfile", "addBuyerProfile(profile) → Promise<string>", "Creates a buyer profile."],
        ["getBuyerProfiles", "getBuyerProfiles() → Promise<BuyerProfile[]>", "Fetches all buyer profiles."],
        ["updateBuyerProfile", "updateBuyerProfile(id, data) → Promise<void>", "Updates a buyer profile."],
        ["deleteBuyerProfile", "deleteBuyerProfile(id) → Promise<void>", "Deletes a buyer profile."],
        ["getBuyerProfilesByContact", "getBuyerProfilesByContact(contactId) → Promise<BuyerProfile[]>", "Fetches buyer profiles linked to a contact."],
      ]
    ),
    emptyPara(),

    h3("6.1.14 Document Functions"),
    makeTable(
      ["Function", "Signature", "Description"],
      [
        ["addStoredDocument", "addStoredDocument(doc) → Promise<string>", "Stores document metadata."],
        ["getDocumentsByTransaction", "getDocumentsByTransaction(txId) → Promise<StoredDocument[]>", "Fetches documents for a transaction."],
        ["getDocumentsByContact", "getDocumentsByContact(contactId) → Promise<StoredDocument[]>", "Fetches documents for a contact."],
        ["deleteStoredDocument", "deleteStoredDocument(id) → Promise<void>", "Deletes a stored document."],
      ]
    ),
    emptyPara(),

    h3("6.1.15 Auto-Response Rule Functions"),
    makeTable(
      ["Function", "Signature", "Description"],
      [
        ["addAutoResponseRule", "addAutoResponseRule(rule) → Promise<string>", "Creates a speed-to-lead auto-response rule."],
        ["getAutoResponseRules", "getAutoResponseRules() → Promise<AutoResponseRule[]>", "Fetches all auto-response rules."],
        ["updateAutoResponseRule", "updateAutoResponseRule(id, data) → Promise<void>", "Updates an auto-response rule."],
        ["deleteAutoResponseRule", "deleteAutoResponseRule(id) → Promise<void>", "Deletes an auto-response rule."],
      ]
    ),
    emptyPara(),

    h3("6.1.16 CMA Report Functions"),
    makeTable(
      ["Function", "Signature", "Description"],
      [
        ["addCmaReport", "addCmaReport(report) → Promise<string>", "Creates a new Comparative Market Analysis report. Auto-sets createdAt/updatedAt timestamps."],
        ["getCmaReports", "getCmaReports() → Promise<CmaReport[]>", "Fetches all CMA reports ordered by createdAt descending."],
        ["getCmaReportById", "getCmaReportById(id) → Promise<CmaReport|null>", "Fetches a single CMA report by document ID."],
        ["updateCmaReport", "updateCmaReport(id, data) → Promise<void>", "Partially updates a CMA report. Auto-sets updatedAt."],
        ["deleteCmaReport", "deleteCmaReport(id) → Promise<void>", "Permanently deletes a CMA report."],
        ["getCmaReportsByContact", "getCmaReportsByContact(contactId) → Promise<CmaReport[]>", "Fetches CMA reports linked to a contact."],
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

    h2("6.4 Commission Calculator"),
    para(
      "The commission calculator computes gross commission, VAT (15% SA standard rate), commission splits, and agent net commission for property transactions."
    ),
    makeTable(
      ["Input", "Type", "Description"],
      [
        ["salePrice", "number", "Property sale price in ZAR"],
        ["commissionRate", "number", "Commission percentage (typically 3–7.5%)"],
        ["vatIncluded", "boolean", "Whether to add 15% VAT to gross commission"],
        ["splits", "CommissionSplit[]", "Array of { party, percentage, amount } for commission sharing"],
      ]
    ),
    emptyPara(),
    para("Output: { grossCommission, vatAmount, totalSplits, agentNetCommission }"),

    h2("6.5 Transaction Forecasting"),
    para(
      "Transaction forecasting uses stage-specific probability to weight pending commission amounts:"
    ),
    makeTable(
      ["Stage", "Probability"],
      [
        ["OTP Signed", "30%"],
        ["FICA Submitted", "40%"],
        ["FICA Verified", "55%"],
        ["Bond Applied", "65%"],
        ["Bond Approved", "80%"],
        ["Transfer Lodged", "90%"],
        ["Transfer Registered", "95%"],
        ["Commission Paid", "100%"],
        ["Fallen Through", "0%"],
      ]
    ),
    emptyPara(),
    para("Forecast Output: stages[], totalPendingCommission, weightedPendingCommission, earnedCommission, activeTransactions."),

    h2("6.6 Authentication (src/lib/hooks/use-auth.ts)"),
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

    h2("6.7 Utility Functions"),
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
      "The seeder utility (accessible at /seed) generates 1,604 realistic test records across 16 collections for development and demonstration purposes. It uses South African names, companies, addresses, and phone formats to create authentic-looking data."
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
        ["Transactions", "150", "SA-specific addresses, suburbs, conveyancers, bond originators, 9-stage pipeline"],
        ["Properties", "120", "Mandate types, SA suburbs, features, price ranges R800K–R15M"],
        ["Show Days", "30", "Linked to properties, with date/time and registration details"],
        ["Show Day Leads", "90", "Public registrations linked to show days"],
        ["Inbound Leads", "80", "Portal sources (Property24, Private Property, manual)"],
        ["SMS Messages", "200", "Inbound/outbound with SA-specific templates"],
        ["Follow-Up Sequences", "8", "Multi-step workflows with delay, channel, and template"],
        ["Sequence Enrollments", "60", "Contacts enrolled in active sequences"],
        ["Buyer Profiles", "50", "Suburb preferences, price ranges, bedroom requirements"],
        ["Documents", "100", "FICA, OTP, mandate, bond, transfer document types"],
        ["Auto-Response Rules", "6", "Speed-to-lead rules with trigger events and delays"],
        ["CMA Reports", "40", "Comparative Market Analysis reports with 3–6 comparables each, SA suburbs and valuations"],
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
    bullet("Server-side API route (api/seed) using Firebase Admin SDK with Bearer token authentication"),
    bullet("Uses Firestore writeBatch for bulk writes (450 documents per batch, Firestore limit is 500)"),
    bullet("Parallel batch writes across all 16 collections for maximum speed"),
    bullet("Progress bar with real-time percentage and record count"),
    bullet("'Clear All' button to delete all existing data before re-seeding"),
    bullet("Batch write utility returns array of generated document IDs for cross-referencing"),

    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function sectionTesting() {
  return [
    heading("9. Testing & Quality Assurance"),

    h2("9.1 Test Framework"),
    para(
      "Thina CRM uses a two-tier test strategy: Vitest for unit/smoke tests (runs in CI) and Playwright for on-demand E2E functional tests."
    ),
    bullet("Unit/Smoke: Vitest 4.x with @vitejs/plugin-react — runs in CI, blocks deployment on failure"),
    bullet("E2E: Playwright with Chromium — on-demand functional tests against the live deployment"),
    bullet("Config: vitest.config.ts (unit), playwright.config.ts (E2E)"),
    bullet("Scripts: npm test (unit), npm run test:ci (CI), npm run test:e2e (on-demand E2E)"),
    bullet("CI Integration: Unit tests run in GitHub Actions before every build — E2E tests are manual only"),
    emptyPara(),

    h2("9.2 Test Strategy (3 Layers)"),
    para(
      "The test suite is organised into three layers, each catching different classes of bugs:"
    ),
    emptyPara(),
    h3("Layer 1: Unit Tests — Pure Business Logic"),
    para(
      "Test pure functions that have zero infrastructure dependencies. These are fast, deterministic, and cover the core business rules."
    ),
    makeTable(
      ["Test File", "Coverage", "Tests"],
      [
        ["scoring.test.ts", "Lead scoring algorithm (calculateLeadScore): value scoring, stage points, activity engagement, task completion, data completeness, boundary checks (0–100 clamping)", "10"],
        ["scoring.test.ts", "Score labels (getScoreLabel): Hot/Warm/Interested/Cool/Cold thresholds and color strings", "6"],
        ["scoring.test.ts", "Pipeline forecasting (calculateForecast): weighted pipeline, won revenue, stage probabilities, lost lead exclusion", "5"],
        ["scoring.test.ts", "Commission calculator (calculateCommission): base commission, VAT calculation, splits deduction, zero-handling, edge cases", "12"],
        ["scoring.test.ts", "Transaction forecasting (calculateTransactionForecast): stage-weighted revenue, monthly projections, pipeline metrics", "10"],
        ["utils.test.ts", "cn() class name merge: Tailwind conflict resolution, conditional classes, null/undefined handling", "6"],
        ["api-health.test.ts", "Health API (GET /api/health): healthy status with Firestore, unhealthy fallback", "2"],
        ["api-cma-research.test.ts", "CMA Research API (POST /api/cma/research): auth check, missing API key, missing params, Gemini success, no-content error", "5"],
        ["api-inbound.test.ts", "Inbound webhook (POST /api/leads/inbound): HMAC auth required, missing/invalid signature, empty content, missing ownerId, invalid source, valid HMAC create, GET pending count", "8"],
        ["api-sms.test.ts", "SMS gateway (POST /api/sms/send): no auth, bad format, invalid token, missing to/body, message length, GET status", "7"],
      ]
    ),
    emptyPara(),
    h3("Layer 2: Infrastructure Smoke Tests"),
    para(
      "Validate that configuration files, environment variables, and security rules are correctly set up. These tests would have caught the missing Firestore database incident."
    ),
    makeTable(
      ["Test Group", "What It Catches"],
      [
        ["Environment Configuration", "Missing or empty Firebase env vars that would produce a silently broken app"],
        ["Project Configuration", "Missing dependencies, broken scripts, missing test framework, strict mode disabled"],
        ["Firebase Configuration", "Wrong deployment region, missing security rules for collections, unrestricted read/write rules"],
        ["Security Rules Validation", "Rules require authentication for reads, ownership for writes; no open access patterns"],
        ["Data Model Consistency", "All CRUD functions exported from firestore.ts; all scoring functions exported"],
      ]
    ),
    emptyPara(),
    h3("Layer 3: Build Verification"),
    para(
      "Each version undergoes a full Next.js production build verification. The build process compiles TypeScript, validates all imports, resolves module paths, and generates optimised bundles for all 27 pages."
    ),
    emptyPara(),

    h2("9.3 End-to-End Functional Tests (Playwright)"),
    para(
      "On-demand E2E tests validate all application screens against the live deployment. These run only when manually triggered (npm run test:e2e) and require a test user account."
    ),
    makeTable(
      ["Test Group", "What It Validates", "Tests"],
      [
        ["Authentication", "Login page renders, email/password sign-in works, redirect to dashboard", "2"],
        ["Dashboard", "KPI cards (Total Leads, Won Deals, Pipeline Value), Pipeline Forecast section", "2"],
        ["Leads", "Leads table loads, lead detail page does not show 'not found'", "2"],
        ["Contacts", "Contacts table loads, contact detail page does not show 'not found'", "2"],
        ["Pipeline", "Board loads with stage columns (New, Contacted, Qualified)", "1"],
        ["Tasks", "Tasks page loads with Pending section", "1"],
        ["Reports", "Reports page loads with Total Leads metric", "1"],
        ["Transactions", "Transaction list loads with table, detail page with Commission Calculator and FICA Compliance, stage timeline with Parties, Sale Price, Agent Net Commission", "3"],
        ["Transaction Pipeline", "Pipeline board loads with 9 stage columns (OTP Signed, Bond Applied, Commission Paid)", "1"],
        ["Dashboard — Tx KPIs", "Transaction KPI cards visible when transactions exist (Active Transactions, Pending/Expected/Earned Commission)", "1"],
        ["Health API", "GET /api/health returns healthy status with Firestore connectivity", "1"],
        ["Properties", "Property list table loads, add property sheet opens with required fields, search input works", "3"],
        ["Show Days", "Show day list loads with KPI cards, new show day sheet opens with required fields", "2"],
        ["Inbound Leads", "Inbound lead list loads with KPI cards, paste lead email sheet opens, filter tabs clickable", "3"],
        ["Messaging", "SMS page loads with gateway notice, compose sheet opens with form fields", "2"],
        ["Follow-up Sequences", "Sequence list loads with KPI cards, new sequence sheet opens with form", "2"],
        ["Speed-to-Lead", "Page loads with KPI cards, info card shows conversion stat, new rule sheet opens with trigger options", "3"],
        ["Buyer-Property Matching", "Page loads with KPI cards, new buyer profile sheet opens with form fields", "2"],
        ["Documents", "Document vault loads with storage notice, upload sheet opens with form fields", "2"],
        ["Lead Source ROI", "ROI page loads with KPI cards, set source cost sheet opens", "2"],
        ["Compliance", "POPIA page loads with tabs, consent KPI cards, can switch between tabs", "3"],
        ["Sidebar Navigation", "Sidebar displays workflow group labels, all 15 sidebar links navigate correctly to their pages", "20"],
        ["Command Palette", "Ctrl+K opens palette, finds compliance page, finds properties page", "3"],
        ["Responsive / Mobile", "Pages are usable on mobile viewport, mobile nav menu opens and shows grouped navigation", "2"],
        ["Page Load Performance", "All 11 feature pages load within 10 seconds (Properties, Show Days, Inbound, Messaging, Sequences, Speed-to-Lead, Buyer Match, Documents, Lead ROI, Compliance, CMA Reports)", "11"],
        ["Accessibility Basics", "All pages have visible h1 heading, all buttons are keyboard focusable, form labels are associated with inputs", "3"],
        ["Empty State Usability", "Properties, show days, messaging, sequences, documents, speed-to-lead show table or empty state", "6"],
        ["Contact Pickers on Forms", "Property form has seller details section, transaction form has contact picker, show day form has property address field, CMA form has contact picker dropdown", "4"],
        ["Contact Detail Page", "Contact detail page shows expanded entity sections with related data", "1"],
      ]
    ),
    emptyPara(),

    h2("9.4 Test Metrics (v1.2.0)"),
    makeTable(
      ["Metric", "Value"],
      [
        ["Unit/Smoke Framework", "Vitest 4.x"],
        ["E2E Framework", "Playwright (Chromium)"],
        ["Unit/Smoke Test Files", "9"],
        ["E2E Test Files", "1"],
        ["Total Unit/Smoke Tests", "91"],
        ["Total E2E Tests", "89"],
        ["Combined Total Tests", "180"],
        ["Pass Rate", "100% unit, 98% E2E (1 transient timeout on Messaging sidebar nav)"],
        ["Unit Execution Time", "~10 seconds"],
        ["E2E Execution Time", "~14 minutes"],
        ["CI Integration", "Unit tests in GitHub Actions — E2E on-demand only"],
      ]
    ),
    emptyPara(),

    h2("9.5 Type Safety"),
    bullet("TypeScript strict mode enabled (strict: true in tsconfig.json)"),
    bullet("All Firestore data models are typed with explicit interfaces"),
    bullet("Component props are typed via TypeScript generics and Radix UI prop types"),
    bullet("Path alias (@/*) mapped to ./src/* for clean imports"),
    emptyPara(),

    h2("9.6 Manual Testing Performed"),
    makeTable(
      ["Area", "Test Scope"],
      [
        ["Authentication", "Google OAuth sign-in, email/password sign-in and registration, sign-out, auth guard redirect"],
        ["Lead CRUD", "Create, read, update, delete leads; status transitions; value changes"],
        ["Contact CRUD", "Create, read, update, delete contacts; linked leads display"],
        ["Pipeline", "Visual board rendering; stage distribution; colour-coded columns; responsive layout"],
        ["Tasks", "Create tasks; status toggling; priority filtering; overdue detection"],
        ["Reports", "Chart rendering; KPI calculations; data aggregation"],
        ["Seed Data", "Bulk generation of 1,604 records across 16 collections; progress tracking; data clearing"],
        ["Responsive UI", "Mobile bottom nav; tablet grid; desktop sidebar; breakpoint transitions"],
        ["Dark/Light Mode", "Theme toggle; sidebar respects theme; localStorage persistence; all pages in both modes"],
        ["Command Palette", "⌘+K activation; navigation commands; theme commands"],
      ]
    ),
    emptyPara(),

    h2("9.7 Future Testing Roadmap"),
    bullet("Extend E2E tests: CRUD operations (create/edit/delete leads, contacts), pipeline drag-and-drop"),
    bullet("Firebase Emulator integration tests (Firestore rules, Admin SDK operations)"),
    bullet("Accessibility audit (WCAG compliance via axe-core)"),
    bullet("Performance benchmarking (Lighthouse CI)"),

    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function sectionIntegration() {
  return [
    heading("10. System Integration & Configuration"),

    h2("10.1 Git & GitHub Configuration"),
    h3("10.1.1 Repository"),
    makeTable(
      ["Setting", "Value"],
      [
        ["Repository URL", "https://github.com/gabrielza/thina-crm.git"],
        ["Branch", "master"],
        ["Committer", "Gabriel d'Oliveira (gadolive@microsoft.com)"],
        ["Commit Convention", "Conventional commits (feat:, test:, fix:, etc.)"],
        ["Tagging Strategy", "Semantic version tags (v0.1.0 through v1.1.0) — annotated tags on every release"],
        ["Push Command", "git push origin master --tags"],
        [".gitignore", "node_modules/, .next/, .env.local, tmp-e2e-user.json, build artifacts"],
      ]
    ),
    emptyPara(),

    h3("10.1.2 GitHub Actions CI/CD"),
    bullet("Unit and smoke tests run automatically on every push to master"),
    bullet("Test failure blocks deployment — broken code never reaches production"),
    bullet("E2E tests are on-demand only (not in CI pipeline) — run via npm run test:e2e"),
    bullet("Pipeline: Push → GitHub Actions (Vitest) → Firebase App Hosting auto-deploy"),
    emptyPara(),

    h2("10.2 Firebase Configuration"),
    h3("10.2.1 Project Setup"),
    makeTable(
      ["Setting", "Value"],
      [
        ["Project ID", "thina-crm"],
        ["Firebase Plan", "Blaze (pay as you go)"],
        ["Web App Names", "thina-crm, Thina_Web_App"],
        ["Active App ID", "1:758961001539:web:5ae4e45100fc5220e870f6"],
        ["Firebase CLI", "Installed globally via npm install -g firebase-tools"],
      ]
    ),
    emptyPara(),

    h3("10.2.2 Firebase Authentication"),
    makeTable(
      ["Setting", "Value"],
      [
        ["Providers Enabled", "Google OAuth 2.0, Email/Password"],
        ["Client Integration", "firebase/auth with onAuthStateChanged listener"],
        ["Auth State Management", "Custom useAuth() hook in shared AuthProvider context"],
        ["Route Protection", "AuthGuard component wraps all routes except /login"],
        ["Data Ownership", "ownerId field on every document links data to authenticated user"],
        ["E2E Test User", "e2e-test2@thina-crm.test (created via Firebase REST API)"],
      ]
    ),
    emptyPara(),

    h3("10.2.3 Cloud Firestore"),
    makeTable(
      ["Setting", "Value"],
      [
        ["Database", "(default)"],
        ["Region", "africa-south1 (Johannesburg)"],
        ["Edition", "Standard (free tier eligible)"],
        ["Collections", "leads, contacts, activities, tasks, transactions, showDays, showDayLeads, properties, inboundLeads, smsMessages, followUpSequences, sequenceEnrollments, buyerProfiles, documents, autoResponseRules, cmaReports (16 total)"],
        ["Client SDK", "firebase/firestore — real-time reads, write operations"],
        ["Admin SDK", "firebase-admin — server-side seed API, health check"],
        ["Batch Operations", "writeBatch for seed data (batches of 450)"],
      ]
    ),
    emptyPara(),

    h3("10.2.4 Firestore Security Rules"),
    para(
      "All 16 collections follow a consistent security pattern defined in firestore.rules:"
    ),
    bullet("isAuth() — Checks request.auth != null for any authenticated user"),
    bullet("isCreatingOwn() — Validates incoming ownerId matches the authenticated user's UID"),
    bullet("isOwner() — Validates existing document ownerId matches authenticated user's UID"),
    bullet("allow read: if isAuth() — Any authenticated user can read documents"),
    bullet("allow create: if isCreatingOwn() — Must set ownerId to own UID when creating"),
    bullet("allow update, delete: if isOwner() — Only the document owner can modify or delete"),
    bullet("No open access patterns — no 'allow read, write: if true' anywhere in the rules"),
    bullet("Special rules: showDays allows public read (QR code forms); showDayLeads allows public create with schema validation (type, length, field count constraints)"),
    bullet("Rules deployed via: npx firebase-tools deploy --only firestore:rules --project thina-crm"),
    emptyPara(),

    h3("10.2.5 Firebase Client SDK (src/lib/firebase.ts)"),
    para(
      "Client-side Firebase initialisation using 7 environment variables from .env.local:"
    ),
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

    h3("10.2.6 Firebase Admin SDK (src/lib/firebase-admin.ts)"),
    bullet("Server-side initialisation for API routes (seed endpoint, health check, inbound webhook, SMS gateway)"),
    bullet("Uses Application Default Credentials in production (Firebase App Hosting auto-provisions)"),
    bullet("Enables privileged operations: batch writes, collection counts, user management"),
    emptyPara(),

    h3("10.2.7 Server-Side Environment Variables"),
    makeTable(
      ["Variable", "Purpose"],
      [
        ["BULKSMS_TOKEN_ID", "BulkSMS API token ID for SMS gateway authentication"],
        ["BULKSMS_TOKEN_SECRET", "BulkSMS API token secret for SMS gateway authentication"],
        ["INBOUND_WEBHOOK_SECRET", "HMAC-SHA256 shared secret for inbound lead webhook signature verification"],
        ["GEMINI_API_KEY", "Google Gemini API key for AI-powered CMA research (stored in Cloud Secret Manager)"],
      ]
    ),
    emptyPara(),

    h3("10.2.8 Firebase App Hosting"),
    makeTable(
      ["Setting", "Value"],
      [
        ["Hosting Region", "europe-west4"],
        ["Production URL", "https://thina-crm--thina-crm.europe-west4.hosted.app"],
        ["Config File", "apphosting.yaml"],
        ["Auto-Deploy Trigger", "Push to master branch on GitHub"],
        ["Min Instances", "0 (scales to zero when idle)"],
        ["Max Instances", "2"],
        ["Memory", "512 MiB"],
      ]
    ),
    emptyPara(),

    h3("10.2.9 Firebase Configuration Files"),
    makeTable(
      ["File", "Purpose"],
      [
        ["firebase.json", "Project services configuration, region settings"],
        ["firestore.rules", "Security rules for all 16 collections"],
        ["firestore.indexes.json", "Composite index definitions"],
        ["apphosting.yaml", "App Hosting deployment configuration (instances, memory, region)"],
      ]
    ),
    emptyPara(),

    h2("10.3 TypeScript Configuration (tsconfig.json)"),
    makeTable(
      ["Setting", "Value"],
      [
        ["Strict Mode", "true"],
        ["Path Alias", "@/* → ./src/*"],
        ["Module Resolution", "Bundler"],
        ["Target", "ES2017"],
        ["JSX", "preserve (handled by Next.js)"],
      ]
    ),
    emptyPara(),

    h2("10.4 Tailwind & PostCSS"),
    bullet("tailwind.config.js — Extended theme with Zinc/Indigo palette, custom animations, dark mode"),
    bullet("postcss.config.mjs — Tailwind CSS + Autoprefixer plugins"),
    bullet("globals.css — CSS custom properties for theme colours (HSL-based, light/dark)"),
    emptyPara(),

    h2("10.5 Playwright Configuration (playwright.config.ts)"),
    makeTable(
      ["Setting", "Value"],
      [
        ["Browser", "Chromium only"],
        ["Base URL", "Live deployment (overridable via DEPLOY_URL env var)"],
        ["Execution", "Sequential (not parallel — tests share auth state)"],
        ["Test Timeout", "60 seconds per test"],
        ["Expect Timeout", "30 seconds for assertions"],
        ["Retries", "1 (handles transient deployment latency)"],
        ["Screenshots", "Only on failure"],
        ["Trace", "On first retry"],
        ["Reporter", "List + HTML (open: never)"],
      ]
    ),
    emptyPara(),

    h2("10.6 External Services"),
    makeTable(
      ["Service", "Purpose", "Integration Method"],
      [
        ["Google OAuth", "User authentication", "Firebase Auth SDK → Google Identity Platform"],
        ["Cloud Firestore", "Database", "Firebase Client SDK (web) + Admin SDK (server)"],
        ["Firebase App Hosting", "Deployment", "GitHub webhook → auto-build → deploy"],
        ["GitHub Actions", "CI/CD", "Automated test runs on push, blocks deploy on failure"],
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
      "Thina CRM uses Firebase App Hosting with automatic deployments triggered by pushes to the master branch on GitHub. The deployment pipeline runs automated tests via GitHub Actions, then builds the Next.js application, optimises assets, and deploys to Google Cloud infrastructure."
    ),
    emptyPara(),

    h2("11.2 CI/CD Pipeline"),
    para("The complete deployment pipeline from code change to production:"),
    new Paragraph({
      spacing: { after: 40 },
      children: [bold("Step 1: "), normal("Developer commits code changes to local Git repository")],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [bold("Step 2: "), normal("Git tag created for version (e.g., v0.11.0)")],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [bold("Step 3: "), normal("Push to GitHub (git push origin master --tags)")],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [bold("Step 4: "), normal("GitHub Actions triggers — runs Vitest unit and smoke tests")],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [bold("Step 5: "), normal("If tests pass, Firebase App Hosting detects push and triggers build")],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [bold("Step 6: "), normal("Next.js production build runs in cloud (TypeScript compilation, bundling, static generation)")],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [bold("Step 7: "), normal("Application deployed to https://thina-crm--thina-crm.europe-west4.hosted.app")],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [bold("Step 8: "), normal("(Optional) Developer runs E2E tests against live deployment: npm run test:e2e")],
    }),
    emptyPara(),

    h2("11.3 Deployment Configuration"),
    h3("11.3.1 apphosting.yaml"),
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

    h2("11.4 Firestore Rules Deployment"),
    para("Security rules are deployed separately from the application code:"),
    bullet("Command: npx firebase-tools deploy --only firestore:rules --project thina-crm"),
    bullet("Rules are compiled and validated before deployment"),
    bullet("Deployed whenever collection security patterns change"),
    emptyPara(),

    h2("11.5 Production URL"),
    para("https://thina-crm--thina-crm.europe-west4.hosted.app"),

    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function sectionVersionHistory() {
  return [
    heading("12. AI-Assisted Development"),

    para(
      "Thina CRM was developed with the assistance of GitHub Copilot (Claude Opus 4.6), an AI programming assistant integrated into VS Code. This section documents Copilot's role in the development process and the scope of its contributions."
    ),
    emptyPara(),

    h2("12.1 Development Methodology"),
    para(
      "The development followed an iterative version-based approach. The human developer defined requirements, prioritised features, and directed the overall architecture. GitHub Copilot acted as an expert implementation partner — writing code, configuring infrastructure, running tests, deploying, and generating documentation."
    ),
    emptyPara(),
    para(
      "At each version milestone, Copilot was instructed to: implement the feature, build and verify, run all tests, deploy to production, update the specification document, and commit/push to Git. This ensured every version was production-ready before moving to the next."
    ),
    emptyPara(),

    h2("12.2 Copilot Contributions by Version"),
    makeTable(
      ["Version", "Copilot Contributions"],
      [
        ["v0.1.0", "Project scaffolding (Next.js 15, TypeScript strict, Firebase integration), authentication implementation, folder structure"],
        ["v0.2.0", "Firestore data layer with typed interfaces, Lead and Contact CRUD functions, shadcn/ui component setup"],
        ["v0.3.0", "Pipeline Kanban board, task management system, activity logging, detail page layouts"],
        ["v0.4.0", "Lead scoring algorithm (5-dimension, 0–100 scale), pipeline forecasting, Recharts integration, reports page"],
        ["v0.5.0", "Full UI redesign (\"Linear Aesthetic\"), command palette, dark mode, page transitions, data seeder (1,200 records)"],
        ["v0.6.0", "Performance optimisations: query limits, getCountFromServer, shared AuthProvider, lazy-loading"],
        ["v0.7.0", "Mobile navigation redesign, responsive layouts, server-side seed API with Firebase Admin SDK"],
        ["v0.8.0", "Vitest test framework setup, 39 tests across 3 layers, GitHub Actions CI integration"],
        ["v0.8.1", "Playwright E2E test suite (12 tests), test user creation script, Playwright configuration"],
        ["v0.9.0", "Transaction data model (9 stages), commission calculator, FICA compliance tracking, transaction CRUD, pipeline board, seed data"],
        ["v0.10.0", "Dashboard transaction KPIs, won-lead-to-transaction flow, command palette updates, 5 new E2E tests"],
        ["v0.11.0", "13 SA real estate features (properties, show days, inbound leads, messaging, sequences, speed-to-lead, buyer match, documents, lead ROI, compliance), 10 new collections, 39 new functions, 58 new E2E tests, Playwright config hardening"],
        ["v0.12.0", "Comparative Market Analysis (CMA) reports with comparable sales management, auto-calculated valuations, confidence levels, KPI cards. New cmaReports collection, 5 CRUD functions, 40 seed records, 9 new E2E tests (84 total). Updated spec document generator."],
        ["v0.13.0", "CMA enhancements: PDF export via @react-pdf/renderer (4-page professional report), auto-fill from existing properties, clone CMA as draft, value range display (statistical ±band), confidence auto-score (count + 6-month recency). New cma-pdf-document.tsx component. Training guide and demo guide documentation."],
        ["v1.0.0", "Customer-centric data model: every entity now links back to a Contact (customer). Added contactId to Property (seller), ShowDayLead (visitor), InboundLead (on acceptance). Added propertyId to ShowDay. 5 new query functions (getTasksByContact, getTransactionsByContact, getPropertiesByContact, getBuyerProfilesByContact, getCmaReportsByContact). Contact pickers on Property, Transaction, ShowDay, and CMA forms. Expanded Contact detail page to show all 9 related entity types. Updated seed data with cross-entity references."],
        ["v1.0.1", "Agent assignment, BulkSMS API, Firebase Storage, inbound webhook with HMAC-SHA256, pipeline UX improvements. 10 new unit tests, 5 new E2E tests (150 total)."],
        ["v1.1.0", "Gemini AI CMA research with Google Search grounding, security hardening (required HMAC auth, Firestore rules schema validation, Zod runtime validation, ErrorBoundary), ESLint 9 flat config, 4 new API test files (22 new tests, 172 total)."],
        ["v1.2.0", "Production hardening sprint: CI pipeline fix (main→master branch), seed endpoint production guard, Next.js middleware for server-side auth, in-memory rate limiting on SMS/CMA/seed APIs, error.tsx + not-found.tsx + loading.tsx pages, rate-limit and seed API tests. 8 new tests (180 total)."],
        ["v1.3.0", "Code quality & observability sprint: fixed 70+ lint errors across 25 files and re-enabled ESLint during builds, added security headers (X-Frame-Options, HSTS, CSP Permissions-Policy, X-Content-Type-Options, Referrer-Policy), sanitized CMA prompt inputs against injection, integrated Sentry error tracking (client + server + global error boundary), wrote comprehensive README.md. 91 unit tests, 89 E2E tests."],
      ]
    ),
    emptyPara(),

    h2("12.3 Infrastructure & Configuration by Copilot"),
    para("Beyond code, Copilot performed the following infrastructure and configuration tasks:"),
    emptyPara(),

    h3("12.3.1 Git & GitHub"),
    bullet("Initialised Git repository and configured remote origin"),
    bullet("Created semantic version tags (v0.1.0 through v1.3.0) at each milestone — 19 annotated tags"),
    bullet("Wrote conventional commit messages with multi-line descriptions"),
    bullet("Pushed code and tags to GitHub after every version"),
    bullet("Configured .gitignore for Node.js/Next.js/Firebase projects"),
    emptyPara(),

    h3("12.3.2 Firebase"),
    bullet("Configured Firestore security rules for all 16 collections (authentication + ownership pattern)"),
    bullet("Deployed security rules via Firebase CLI (firebase-tools)"),
    bullet("Set up Firebase Client SDK initialisation with environment variables"),
    bullet("Set up Firebase Admin SDK for server-side API routes"),
    bullet("Created E2E test users via Firebase Auth REST API"),
    bullet("Configured Firebase App Hosting (apphosting.yaml)"),
    bullet("Configured Firestore composite indexes (firestore.indexes.json)"),
    emptyPara(),

    h3("12.3.3 Testing Infrastructure"),
    bullet("Installed and configured Vitest 4.x with TypeScript path alias support"),
    bullet("Installed and configured Playwright with Chromium for E2E testing"),
    bullet("Created test user accounts in Firebase Auth"),
    bullet("Wrote 91 unit/API tests and 89 E2E tests"),
    bullet("Configured GitHub Actions CI pipeline to block deploys on test failure"),
    emptyPara(),

    h3("12.3.4 Build & Deploy"),
    bullet("Ran npm run build to verify production builds at each version"),
    bullet("Diagnosed and fixed build errors (TypeScript type issues, Suspense boundaries, Lucide icon props)"),
    bullet("Deployed Firestore security rules after collection changes"),
    bullet("Pushed to GitHub to trigger Firebase App Hosting auto-deploy"),
    bullet("Verified deployment health via /api/health endpoint"),
    emptyPara(),

    h3("12.3.5 Documentation"),
    bullet("Created the specification document generator (scripts/generate-spec.mjs)"),
    bullet("Generated .docx specification document at each version milestone"),
    bullet("Maintained 14 sections covering all aspects of the system"),
    bullet("Updated version history with detailed descriptions for each release"),
    emptyPara(),

    h2("12.4 Human vs Copilot Responsibilities"),
    makeTable(
      ["Responsibility", "Human Developer", "GitHub Copilot"],
      [
        ["Requirements & Vision", "✓ Defined features, priorities, and SA real estate domain requirements", ""],
        ["Architecture Decisions", "✓ Approved tech stack and patterns", "✓ Proposed and implemented patterns"],
        ["Code Implementation", "", "✓ Wrote all application code, components, and tests"],
        ["Infrastructure Config", "", "✓ Configured Git, Firebase, CI/CD, Playwright"],
        ["Security Rules", "", "✓ Designed and deployed Firestore security rules"],
        ["Testing", "✓ Directed test strategy", "✓ Wrote and ran all 172 tests"],
        ["Deployment", "✓ Approved releases", "✓ Built, tested, deployed each version"],
        ["Documentation", "✓ Requested spec document", "✓ Created generator and content"],
        ["Code Review", "✓ Reviewed outputs and directed corrections", ""],
        ["Quality Assurance", "✓ Validated live deployment", "✓ Ran E2E tests against production"],
      ]
    ),
    emptyPara(),

    h2("12.5 Tools & Environment"),
    makeTable(
      ["Tool", "Purpose"],
      [
        ["VS Code (Insiders)", "Primary IDE — all development performed within VS Code"],
        ["GitHub Copilot (Claude Opus 4.6)", "AI assistant — code generation, terminal commands, file editing"],
        ["PowerShell", "Terminal — all commands executed via VS Code integrated terminal"],
        ["Windows 11", "Development OS"],
        ["Git", "Version control — commits, tags, push"],
        ["npm", "Package management — dependency installation, script execution"],
        ["Firebase CLI", "firebase-tools — security rules deployment, project management"],
        ["Playwright", "E2E browser testing against live deployment"],
      ]
    ),

    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function sectionVersionHistoryContent() {
  return [
    heading("13. Version History"),

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
        [
          "v0.7.0",
          "April 2026",
          'Mobile Responsiveness & Server-Side Seeder — Rewrote mobile navigation as slide-up drawer with all nav items, user profile, theme toggle, and sign out. Made dashboard cards, detail page headers, pipeline board (horizontal scroll), and reports page fully responsive for small screens. Redesigned data seeder: moved all generation logic to a server-side API route (api/seed) using Firebase Admin SDK with parallel batch writes for maximum speed; seed page now calls the API via fetch with Bearer token authentication.',
        ],
        [
          "v0.8.0",
          "April 2026",
          'Testing & Quality Assurance — Introduced Vitest test framework with 39 automated tests across 3 layers: (1) Unit tests for lead scoring algorithm, pipeline forecasting, score labels, and utility functions; (2) Infrastructure smoke tests validating environment variables, Firebase configuration, Firestore security rules coverage, authentication requirements, and data model exports; (3) Build verification. Added CI integration: tests run in GitHub Actions before every deployment, blocking deploys on failure. Fixed sidebar to respect light/dark theme. Standardised colour-coded pipeline stages.',
        ],
        [
          "v0.8.1",
          "April 2026",
          'Playwright E2E Functional Tests — Added 12 on-demand end-to-end tests using Playwright (Chromium) that validate all application screens against the live deployment: authentication flow, dashboard KPIs, leads/contacts tables and detail pages, pipeline board columns, tasks page, reports page, and health API endpoint. Tests run only when manually triggered (npm run test:e2e), not in CI. Includes test user creation script. Total test count: 51 (39 unit/smoke + 12 E2E).',
        ],
        [
          "v0.9.0",
          "April 2026",
          'Transaction Model & Commission Calculator — Added full Transaction data model with 9 stages (OTP Signed → Commission Paid / Fallen Through) for SA real estate. Commission calculator with VAT (15%), splits, and agent net commission. Transaction forecasting with stage-weighted probability. Firestore CRUD (6 functions), security rules, and 150-record seed data with SA-specific addresses, suburbs, conveyancers, and bond originators. Transaction list page with search and stage filters, detail page with visual stage timeline, commission card, FICA compliance tracking, parties, key dates, and stage history. Transaction Kanban pipeline with drag-and-drop across 9 columns.',
        ],
        [
          "v0.10.0",
          "April 2026",
          'Dashboard Integration & Won-Lead Flow — Integrated transaction KPIs into the dashboard (Active Transactions, Pending Commission, Expected Income, Earned Commission). Added won-lead-to-transaction flow: "Create Transaction" button on won lead detail pages and automatic prompt when dragging a lead to "won" on the pipeline board. Added transactions to command palette navigation and quick actions. Added 5 Playwright E2E tests for transaction pages (list, detail, pipeline, dashboard KPIs). Updated tests to 68 total (51 Vitest + 17 Playwright E2E).',
        ],
        [
          "v0.11.0",
          "April 2026",
          'SA Real Estate Feature Suite — 13 new features for South African estate agents: Property management with mandate types (sole/open/dual/auction), show days with public QR-code lead registration, inbound lead capture from property portals (Property24, Private Property), SMS/messaging hub, automated follow-up sequences with multi-step workflows, speed-to-lead auto-response rules, buyer–property matching engine, document vault per transaction/contact, lead ROI analytics with cost-per-lead metrics, POPIA compliance management with consent tracking and data subject requests. Added 10 new Firestore collections (15 total), 39 new CRUD functions, 4 new components, 12 new page routes (26 total). Expanded E2E tests from 17 to 75 (126 total with unit/smoke). Updated Playwright config: 60s timeout, 30s expect, 1 retry.',
        ],
        [
          "v0.12.0",
          "April 2026",
          'Comparative Market Analysis (CMA) — Added CMA report management for property valuations. Subject property details (address, suburb, type, bedrooms, bathrooms, erf/floor size), comparable sales with sale price, date, distance, and adjustments. Auto-calculated estimated value and price per square metre. Confidence level indicator (Low/Medium/High). Report status workflow (Draft → Final → Presented). 4 KPI cards, search, inline CRUD with slide-over Sheet forms. New cmaReports Firestore collection with 5 CRUD functions, security rules, and 40 seed records (1,604 total across 16 collections). 9 new E2E tests (84 total, 135 combined). Updated specification document generator.',
        ],
        [
          "v0.13.0",
          "April 2026",
          'CMA Enhancements — PDF export via @react-pdf/renderer (4-page professional report), auto-fill from existing properties, clone CMA as draft, value range display (statistical ±band), confidence auto-score (count + 6-month recency). New cma-pdf-document.tsx component. Training guide and demo guide documentation.',
        ],
        [
          "v1.0.0",
          "June 2026",
          'Customer-Centric Data Model (v1.0.0) — Every data entity can now be traced back to a Contact (customer). Added contactId to Property (seller link), ShowDayLead (visitor link), InboundLead (linked on acceptance). Added propertyId to ShowDay (property listing link). 5 new contact-scoped query functions: getTasksByContact, getTransactionsByContact, getPropertiesByContact, getBuyerProfilesByContact, getCmaReportsByContact. Contact picker dropdowns on Property, Transaction, ShowDay, and CMA forms with auto-fill. Expanded Contact detail page to display all 9 related entity types (leads, activities, tasks, transactions, properties, documents, buyer profiles, CMA reports, SMS history). Updated seed data with cross-entity references. 13 of 16 Firestore entities now link to Contact; remaining 3 are config entities (FollowUpSequence, AutoResponseRule) or self-referencing (Contact). This release marks the first major version of Thina CRM.',
        ],
        [
          "v1.0.1",
          "June 2026",
          'Agent Assignment, BulkSMS API, Firebase Storage, Inbound Webhook & Pipeline UX (v1.0.1) — Agent assignment with assignedAgentId/assignedAgentName/assignedAt on Lead and Contact models. BulkSMS gateway API route (api/sms/send) with token authentication. Firebase Storage integration for document uploads. Inbound lead webhook (api/leads/inbound) with HMAC-SHA256 signature verification. Pipeline UX improvements with contact-linked deal flow. 10 new unit tests (commission calculator, transaction forecasting) bringing total to 61. 5 new E2E tests (contact pickers, contact detail sections) bringing total to 89. Combined test count: 150.',
        ],
        [
          "v1.1.0",
          "April 2026",
          'Gemini AI CMA Research & Security Hardening (v1.1.0) — Added Gemini AI-powered CMA research endpoint (api/cma/research) using @google/genai SDK with Google Search grounding tool. Returns structured comparable sales data, market insights, and estimated price ranges for any suburb. "Research with Gemini" button on CMA Reports page auto-populates comparables and market notes. Security hardening: inbound webhook now requires HMAC secret (returns 503 if unconfigured), Firestore rules schema validation for showDayLeads collection, Zod runtime validation (parseDoc helper) for Firestore document reads on leads/contacts/transactions. Added ErrorBoundary component wrapping app layout. ESLint 9 flat config (next/core-web-vitals + typescript rules). 4 new API test files: api-health, api-cma-research, api-inbound, api-sms (22 new tests). GEMINI_API_KEY stored in Cloud Secret Manager. Total: 83 unit + 89 E2E = 172 tests.',
        ],
        [
          "v1.2.0",
          "April 2026",
          'Production Hardening (v1.2.0) — CI pipeline fix: GitHub Actions workflow now triggers on master branch (was incorrectly targeting main). Seed endpoint production guard: /api/seed returns 403 in production unless ALLOW_SEED=true. Next.js middleware (middleware.ts) for server-side auth verification: lightweight cookie-based gate on all protected routes, public paths exempted (/login, /showday/*, /api/health, /api/leads/inbound). In-memory rate limiting on cost-sensitive APIs: SMS (20/min), CMA research (10/min), seed (2/min) with X-RateLimit headers. Root-level error pages: error.tsx, not-found.tsx, loading.tsx. Auth cookie sync in auth-provider.tsx. New rate-limit.ts utility. 8 new tests (rate-limit + seed API). Total: 91 unit + 89 E2E = 180 tests.',
        ],
        [
          "v1.3.0",
          "June 2026",
          'Code Quality & Observability (v1.3.0) — Fixed 70+ lint errors across 25 files and re-enabled ESLint enforcement during builds (removed ignoreDuringBuilds). Added security headers via next.config.js: X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, HSTS with preload, Permissions-Policy denying camera/mic/geolocation. Sanitized CMA prompt inputs: strip HTML/template chars, clamp numeric ranges, limit string lengths to prevent prompt injection. Integrated Sentry error tracking: client-side init via instrumentation-client.ts + sentry.client.config.ts (webpack compat), server-side via src/instrumentation.ts, global-error.tsx boundary with Sentry.captureException. Wrote comprehensive README.md with tech stack, getting started guide, environment variables, project structure. 91 unit tests, 89 E2E tests.',
        ],
        [
          "v1.3.1",
          "April 2026",
          'Auth Fix & Copilot Customisation (v1.3.1) — Fixed critical auth bug where navigating between pages logged the user out. Root cause: race condition where login page navigated before __session cookie was set. Fix: sign-in helpers now set cookie synchronously before returning. Switched onAuthStateChanged to onIdTokenChanged so cookie stays alive on automatic token refresh (~55 min). Conditional Secure flag on cookie (only on HTTPS, fixing localhost dev). Added Copilot project customisation: 6 instruction files (api-routes, auth-patterns, component-patterns, firebase-firestore, nextjs-app-router, sa-real-estate), 3 skills (new-feature, deployment, testing), 1 prompt (new-crud-entity). 91 unit tests, 89 E2E tests.',
        ],
      ]
    ),

    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function sectionAppendix() {
  return [
    heading("14. Appendix"),

    h2("14.1 File Inventory"),
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
    bullet("seed/page.tsx — Data seeder UI"),
    bullet("tasks/page.tsx — Task management"),
    bullet("transactions/page.tsx — Transaction list with search, stage filters, commission tracking"),
    bullet("transactions/[id]/page.tsx — Transaction detail with stage timeline, commission, FICA, parties"),
    bullet("transactions/pipeline/page.tsx — Transaction Kanban board with 9-stage drag-and-drop"),
    bullet("properties/page.tsx — Property listing management with mandate types"),
    bullet("properties/[id]/page.tsx — Property detail"),
    bullet("showdays/page.tsx — Show day event management"),
    bullet("showday/[id]/page.tsx — Public show day registration (QR code)"),
    bullet("inbound/page.tsx — Inbound lead capture from portals"),
    bullet("messaging/page.tsx — SMS/messaging hub"),
    bullet("sequences/page.tsx — Follow-up sequence builder"),
    bullet("speed-to-lead/page.tsx — Auto-response rule management"),
    bullet("buyer-match/page.tsx — Buyer–property matching"),
    bullet("documents/page.tsx — Document vault"),
    bullet("lead-roi/page.tsx — Lead ROI analytics"),
    bullet("compliance/page.tsx — POPIA compliance management"),
    bullet("cma/page.tsx — CMA reports with PDF export, auto-fill, clone, value range, confidence auto-score"),
    bullet("api/health/route.ts — Health check endpoint (GET) — Firestore connectivity check"),
    bullet("api/seed/route.ts — Server-side seed API route (Firebase Admin)"),
    bullet("api/leads/inbound/route.ts — Inbound lead webhook (POST) — receives leads from external portals with HMAC-SHA256 signature verification"),
    bullet("api/sms/send/route.ts — BulkSMS gateway (POST) — sends SMS messages via BulkSMS API with token authentication"),
    bullet("api/cma/research/route.ts — Gemini AI CMA research (POST) — returns comparable sales data with Google Search grounding"),
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
    bullet("transactions-table.tsx — Transactions data table with FICA status"),
    bullet("new-transaction-sheet.tsx — New transaction form with commission preview"),
    bullet("edit-transaction-sheet.tsx — Edit transaction form with stage management"),
    bullet("forecast-chart.tsx — Pipeline and transaction forecast visualisation"),
    bullet("cma-pdf-document.tsx — Professional 4-page CMA PDF report (cover, subject, comparables, feature comparison)"),
    bullet("error-boundary.tsx — React error boundary with retry UI"),
    emptyPara(),

    h3("Error Handling (src/app/)"),
    bullet("error.tsx — Root error boundary with Sentry reporting"),
    bullet("global-error.tsx — Global error boundary with Sentry.captureException"),
    bullet("not-found.tsx — Custom 404 page"),
    bullet("loading.tsx — Loading skeleton"),
    emptyPara(),

    h3("Instrumentation (root)"),
    bullet("instrumentation-client.ts — Sentry client-side init (Turbopack-compatible) with onRouterTransitionStart"),
    bullet("sentry.client.config.ts — Sentry client-side init (webpack compatibility)"),
    bullet("src/instrumentation.ts — Sentry server/edge init via Next.js instrumentation API"),
    emptyPara(),

    h3("UI Primitives (src/components/ui/)"),
    bullet("avatar.tsx, badge.tsx, button.tsx, card.tsx, input.tsx"),
    bullet("label.tsx, select.tsx, separator.tsx, sheet.tsx, table.tsx"),
    emptyPara(),

    h3("Library (src/lib/)"),
    bullet("firebase.ts — Client Firebase initialisation"),
    bullet("firebase-admin.ts — Server Firebase Admin initialisation"),
    bullet("firestore.ts — All CRUD operations and batch utilities"),
    bullet("scoring.ts — Lead scoring algorithm, pipeline forecasting, commission calculator, transaction forecasting"),
    bullet("schemas.ts — Zod runtime validation schemas (Lead, Contact, Transaction, Property, InboundLead, PopiaConsent) with parseDoc helper"),
    bullet("utils.ts — cn() class name merge utility"),
    bullet("hooks/use-auth.ts — Authentication React hook"),
    emptyPara(),

    h3("Tests (src/lib/__tests__/)"),
    bullet("scoring.test.ts — Lead scoring, score labels, pipeline forecasting, commission calculator, transaction forecasting tests (43 tests)"),
    bullet("utils.test.ts — cn() class merge utility tests (6 tests)"),
    bullet("smoke.test.ts — Infrastructure, config, security rules, data model smoke tests (12 tests)"),
    bullet("api-health.test.ts — Health API endpoint tests (2 tests)"),
    bullet("api-cma-research.test.ts — Gemini CMA research API tests (5 tests)"),
    bullet("api-inbound.test.ts — Inbound webhook API tests (8 tests)"),
    bullet("api-sms.test.ts — SMS gateway API tests (7 tests)"),
    emptyPara(),

    h3("E2E Tests (e2e/)"),
    bullet("app.spec.ts — Functional E2E tests: 29 test groups covering auth, dashboard, leads, contacts, pipeline, tasks, reports, transactions, properties, show days, inbound leads, messaging, sequences, speed-to-lead, buyer match, documents, lead ROI, compliance, sidebar navigation, command palette, responsive/mobile, page load performance, accessibility, empty states, contact pickers, contact detail sections (89 tests)"),
    emptyPara(),

    h2("14.2 Configuration Files"),
    bullet("package.json — Project metadata, dependencies, scripts"),
    bullet("tsconfig.json — TypeScript compiler options (strict, bundler resolution)"),
    bullet("tailwind.config.js — Tailwind theme extensions, colours, animations"),
    bullet("next.config.js — Next.js configuration (image remote patterns, security headers, Sentry integration)"),
    bullet("postcss.config.mjs — PostCSS plugins (Tailwind, Autoprefixer)"),
    bullet("eslint.config.mjs — ESLint 9 flat config (next/core-web-vitals + typescript)"),
    bullet("apphosting.yaml — Firebase App Hosting deployment config (includes GEMINI_API_KEY secret)"),
    bullet("firebase.json — Firebase project services configuration"),
    bullet("firestore.rules — Firestore security rules"),
    bullet("firestore.indexes.json — Firestore composite indexes"),
    bullet("README.md — Project documentation (tech stack, setup, testing, deployment)"),
    emptyPara(),

    h2("14.3 npm Scripts"),
    makeTable(
      ["Script", "Command", "Description"],
      [
        ["dev", "next dev", "Start development server with hot reload"],
        ["build", "next build", "Production build with TypeScript checking"],
        ["start", "next start", "Start production server"],
        ["lint", "next lint", "Run ESLint checks"],
        ["test", "vitest run", "Run all tests once"],
        ["test:watch", "vitest", "Run tests in watch mode during development"],
        ["test:ci", "vitest run --reporter=verbose", "Run tests with verbose output for CI"],
        ["test:deploy", "node scripts/test-deploy.mjs", "Post-deploy smoke test against live URL"],
        ["test:e2e", "npx playwright test", "On-demand E2E functional tests (requires E2E_EMAIL/E2E_PASSWORD)"],
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
          ...sectionVersionHistoryContent(),
          ...sectionAppendix(),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = resolve(ROOT, "docs", "System Specification", `Thina_CRM_System_Specification_v${VERSION}.docx`);

  // Ensure docs/System Specification/ directory exists
  const { mkdirSync } = await import("fs");
  mkdirSync(resolve(ROOT, "docs", "System Specification"), { recursive: true });

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
