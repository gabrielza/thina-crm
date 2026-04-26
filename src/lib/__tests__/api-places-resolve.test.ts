import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock firebase-admin ────────────────────────────────

const mockVerifyIdToken = vi.fn();
const mockGet = vi.fn();
const mockSet = vi.fn();

vi.mock("@/lib/firebase-admin", () => ({
  adminAuth: { verifyIdToken: (token: string) => mockVerifyIdToken(token) },
  adminDb: {
    collection: () => ({
      doc: () => ({
        get: () => mockGet(),
        set: (data: unknown, opts: unknown) => mockSet(data, opts),
      }),
    }),
  },
}));

// ─── Mock the rate limiter ─────────────────────────────

const mockCheck = vi.fn();
vi.mock("@/lib/rate-limit", () => ({
  placesLimiter: {
    check: (key: string) => mockCheck(key),
    headers: () => ({}),
  },
}));

// ─── Mock firestore Timestamp ──────────────────────────

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { arrayUnion: (v: unknown) => ({ __op: "arrayUnion", value: v }) },
  Timestamp: {
    now: () => ({ toMillis: () => Date.now() }),
    fromMillis: (ms: number) => ({ toMillis: () => ms }),
  },
}));

// ─── Import under test (after mocks) ────────────────────

import { POST } from "@/app/api/places/resolve/route";
import { NextRequest } from "next/server";

function makeRequest(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/places/resolve", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...headers },
  });
}

describe("POST /api/places/resolve", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    mockCheck.mockResolvedValue({ allowed: true });
  });

  it("returns 401 without Authorization header", async () => {
    const res = await POST(makeRequest({ placeId: "ChIJabc" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid placeId", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ uid: "u1" });
    const res = await POST(
      makeRequest({ placeId: "../etc/passwd" }, { Authorization: "Bearer t" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 429 when rate limit exceeded", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ uid: "u1" });
    mockCheck.mockResolvedValueOnce({ allowed: false });
    const res = await POST(
      makeRequest({ placeId: "ChIJValidId123" }, { Authorization: "Bearer t" })
    );
    expect(res.status).toBe(429);
  });

  it("returns cached result without calling Google when cache is fresh", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ uid: "u1" });
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        placeId: "ChIJCachedId",
        formattedAddress: "10 Cached St, Sandton, South Africa",
        lat: -26.1,
        lng: 28.05,
        suburb: "Sandton",
        city: "Johannesburg",
        province: "Gauteng",
        country: "South Africa",
        postalCode: "2196",
        refreshedAt: { toMillis: () => Date.now() },
      }),
    });

    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const res = await POST(
      makeRequest({ placeId: "ChIJCachedId" }, { Authorization: "Bearer t" })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.fromCache).toBe(true);
    expect(json.formattedAddress).toBe("10 Cached St, Sandton, South Africa");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fetches from Google and caches when entry is missing", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ uid: "u1" });
    vi.stubEnv("GOOGLE_MAPS_SERVER_KEY", "server-key");
    mockGet.mockResolvedValueOnce({ exists: false });
    mockSet.mockResolvedValueOnce(undefined);

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        formattedAddress: "12 Main Rd, Sandton, 2196, South Africa",
        location: { latitude: -26.107, longitude: 28.056 },
        addressComponents: [
          { longText: "12", shortText: "12", types: ["street_number"] },
          { longText: "Main Road", shortText: "Main Rd", types: ["route"] },
          { longText: "Sandton", shortText: "Sandton", types: ["sublocality_level_1", "sublocality"] },
          { longText: "Johannesburg", shortText: "JHB", types: ["locality"] },
          { longText: "Gauteng", shortText: "GP", types: ["administrative_area_level_1"] },
          { longText: "South Africa", shortText: "ZA", types: ["country"] },
          { longText: "2196", shortText: "2196", types: ["postal_code"] },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      makeRequest({ placeId: "ChIJNewPlaceId" }, { Authorization: "Bearer t" })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.fromCache).toBe(false);
    expect(json.suburb).toBe("Sandton");
    expect(json.city).toBe("Johannesburg");
    expect(json.lat).toBe(-26.107);
    expect(json.lng).toBe(28.056);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledTimes(1);
  });

  it("returns 503 when GOOGLE_MAPS_SERVER_KEY missing on cache miss", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ uid: "u1" });
    delete process.env.GOOGLE_MAPS_SERVER_KEY;
    mockGet.mockResolvedValueOnce({ exists: false });

    const res = await POST(
      makeRequest({ placeId: "ChIJUnconfigured" }, { Authorization: "Bearer t" })
    );
    expect(res.status).toBe(503);
  });
});
