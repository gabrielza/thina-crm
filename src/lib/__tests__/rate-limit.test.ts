import { describe, it, expect } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  it("allows requests within the limit", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 3 });
    const r1 = limiter.check("user-1");
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = limiter.check("user-1");
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = limiter.check("user-1");
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests exceeding the limit", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 2 });
    limiter.check("user-1");
    limiter.check("user-1");

    const r3 = limiter.check("user-1");
    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it("tracks users independently", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
    const r1 = limiter.check("user-a");
    expect(r1.allowed).toBe(true);

    const r2 = limiter.check("user-b");
    expect(r2.allowed).toBe(true);

    const r3 = limiter.check("user-a");
    expect(r3.allowed).toBe(false);
  });

  it("resets after window expires", () => {
    const limiter = createRateLimiter({ windowMs: 50, max: 1 });
    limiter.check("user-1");

    const blocked = limiter.check("user-1");
    expect(blocked.allowed).toBe(false);

    // Wait for window to expire
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const r = limiter.check("user-1");
        expect(r.allowed).toBe(true);
        expect(r.remaining).toBe(0);
        resolve();
      }, 60);
    });
  });

  it("returns correct rate limit headers", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 5 });
    const result = limiter.check("user-1");
    const headers = limiter.headers(result);

    expect(headers["X-RateLimit-Limit"]).toBe("5");
    expect(headers["X-RateLimit-Remaining"]).toBe("4");
    expect(headers["X-RateLimit-Reset"]).toBeDefined();
  });
});
