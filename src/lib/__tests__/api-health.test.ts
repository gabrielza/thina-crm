import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock firebase-admin ────────────────────────────────

const mockCountGet = vi.fn();
const mockCount = vi.fn().mockReturnValue({ get: mockCountGet });
const mockCollection = vi.fn().mockReturnValue({ count: mockCount });

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: { collection: (name: string) => mockCollection(name) },
}));

// ─── Import after mocks ─────────────────────────────────

import { GET } from "@/app/api/health/route";

// ─── Tests ───────────────────────────────────────────────

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns healthy status when Firestore is reachable and env vars are set", async () => {
    // Mock env vars
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "test-key");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "test.firebaseapp.com");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "test-project");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "test.appspot.com");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "123456");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_APP_ID", "1:123:web:abc");

    mockCountGet.mockResolvedValueOnce({ data: () => ({ count: 10 }) });

    const res = await GET();
    const json = await res.json();
    expect(json.status).toBe("healthy");
    expect(json.checks.envVars.status).toBe("pass");
    expect(json.checks.firestore.status).toBe("pass");
    expect(json.timestamp).toBeDefined();
  });

  it("returns unhealthy when Firestore fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "test-key");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "test.firebaseapp.com");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "test-project");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "test.appspot.com");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "123456");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_APP_ID", "1:123:web:abc");

    mockCountGet.mockRejectedValueOnce(new Error("Connection refused"));

    const res = await GET();
    const json = await res.json();
    expect(json.status).toBe("unhealthy");
    expect(json.checks.firestore.status).toBe("fail");
  });
});
