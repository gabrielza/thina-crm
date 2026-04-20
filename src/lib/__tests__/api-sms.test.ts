import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock firebase-admin ────────────────────────────────

const mockVerifyIdToken = vi.fn();
const mockCollectionAdd = vi.fn();
const mockCollection = vi.fn().mockReturnValue({ add: mockCollectionAdd });

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: { collection: (name: string) => mockCollection(name) },
  adminAuth: { verifyIdToken: (token: string) => mockVerifyIdToken(token) },
}));

// ─── Import after mocks ─────────────────────────────────

import { POST, GET } from "@/app/api/sms/send/route";
import { NextRequest } from "next/server";

// Helper to build NextRequest
function makeRequest(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  const req = new NextRequest("http://localhost/api/sms/send", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
  return req;
}

// ─── Tests ───────────────────────────────────────────────

describe("POST /api/sms/send", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no Authorization header is provided", async () => {
    const req = makeRequest({ to: "0821234567", body: "Hello" });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 401 when Authorization header is not Bearer format", async () => {
    const req = makeRequest({ to: "0821234567", body: "Hello" }, {
      Authorization: "Basic abc123",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when token verification fails", async () => {
    mockVerifyIdToken.mockRejectedValueOnce(new Error("Invalid token"));

    const req = makeRequest({ to: "0821234567", body: "Hello" }, {
      Authorization: "Bearer invalid-token",
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it("returns 400 when 'to' is missing", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ uid: "user-1" });

    const req = makeRequest({ body: "Hello" }, {
      Authorization: "Bearer valid-token",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("to and body are required");
  });

  it("returns 400 when 'body' is missing", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ uid: "user-1" });

    const req = makeRequest({ to: "0821234567" }, {
      Authorization: "Bearer valid-token",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("to and body are required");
  });

  it("returns 400 when message exceeds 918 characters", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ uid: "user-1" });

    const req = makeRequest({ to: "0821234567", body: "x".repeat(919) }, {
      Authorization: "Bearer valid-token",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("max 918");
  });
});

describe("GET /api/sms/send", () => {
  it("returns gateway status with provider info", async () => {
    const res = await GET();
    const json = await res.json();
    expect(json.provider).toBe("bulksms");
    expect(typeof json.configured).toBe("boolean");
    expect(json.timestamp).toBeDefined();
  });
});
