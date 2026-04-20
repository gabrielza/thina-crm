---
description: "Use when creating or editing Next.js pages, layouts, or route segments. Covers App Router conventions, client components, dynamic imports, and page patterns."
applyTo: "src/app/**/*.tsx"
---
# Next.js App Router Conventions

## Pages
- Every page uses `"use client"` directive — no server components for data fetching
- Pages wrap content in `<AppShell>` for sidebar/nav layout
- Use `useAuth()` hook from `@/lib/hooks/use-auth` for current user
- Use `useRouter()` from `next/navigation` for programmatic navigation
- Loading state: `useState(true)` → fetch in `useEffect` → `setLoading(false)`

## Dynamic Imports
- Use `next/dynamic` for heavy components (charts, PDF renderers)
- Always provide a loading fallback: `loading: () => <Spinner />`
- Set `ssr: false` for browser-only components (Recharts, @react-pdf/renderer)

## Route Structure
```
src/app/
  page.tsx              — Dashboard (/)
  login/page.tsx        — Auth page
  leads/page.tsx        — Lead list
  leads/[id]/page.tsx   — Lead detail
  contacts/page.tsx     — Contact list
  properties/page.tsx   — Property listings
  transactions/page.tsx — Transaction pipeline
  api/                  — Server-side API routes
```

## Layout
- Root layout (`app/layout.tsx`): ThemeProvider → ErrorBoundary → AuthProvider
- No nested layouts — each page handles its own structure via AppShell

## Path Alias
- `@/` maps to `src/` — always use this for imports
