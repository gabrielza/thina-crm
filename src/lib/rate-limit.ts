// ─── In-Memory Rate Limiter ──────────────────────────────
// Simple sliding-window rate limiter using a Map.
// Suitable for single-instance deployments (Firebase App Hosting).
//
// Usage:
//   const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });
//   const result = limiter.check(userId);
//   if (!result.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

interface RateLimiterOptions {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests per window */
  max: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function createRateLimiter({ windowMs, max }: RateLimiterOptions) {
  const store = new Map<string, RateLimitEntry>();

  // Periodic cleanup to prevent memory leaks
  const CLEANUP_INTERVAL = Math.max(windowMs * 2, 60_000);
  let lastCleanup = Date.now();

  function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) store.delete(key);
    }
  }

  return {
    check(key: string): RateLimitResult {
      cleanup();
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now >= entry.resetAt) {
        // New window
        store.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
      }

      entry.count++;
      if (entry.count > max) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
      }

      return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt };
    },

    /** Add rate limit headers to a Response */
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
export const smsLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });

/** CMA Research: 10 requests per minute per user (Gemini API cost) */
export const cmaLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

/** Seed: 2 requests per minute per user */
export const seedLimiter = createRateLimiter({ windowMs: 60_000, max: 2 });
