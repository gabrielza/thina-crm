import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock firebase-admin before importing route
vi.mock("@/lib/firebase-admin", () => {
  const mockCollection = vi.fn(() => ({
    doc: vi.fn(() => ({ delete: vi.fn() })),
    listDocuments: vi.fn(async () => []),
    limit: vi.fn(() => ({
      get: vi.fn(async () => ({ docs: [], size: 0 })),
    })),
  }));
  return {
    adminAuth: { verifyIdToken: vi.fn() },
    adminDb: {
      collection: mockCollection,
      batch: vi.fn(() => ({
        delete: vi.fn(),
        commit: vi.fn(async () => {}),
      })),
    },
  };
});

vi.mock("@/lib/rate-limit", () => ({
  seedLimiter: {
    check: vi.fn(() => ({ allowed: true, remaining: 1, resetAt: Date.now() + 60_000 })),
    headers: vi.fn(() => ({})),
  },
}));

import { POST } from "@/app/api/seed/route";
import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

const mockVerifyIdToken = vi.mocked(adminAuth.verifyIdToken);

function makeRequest(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/seed", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...headers },
  });
}

describe("POST /api/seed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns 403 in production when ALLOW_SEED is not set", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const req = makeRequest(
      { action: "seed" },
      { Authorization: "Bearer valid-token" }
    );
    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("disabled in production");
  });

  it("returns 401 without auth header", async () => {
    vi.stubEnv("NODE_ENV", "development");

    const req = makeRequest({ action: "seed" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("allows seed in development with valid auth", async () => {
    vi.stubEnv("NODE_ENV", "development");
    mockVerifyIdToken.mockResolvedValueOnce({ uid: "user-1" });

    const req = makeRequest(
      { action: "clear" },
      { Authorization: "Bearer valid-token" }
    );
    const res = await POST(req);
    // Should succeed (clear returns cleared count)
    expect(res.status).toBe(200);
  });
});
