import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "crypto";

// ─── Mock firebase-admin ────────────────────────────────

const mockCountGet = vi.fn();
const mockCount = vi.fn().mockReturnValue({ get: mockCountGet });
const mockGet = vi.fn();
const mockLimit = vi.fn().mockReturnValue({ get: mockGet });
const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
const mockWhere2 = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
const mockAdd = vi.fn();

// Build a chainable mock that supports .where().where().orderBy().limit().get() and .where().count().get()
const mockWhere = vi.fn().mockReturnValue({
  where: mockWhere2,
  count: mockCount,
});

const mockCollection = vi.fn().mockReturnValue({
  add: mockAdd,
  where: mockWhere,
  count: mockCount,
});

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: { collection: (name: string) => mockCollection(name) },
  adminAuth: {},
}));

vi.mock("@/lib/rate-limit", () => ({
  inboundLimiter: {
    check: vi.fn(async () => ({ allowed: true, remaining: 59, resetAt: Date.now() + 60_000 })),
    headers: vi.fn(() => ({})),
  },
}));

// ─── Import after mocks ─────────────────────────────────

import { POST, GET } from "@/app/api/leads/inbound/route";
import { NextRequest } from "next/server";

const WEBHOOK_SECRET = "test-secret-key-12345";

function makeSignature(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

function makeRequest(
  body: Record<string, unknown>,
  options: { signature?: string; secret?: string } = {}
) {
  const rawBody = JSON.stringify(body);
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (options.signature !== undefined) {
    headers["X-Webhook-Signature"] = options.signature;
  } else if (options.secret) {
    headers["X-Webhook-Signature"] = makeSignature(rawBody, options.secret);
  }

  return new NextRequest("http://localhost/api/leads/inbound", {
    method: "POST",
    body: rawBody,
    headers,
  });
}

// ─── Tests ───────────────────────────────────────────────

describe("POST /api/leads/inbound", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns 503 when INBOUND_WEBHOOK_SECRET is not configured", async () => {
    delete process.env.INBOUND_WEBHOOK_SECRET;

    const req = makeRequest(
      { source: "property24", content: "Name: John\nEmail: john@test.com" }
    );
    const res = await POST(req);
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toContain("not configured");
  });

  it("returns 401 when signature is missing", async () => {
    vi.stubEnv("INBOUND_WEBHOOK_SECRET", WEBHOOK_SECRET);

    const req = makeRequest(
      { source: "property24", content: "Name: John" },
      { signature: "" }
    );
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when signature is invalid", async () => {
    vi.stubEnv("INBOUND_WEBHOOK_SECRET", WEBHOOK_SECRET);

    const req = makeRequest(
      { source: "property24", content: "Name: John" },
      { signature: "deadbeef0000111122223333444455556666777788889999aaaabbbbccccdddde" }
    );
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when content is empty", async () => {
    vi.stubEnv("INBOUND_WEBHOOK_SECRET", WEBHOOK_SECRET);
    vi.stubEnv("INBOUND_DEFAULT_OWNER_ID", "owner-1");

    const body = { source: "property24", content: "" };
    const req = makeRequest(body, { secret: WEBHOOK_SECRET });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Content is required");
  });

  it("returns 400 when ownerId and default are missing", async () => {
    vi.stubEnv("INBOUND_WEBHOOK_SECRET", WEBHOOK_SECRET);
    delete process.env.INBOUND_DEFAULT_OWNER_ID;

    const body = { source: "property24", content: "Name: John\nEmail: john@test.com" };
    const req = makeRequest(body, { secret: WEBHOOK_SECRET });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("ownerId");
  });

  it("returns 400 for invalid source", async () => {
    vi.stubEnv("INBOUND_WEBHOOK_SECRET", WEBHOOK_SECRET);
    vi.stubEnv("INBOUND_DEFAULT_OWNER_ID", "owner-1");

    const body = { source: "invalid-portal", content: "Name: John" };
    const req = makeRequest(body, { secret: WEBHOOK_SECRET });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Invalid source");
  });

  it("creates a lead with valid HMAC signature and returns 201", async () => {
    vi.stubEnv("INBOUND_WEBHOOK_SECRET", WEBHOOK_SECRET);
    vi.stubEnv("INBOUND_DEFAULT_OWNER_ID", "owner-1");

    // Mock: no duplicates found
    mockGet.mockResolvedValueOnce({ empty: true });
    // Mock: lead created
    mockAdd.mockResolvedValueOnce({ id: "inbound-123" });

    const body = {
      source: "property24",
      content: "Name: Jane Smith\nEmail: jane@test.com\nPhone: 0821234567",
    };
    const req = makeRequest(body, { secret: WEBHOOK_SECRET });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.status).toBe("created");
    expect(json.id).toBe("inbound-123");
    expect(json.parsed.name).toBe("Jane Smith");
    expect(json.parsed.email).toBe("jane@test.com");
  });
});

describe("GET /api/leads/inbound", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns pending count", async () => {
    mockCountGet.mockResolvedValueOnce({ data: () => ({ count: 5 }) });

    const res = await GET();
    const json = await res.json();
    expect(json.pendingCount).toBe(5);
    expect(json.timestamp).toBeDefined();
  });
});
