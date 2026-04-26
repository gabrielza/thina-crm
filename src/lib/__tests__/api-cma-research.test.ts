import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock firebase-admin ────────────────────────────────

const mockVerifyIdToken = vi.fn();

vi.mock("@/lib/firebase-admin", () => ({
  adminAuth: { verifyIdToken: (token: string) => mockVerifyIdToken(token) },
  adminDb: {},
}));

vi.mock("@/lib/rate-limit", () => ({
  cmaLimiter: {
    check: vi.fn(async () => ({ allowed: true, remaining: 9, resetAt: Date.now() + 60_000 })),
    headers: vi.fn(() => ({})),
  },
}));

// ─── Mock @google/genai ─────────────────────────────────

const mockGenerateContent = vi.fn();

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: class {
      models = { generateContent: (opts: unknown) => mockGenerateContent(opts) };
    },
    Type: {
      OBJECT: "OBJECT",
      ARRAY: "ARRAY",
      STRING: "STRING",
      NUMBER: "NUMBER",
    },
  };
});

// ─── Import after mocks ─────────────────────────────────

import { POST } from "@/app/api/cma/research/route";
import { NextRequest } from "next/server";

function makeRequest(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/cma/research", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

// ─── Tests ───────────────────────────────────────────────

describe("POST /api/cma/research", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns 401 when no Authorization header is provided", async () => {
    const req = makeRequest({ suburb: "Sandton", city: "Johannesburg" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 503 when GEMINI_API_KEY is not configured", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ uid: "user-1" });
    delete process.env.GEMINI_API_KEY;

    const req = makeRequest(
      { suburb: "Sandton", city: "Johannesburg" },
      { Authorization: "Bearer valid-token" }
    );
    const res = await POST(req);
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toContain("Gemini API key");
  });

  it("returns 400 when suburb or city is missing", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ uid: "user-1" });
    vi.stubEnv("GEMINI_API_KEY", "test-key");

    const req = makeRequest(
      { suburb: "", city: "" },
      { Authorization: "Bearer valid-token" }
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("suburb and city are required");
  });

  it("returns comparable data from Gemini on success", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ uid: "user-1" });
    vi.stubEnv("GEMINI_API_KEY", "test-key");

    const mockResponse = {
      comparables: [
        {
          address: "10 Rivonia Road",
          suburb: "Sandton",
          salePrice: 3500000,
          saleDate: "2026-02-15",
          bedrooms: 3,
          bathrooms: 2,
          erfSize: 800,
          floorSize: 250,
          propertyType: "house",
          daysOnMarket: 45,
          notes: "Recently renovated",
        },
      ],
      marketInsights: "Sandton remains a sought-after suburb with strong demand.",
      estimatedPriceRange: { low: 3000000, high: 4000000 },
    };

    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(mockResponse),
      candidates: [{ groundingMetadata: {} }],
    });

    const req = makeRequest(
      { suburb: "Sandton", city: "Johannesburg", propertyType: "house", bedrooms: 3, bathrooms: 2 },
      { Authorization: "Bearer valid-token" }
    );
    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.comparables).toHaveLength(1);
    expect(json.comparables[0].address).toBe("10 Rivonia Road");
    expect(json.comparables[0].salePrice).toBe(3500000);
    expect(json.marketInsights).toContain("Sandton");
    expect(json.estimatedPriceRange.low).toBe(3000000);
    expect(json.estimatedPriceRange.high).toBe(4000000);
  });

  it("returns 502 when Gemini returns no content", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ uid: "user-1" });
    vi.stubEnv("GEMINI_API_KEY", "test-key");

    mockGenerateContent.mockResolvedValueOnce({
      text: null,
      candidates: [],
    });

    const req = makeRequest(
      { suburb: "Sandton", city: "Johannesburg" },
      { Authorization: "Bearer valid-token" }
    );
    const res = await POST(req);
    expect(res.status).toBe(502);
  });
});
