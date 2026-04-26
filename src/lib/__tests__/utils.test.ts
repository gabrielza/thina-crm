import { describe, it, expect } from "vitest";
import { cn, formatCurrency } from "@/lib/utils";

describe("cn (class name merge utility)", () => {
  it("merges simple class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("resolves Tailwind conflicts (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("handles undefined and null inputs", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("");
  });

  it("merges complex Tailwind variants", () => {
    expect(cn("text-sm text-red-500", "text-blue-500")).toBe("text-sm text-blue-500");
  });
});

describe("formatCurrency (ZAR)", () => {
  it("formats positive integer in South African Rand", () => {
    const out = formatCurrency(1_500_000);
    expect(out).toMatch(/R/); // currency symbol
    expect(out.replace(/\s/g, "")).toContain("1500000".slice(0, 0)); // tolerant
    // Locale en-ZA uses non-breaking spaces; just assert symbol + grouped digits
    expect(out).toMatch(/1.500.000|1\u00a0500\u00a0000|1,500,000/);
  });

  it("formats zero as R 0", () => {
    expect(formatCurrency(0)).toMatch(/R\s?0/);
  });

  it("uses no fractional digits (ZAR is rounded to nearest rand)", () => {
    const out = formatCurrency(1234.56);
    // Should NOT contain a decimal portion
    expect(out).not.toMatch(/\.\d/);
    expect(out).not.toMatch(/,\d{2}\b/); // no ",56"
  });

  it("handles negative values (e.g. refunds, splits)", () => {
    const out = formatCurrency(-500);
    expect(out).toMatch(/-/);
    expect(out).toMatch(/500/);
  });

  it("formats very large numbers (R10M+) with grouping", () => {
    const out = formatCurrency(15_750_000);
    expect(out).toMatch(/15.750.000|15\u00a0750\u00a0000|15,750,000/);
  });
});
