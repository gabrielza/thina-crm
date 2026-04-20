import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── Next.js Edge Middleware ─────────────────────────────
// Lightweight auth check: ensures a Firebase session cookie or
// auth-related localStorage flag exists before allowing access
// to protected pages. This is a first-pass gate — full token
// verification still happens in API routes via firebase-admin.
//
// Public routes that skip this check:
//   /login           — auth page
//   /showday/*       — public QR code registration
//   /api/health      — monitoring endpoint
//   /api/leads/inbound — webhook (uses HMAC auth)
//   /_next/*         — Next.js internals
//   /favicon.ico     — static assets

const PUBLIC_PATHS = [
  "/login",
  "/showday",
  "/api/health",
  "/api/leads/inbound",
];

function isPublicPath(pathname: string): boolean {
  // Static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return true;
  }

  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths through
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // For API routes, check for Authorization header
  if (pathname.startsWith("/api/")) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Token is present — let the route handler verify it
    return NextResponse.next();
  }

  // For page routes, check for the Firebase auth session cookie
  // Firebase client SDK stores auth state in IndexedDB, which isn't
  // accessible in Edge middleware. Instead, we check for a lightweight
  // cookie that the auth-provider sets on login.
  // If no cookie, redirect to login.
  const authCookie = request.cookies.get("__session");
  if (!authCookie?.value) {
    // Don't redirect API calls — just block. For pages, redirect to login.
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
