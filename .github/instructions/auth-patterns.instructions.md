---
description: "Use when working with authentication, login, logout, session cookies, middleware auth gates, AuthProvider, or the useAuth hook."
applyTo: ["src/components/auth-provider.tsx", "src/components/auth-guard.tsx", "src/middleware.ts", "src/app/login/**"]
---
# Authentication Patterns

## Auth Stack
1. **Firebase Auth** — Google sign-in + email/password
2. **AuthProvider** (`src/components/auth-provider.tsx`) — React context with user state
3. **`__session` cookie** — Lightweight token synced on auth state change for middleware
4. **Edge Middleware** (`src/middleware.ts`) — First-pass gate checking cookie presence
5. **API routes** — Full token verification via `adminAuth.verifyIdToken()`

## AuthProvider
- Wraps entire app in root layout
- Exposes: `user`, `loading`, `signInWithGoogle()`, `signInWithEmail()`, `signUpWithEmail()`, `signOut()`
- On auth state change: sets `__session` cookie with ID token (1-hour max-age)
- On sign-out: clears `__session` cookie

## useAuth Hook
```typescript
import { useAuth } from "@/lib/hooks/use-auth";
const { user, loading, signOut } = useAuth();
```
- `user` is Firebase `User` object or `null`
- `user.uid` is used as `ownerId` for all Firestore writes

## Middleware Auth Gate
- Public paths skip auth: `/login`, `/showday/*`, `/api/health`, `/api/leads/inbound`
- API routes: check `Authorization: Bearer <token>` header
- Page routes: check `__session` cookie existence → redirect to `/login` if missing
- This is a first-pass gate — not full token verification

## Common Auth Patterns
```typescript
// In page components — guard against unauthenticated access
const { user } = useAuth();
if (!user) { router.push("/login"); return null; }

// In CRUD calls — always pass ownerId
await addLead({ ...formData, ownerId: user.uid });

// In API routes — verify token
const decoded = await adminAuth.verifyIdToken(token);
```
