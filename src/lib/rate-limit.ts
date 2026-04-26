// ─── Firestore-backed Fixed-Window Rate Limiter ──────────
// Replaces the previous in-memory limiter so counts survive
// across multiple Firebase App Hosting instances.
//
// Storage layout:
//   Collection: rateLimits
//   Document ID: `${bucket}:${key}:${windowStart}`
//   Fields: { count, bucket, key, windowStart, expiresAt }
//
// A Firestore TTL policy on `expiresAt` should be enabled so
// expired window documents are auto-deleted.
//
// Usage:
//   const limiter = createRateLimiter({ bucket: "sms", windowMs: 60_000, max: 20 });
//   const result = await limiter.check(userId);
//   if (!result.allowed) return NextResponse.json({ error: "Too many requests" },
//     { status: 429, headers: limiter.headers(result) });

import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

interface RateLimiterOptions {
  /** Bucket name that namespaces the limiter (e.g. "sms", "cma"). */
  bucket: string;
  /** Time window in milliseconds. */
  windowMs: number;
  /** Maximum requests per window per key. */
  max: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const COLLECTION = "rateLimits";
/** Extra grace beyond the window before TTL deletes the doc. */
const TTL_GRACE_MS = 60_000;

export function createRateLimiter({ bucket, windowMs, max }: RateLimiterOptions) {
  return {
    /**
     * Atomically increment the counter for `key` in the current window
     * and return whether the request is allowed.
     */
    async check(key: string): Promise<RateLimitResult> {
      const now = Date.now();
      const windowStart = Math.floor(now / windowMs) * windowMs;
      const resetAt = windowStart + windowMs;
      const docId = `${bucket}:${key}:${windowStart}`;

      try {
        const ref = adminDb.collection(COLLECTION).doc(docId);
        const outcome = await adminDb.runTransaction(async (tx) => {
          const snap = await tx.get(ref);
          const current = (snap.exists ? (snap.data()?.count as number | undefined) : 0) ?? 0;

          if (current >= max) {
            return { allowed: false, count: current };
          }

          const next = current + 1;
          tx.set(ref, {
            count: next,
            bucket,
            key,
            windowStart,
            expiresAt: Timestamp.fromMillis(resetAt + TTL_GRACE_MS),
          });
          return { allowed: true, count: next };
        });

        return {
          allowed: outcome.allowed,
          remaining: Math.max(0, max - outcome.count),
          resetAt,
        };
      } catch (err) {
        // Fail open on Firestore failures — better to serve traffic than to
        // hard-block every request if the rate-limit store is unavailable.
        console.error(`[rate-limit] Firestore failure for ${docId}:`, err);
        return { allowed: true, remaining: max, resetAt };
      }
    },

    /** Standard rate-limit headers to attach to a 429 response. */
    headers(result: RateLimitResult): Record<string, string> {
      return {
        "X-RateLimit-Limit": String(max),
        "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      };
    },
  };
}

// ─── Pre-configured limiters ─────────────────────────────

/** SMS: 20 messages per minute per user */
export const smsLimiter = createRateLimiter({ bucket: "sms", windowMs: 60_000, max: 20 });

/** CMA Research: 10 requests per minute per user (Gemini API cost) */
export const cmaLimiter = createRateLimiter({ bucket: "cma", windowMs: 60_000, max: 10 });

/** Seed: 2 requests per minute per user */
export const seedLimiter = createRateLimiter({ bucket: "seed", windowMs: 60_000, max: 2 });

/** Inbound webhook: 60 requests per minute per source (host or webhook-source label) */
export const inboundLimiter = createRateLimiter({ bucket: "inbound", windowMs: 60_000, max: 60 });

/** Google Places lookup: 30 requests per minute per user (controls Place Details billing) */
export const placesLimiter = createRateLimiter({ bucket: "places", windowMs: 60_000, max: 30 });
