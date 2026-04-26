import { describe, it, expect, vi } from "vitest";
import {
  parseDoc,
  LeadSchema,
  ContactSchema,
  TransactionSchema,
  PropertySchema,
  InboundLeadSchema,
} from "@/lib/schemas";

describe("parseDoc()", () => {
  it("returns validated data when schema matches", () => {
    const raw = {
      name: "Acme",
      email: "a@b.com",
      phone: "+27 11 555 1234",
      company: "Acme",
      status: "new" as const,
      source: "portal",
      notes: "",
      value: 100,
      ownerId: "user-1",
    };
    const out = parseDoc(LeadSchema, raw, "lead-1");
    expect(out.name).toBe("Acme");
    expect(out.ownerId).toBe("user-1");
  });

  it("falls back to raw data and warns on validation failure", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const raw = { name: "X" }; // missing required fields
    const out = parseDoc(LeadSchema, raw, "bad-doc");
    expect(out).toEqual(raw);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("bad-doc"),
      expect.any(Array),
    );
    warn.mockRestore();
  });

  it("uses 'unknown' in warning when no docId provided", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    parseDoc(LeadSchema, { name: "Y" });
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("unknown"),
      expect.any(Array),
    );
    warn.mockRestore();
  });
});

describe("LeadSchema", () => {
  const minimal = {
    name: "A",
    email: "a@b.com",
    phone: "1",
    company: "C",
    status: "new" as const,
    source: "s",
    notes: "",
    value: 0,
    ownerId: "u",
  };

  it("rejects missing ownerId (security boundary)", () => {
    const { ownerId: _omit, ...withoutOwner } = minimal;
    void _omit;
    const result = LeadSchema.safeParse(withoutOwner);
    expect(result.success).toBe(false);
  });

  it("rejects invalid status enum", () => {
    const result = LeadSchema.safeParse({ ...minimal, status: "archived" });
    expect(result.success).toBe(false);
  });

  it("rejects non-numeric value (currency must be number)", () => {
    const result = LeadSchema.safeParse({ ...minimal, value: "100" });
    expect(result.success).toBe(false);
  });

  it("accepts optional starred boolean", () => {
    const result = LeadSchema.safeParse({ ...minimal, starred: true });
    expect(result.success).toBe(true);
  });

  it("accepts lead without starred (backward compat)", () => {
    const result = LeadSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });
});

describe("TransactionSchema", () => {
  const minimal = {
    propertyAddress: "1 Main",
    salePrice: 1_000_000,
    commissionRate: 0.07,
    commissionAmount: 70_000,
    vatIncluded: false,
    vatAmount: 0,
    splits: [],
    agentNetCommission: 70_000,
    stage: "otp_signed" as const,
    stageHistory: [],
    ficaBuyer: false,
    ficaSeller: false,
    conveyancer: "",
    bondOriginator: "",
    buyerName: "",
    sellerName: "",
    notes: "",
    dates: {},
    ownerId: "u",
  };

  it("accepts a valid transaction", () => {
    expect(TransactionSchema.safeParse(minimal).success).toBe(true);
  });

  it("rejects invalid stage value", () => {
    const result = TransactionSchema.safeParse({ ...minimal, stage: "complete" });
    expect(result.success).toBe(false);
  });

  it("rejects string salePrice (currency must be number)", () => {
    const result = TransactionSchema.safeParse({ ...minimal, salePrice: "1000000" });
    expect(result.success).toBe(false);
  });

  it("accepts all 9 valid stages", () => {
    const stages = [
      "otp_signed", "fica_submitted", "fica_verified", "bond_applied",
      "bond_approved", "transfer_lodged", "transfer_registered",
      "commission_paid", "fallen_through",
    ];
    for (const stage of stages) {
      expect(TransactionSchema.safeParse({ ...minimal, stage }).success).toBe(true);
    }
  });
});

describe("PropertySchema", () => {
  const minimal = {
    address: "1 Main",
    suburb: "Sandton",
    city: "Johannesburg",
    province: "Gauteng",
    propertyType: "house" as const,
    bedrooms: 3,
    bathrooms: 2,
    garages: 2,
    erfSize: 500,
    floorSize: 200,
    askingPrice: 2_000_000,
    mandateType: "sole" as const,
    mandateStart: "2026-01-01",
    mandateEnd: "2026-04-01",
    status: "active" as const,
    description: "",
    features: [],
    sellerName: "",
    sellerPhone: "",
    sellerEmail: "",
    ownerId: "u",
  };

  it("accepts a valid property", () => {
    expect(PropertySchema.safeParse(minimal).success).toBe(true);
  });

  it("rejects invalid propertyType", () => {
    const result = PropertySchema.safeParse({ ...minimal, propertyType: "boat" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid mandateType", () => {
    const result = PropertySchema.safeParse({ ...minimal, mandateType: "exclusive" });
    expect(result.success).toBe(false);
  });
});

describe("ContactSchema", () => {
  it("accepts a contact without optional popiaConsent", () => {
    const result = ContactSchema.safeParse({
      name: "A", email: "a@b.com", phone: "1", company: "", title: "", notes: "",
      ownerId: "u",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a contact with full popiaConsent", () => {
    const result = ContactSchema.safeParse({
      name: "A", email: "a@b.com", phone: "1", company: "", title: "", notes: "",
      ownerId: "u",
      popiaConsent: {
        given: true, date: "2026-01-01", method: "electronic",
        optEmail: true, optSms: true, optPhone: false, optWhatsapp: false,
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid popia consent method", () => {
    const result = ContactSchema.safeParse({
      name: "A", email: "a@b.com", phone: "1", company: "", title: "", notes: "",
      ownerId: "u",
      popiaConsent: {
        given: true, date: "2026-01-01", method: "telepathy",
        optEmail: true, optSms: true, optPhone: false, optWhatsapp: false,
      },
    });
    expect(result.success).toBe(false);
  });
});

describe("InboundLeadSchema", () => {
  it("rejects invalid status enum", () => {
    const result = InboundLeadSchema.safeParse({
      source: "property24",
      rawContent: "x",
      parsed: { name: "A", email: "", phone: "", propertyRef: "", propertyAddress: "", message: "" },
      status: "spam",
      ownerId: "u",
    });
    expect(result.success).toBe(false);
  });

  it("accepts pending status", () => {
    const result = InboundLeadSchema.safeParse({
      source: "property24",
      rawContent: "x",
      parsed: { name: "A", email: "", phone: "", propertyRef: "", propertyAddress: "", message: "" },
      status: "pending",
      ownerId: "u",
    });
    expect(result.success).toBe(true);
  });
});
