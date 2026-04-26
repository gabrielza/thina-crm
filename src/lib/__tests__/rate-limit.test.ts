import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock firebase-admin BEFORE importing rate-limit
vi.mock("@/lib/firebase-admin", () => {
  const runTransaction = vi.fn();
  const doc = vi.fn(() => ({}));
  const collection = vi.fn(() => ({ doc }));
  return {
    adminDb: { collection, runTransaction },
  };
});

import { createRateLimiter } from "@/lib/rate-limit";
import { adminDb } from "@/lib/firebase-admin";

const mockedRunTransaction = vi.mocked(
  (adminDb as unknown as { runTransaction: ReturnType<typeof vi.fn> }).runTransaction
);

/**
 * Build a fake transaction that simulates a Firestore counter doc backed by
 * the supplied mutable `state` object. Each call to runTransaction advances
 * `state.count` if the limit hasn't been hit yet.
 */
function mockFirestoreCounter() {
  const state = { count: 0 };
  mockedRunTransaction.mockImplementation(async (handler) => {
    const tx = {
      get: vi.fn(async () => ({
        exists: state.count > 0,
        data: () => ({ count: state.count }),
      })),
      set: vi.fn((_ref: unknown, data: { count: number }) => {
        state.count = data.count;
      }),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return handler(tx as any);
  });
  return state;
}

describe("createRateLimiter (Firestore-backed)", () => {
  beforeEach(() => {
    mockedRunTransaction.mockReset();
  });

  it("allows requests within the limit", async () => {
    mockFirestoreCounter();
    const limiter = createRateLimiter({ bucket: "test", windowMs: 60_000, max: 3 });

    const r1 = await limiter.check("user-1");
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = await limiter.check("user-1");
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = await limiter.check("user-1");
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests exceeding the limit", async () => {
    mockFirestoreCounter();
    const limiter = createRateLimiter({ bucket: "test", windowMs: 60_000, max: 2 });

    await limiter.check("user-1");
    await limiter.check("user-1");

    const blocked = await limiter.check("user-1");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("returns standard rate-limit headers", async () => {
    mockFirestoreCounter();
    const limiter = createRateLimiter({ bucket: "test", windowMs: 60_000, max: 5 });

    const result = await limiter.check("user-1");
    const headers = limiter.headers(result);

    expect(headers["X-RateLimit-Limit"]).toBe("5");
    expect(headers["X-RateLimit-Remaining"]).toBe("4");
    expect(headers["X-RateLimit-Reset"]).toBeDefined();
  });

  it("fails open if Firestore throws", async () => {
    mockedRunTransaction.mockRejectedValueOnce(new Error("firestore unavailable"));
    const limiter = createRateLimiter({ bucket: "test", windowMs: 60_000, max: 3 });

    const result = await limiter.check("user-1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(3);
  });

  it("uses bucket + key + windowStart in the document id", async () => {
    mockFirestoreCounter();
    const collectionFn = (adminDb as unknown as { collection: ReturnType<typeof vi.fn> }).collection;
    collectionFn.mockClear();
    const limiter = createRateLimiter({ bucket: "sms", windowMs: 60_000, max: 1 });

    await limiter.check("user-xyz");

    expect(collectionFn).toHaveBeenCalledWith("rateLimits");
    const docFn = collectionFn.mock.results.at(-1)!.value.doc as ReturnType<typeof vi.fn>;
    const docId = docFn.mock.calls.at(-1)![0] as string;
    expect(docId).toMatch(/^sms:user-xyz:\d+$/);
  });
});
