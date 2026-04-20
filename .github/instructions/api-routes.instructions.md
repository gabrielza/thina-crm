---
description: "Use when creating or editing API routes in src/app/api/. Covers firebase-admin usage, token verification, rate limiting, HMAC auth, and response patterns."
applyTo: "src/app/api/**"
---
# API Route Patterns

## Server-Side Only
- API routes run on the server — use `firebase-admin` (never the client SDK)
- Import: `import { adminDb, adminAuth } from "@/lib/firebase-admin"`

## Auth Verification
```typescript
import { adminAuth } from "@/lib/firebase-admin";

// Extract and verify Bearer token
const authHeader = request.headers.get("Authorization");
if (!authHeader?.startsWith("Bearer ")) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
const token = authHeader.split("Bearer ")[1];
const decoded = await adminAuth.verifyIdToken(token);
const userId = decoded.uid;
```

## Rate Limiting
```typescript
import { createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });
const result = limiter.check(userId);
if (!result.allowed) {
  return NextResponse.json({ error: "Too many requests" }, { status: 429 });
}
// Include rate limit headers in response
headers.set("X-RateLimit-Remaining", String(result.remaining));
```

## Webhook Auth (HMAC-SHA256)
For external webhook endpoints (e.g., `/api/leads/inbound`):
```typescript
import { createHmac } from "crypto";
const signature = request.headers.get("x-webhook-signature");
const expectedSig = createHmac("sha256", process.env.WEBHOOK_SECRET!)
  .update(rawBody).digest("hex");
if (signature !== expectedSig) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
```

## Response Pattern
- Always return `NextResponse.json()`
- Include meaningful error messages
- Use proper HTTP status codes: 200 (ok), 201 (created), 400 (bad input), 401 (unauth), 403 (forbidden), 429 (rate limit), 500 (server error)

## Environment Variables
- `FIREBASE_SERVICE_ACCOUNT` — JSON string for admin SDK
- `WEBHOOK_SECRET` — HMAC key for inbound webhooks
- `GEMINI_API_KEY` — Google AI API key (Cloud Secret Manager in prod)
- `BULKSMS_TOKEN_ID` / `BULKSMS_TOKEN_SECRET` — BulkSMS API credentials
