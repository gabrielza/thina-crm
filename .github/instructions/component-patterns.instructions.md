---
description: "Use when creating or editing React components, UI primitives, forms, sheets, tables, or working with shadcn/ui, Radix UI, Tailwind CSS, or Lucide icons."
applyTo: "src/components/**"
---
# Component & UI Patterns

## shadcn/ui
- Primitive components live in `src/components/ui/` (Button, Card, Badge, Dialog, etc.)
- Built on Radix UI + Tailwind CSS + class-variance-authority (CVA)
- Use `cn()` from `@/lib/utils` for conditional class merging (clsx + tailwind-merge)

## Component Naming
- Feature components: `PascalCase` matching filename (e.g., `leads-table.tsx` → `LeadsTable`)
- UI primitives: `src/components/ui/` — lowercase kebab-case filenames
- Sheets (slide-over panels): `new-*-sheet.tsx`, `edit-*-sheet.tsx`

## Page Layout
Every page follows this structure:
```tsx
"use client";
import { AppShell } from "@/components/app-shell";

export default function PageName() {
  const { user } = useAuth();
  // ... state + data fetching in useEffect
  return (
    <AppShell>
      {/* Page content */}
    </AppShell>
  );
}
```

## Data Tables
- Use custom table components (e.g., `LeadsTable`, `ContactsTable`, `TransactionsTable`)
- Pattern: receive data as props, handle sorting/filtering internally
- Status columns use `<Badge variant={...}>` with color mapping objects

## Forms & Sheets
- New entity: `new-*-sheet.tsx` — slide-over panel with form
- Edit entity: `edit-*-sheet.tsx` — pre-populated form
- Use controlled inputs with `useState`
- On submit: call CRUD function from `@/lib/firestore.ts`, then refresh parent data

## Icons
- Use Lucide React icons: `import { IconName } from "lucide-react"`
- Common: Phone, Mail, Calendar, StickyNote, TrendingUp, DollarSign, AlertTriangle, CheckSquare

## Theming
- ThemeProvider wraps the app — supports light/dark mode
- Use Tailwind `dark:` prefix for dark mode styles
- Color tokens defined in `globals.css` via CSS custom properties
