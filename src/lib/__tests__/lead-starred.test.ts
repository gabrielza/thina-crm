import { describe, it, expect } from "vitest";
import { LeadSchema } from "@/lib/schemas";

const baseLead = {
  name: "Test Lead",
  email: "test@example.com",
  phone: "+27821234567",
  company: "Acme Properties",
  status: "new" as const,
  source: "Website",
  notes: "",
  value: 1500000,
  ownerId: "user-1",
};

describe("LeadSchema — starred field", () => {
  it("accepts a lead without `starred` (backward compat)", () => {
    const result = LeadSchema.safeParse(baseLead);
    expect(result.success).toBe(true);
  });

  it("accepts `starred: true`", () => {
    const result = LeadSchema.safeParse({ ...baseLead, starred: true });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.starred).toBe(true);
  });

  it("accepts `starred: false`", () => {
    const result = LeadSchema.safeParse({ ...baseLead, starred: false });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.starred).toBe(false);
  });

  it("rejects non-boolean `starred` values", () => {
    const result = LeadSchema.safeParse({ ...baseLead, starred: "yes" });
    expect(result.success).toBe(false);
  });
});
