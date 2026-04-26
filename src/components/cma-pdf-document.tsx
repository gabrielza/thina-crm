"use client";

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { CmaReport, CmaComparable, AgentProfile } from "@/lib/firestore";

// ─── Brand palette ───────────────────────────────────────
const C = {
  ink: "#0F172A",       // slate-900
  ink2: "#1E293B",      // slate-800
  text: "#334155",      // slate-700
  muted: "#64748B",     // slate-500
  faint: "#94A3B8",     // slate-400
  line: "#E2E8F0",      // slate-200
  bg: "#F8FAFC",        // slate-50
  card: "#FFFFFF",
  brand: "#0F766E",     // teal-700
  brandDark: "#115E59", // teal-800
  brandSoft: "#CCFBF1", // teal-100
  accent: "#F59E0B",    // amber-500
  accentSoft: "#FEF3C7",
  good: "#15803D",
  warn: "#B45309",
  bad: "#B91C1C",
  goodSoft: "#DCFCE7",
  warnSoft: "#FEF3C7",
  badSoft: "#FEE2E2",
};

const S = StyleSheet.create({
  page: {
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: 44,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.text,
    lineHeight: 1.45,
  },
  // ── Cover ──
  coverPage: { padding: 0, fontFamily: "Helvetica" },
  coverHero: {
    backgroundColor: C.brand,
    paddingTop: 90,
    paddingHorizontal: 50,
    paddingBottom: 50,
    height: 360,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  coverBrandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coverBrandMark: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    letterSpacing: 4,
  },
  coverTagline: {
    fontSize: 9,
    color: C.brandSoft,
    letterSpacing: 1.5,
  },
  coverTitle: {
    fontSize: 38,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    lineHeight: 1.1,
    marginBottom: 8,
  },
  coverSubtitle: {
    fontSize: 13,
    color: C.brandSoft,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  coverAddressBlock: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 50,
    marginTop: -48,
    padding: 24,
    borderRadius: 8,
    borderTopWidth: 4,
    borderTopColor: C.accent,
  },
  coverAddressBig: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
    marginBottom: 4,
  },
  coverAddressSub: {
    fontSize: 11,
    color: C.muted,
    marginBottom: 18,
  },
  coverEstimateRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  coverEstimateLabel: {
    fontSize: 9,
    color: C.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  coverEstimateValue: {
    fontSize: 30,
    fontFamily: "Helvetica-Bold",
    color: C.brand,
  },
  coverRangeText: {
    fontSize: 10,
    color: C.muted,
    textAlign: "right",
  },
  coverRangeValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
    textAlign: "right",
  },
  coverFooter: {
    position: "absolute",
    bottom: 36,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  coverPreparedFor: {
    fontSize: 9,
    color: C.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  coverPreparedName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
  },
  coverPreparedAgent: {
    fontSize: 10,
    color: C.text,
  },

  // ── Header strip on every content page ──
  headerStrip: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: C.ink,
    paddingHorizontal: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerBrand: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    letterSpacing: 3,
  },
  headerProperty: {
    fontSize: 9,
    color: C.brandSoft,
  },
  headerAccent: {
    position: "absolute",
    top: 36,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: C.accent,
  },

  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: C.muted,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: C.line,
  },

  // ── Section heads ──
  sectionEyebrow: {
    fontSize: 9,
    color: C.brand,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
    marginBottom: 14,
  },
  sectionLead: {
    fontSize: 10,
    color: C.text,
    marginBottom: 18,
    lineHeight: 1.6,
  },
  subhead: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
    marginBottom: 8,
    marginTop: 16,
  },

  // ── KPI tiles ──
  kpiRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  kpiTile: {
    flex: 1,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 6,
    padding: 14,
  },
  kpiTilePrimary: {
    flex: 1,
    backgroundColor: C.brand,
    borderRadius: 6,
    padding: 14,
  },
  kpiLabel: {
    fontSize: 8,
    color: C.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  kpiLabelLight: {
    fontSize: 8,
    color: C.brandSoft,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
  },
  kpiValueLight: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
  },
  kpiSub: {
    fontSize: 8,
    color: C.muted,
    marginTop: 2,
  },
  kpiSubLight: {
    fontSize: 8,
    color: C.brandSoft,
    marginTop: 2,
  },

  // ── Detail grid (subject) ──
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: C.bg,
    borderRadius: 6,
    padding: 16,
  },
  detailItem: {
    width: "33.33%",
    paddingVertical: 6,
    paddingRight: 8,
  },
  detailLabel: {
    fontSize: 8,
    color: C.muted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
  },

  // ── Comparable card ──
  compCard: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 6,
    padding: 14,
    marginBottom: 12,
  },
  compHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: C.line,
  },
  compNumber: {
    backgroundColor: C.brand,
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    marginRight: 10,
    letterSpacing: 1,
  },
  compAddress: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
    flex: 1,
  },
  compSuburb: {
    fontSize: 9,
    color: C.muted,
    marginTop: 1,
  },
  compPrice: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: C.brand,
    textAlign: "right",
  },
  compPpsm: {
    fontSize: 8,
    color: C.muted,
    textAlign: "right",
  },
  compFacts: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  compFact: {
    width: "25%",
    paddingVertical: 4,
  },
  compNotes: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: C.line,
    fontSize: 9,
    color: C.text,
    fontStyle: "italic",
  },

  // ── Tables ──
  tHead: {
    flexDirection: "row",
    backgroundColor: C.ink,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tHeadCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  tRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: C.line,
  },
  tRowAlt: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: C.line,
    backgroundColor: C.bg,
  },
  tCell: { fontSize: 9, color: C.text },
  tCellBold: { fontSize: 9, color: C.ink, fontFamily: "Helvetica-Bold" },
  tCellRight: { fontSize: 9, color: C.text, textAlign: "right" },
  tCellCenter: { fontSize: 9, color: C.text, textAlign: "center" },

  // ── Recommendation strip ──
  recoBox: {
    backgroundColor: C.ink,
    borderRadius: 8,
    padding: 22,
    marginVertical: 16,
  },
  recoEyebrow: {
    fontSize: 9,
    color: C.brandSoft,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  recoTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    marginBottom: 14,
  },
  recoTier: {
    flexDirection: "row",
    gap: 12,
  },
  recoCol: {
    flex: 1,
    backgroundColor: C.ink2,
    padding: 12,
    borderRadius: 4,
    borderTopWidth: 3,
  },
  recoColLabel: {
    fontSize: 8,
    color: C.brandSoft,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  recoColValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
  },
  recoColSub: {
    fontSize: 8,
    color: C.faint,
    marginTop: 3,
  },

  // ── Confidence pills ──
  pill: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    alignSelf: "flex-start",
  },

  // ── Notes / quote ──
  notesBox: {
    backgroundColor: C.bg,
    borderLeftWidth: 3,
    borderLeftColor: C.brand,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  notesText: {
    fontSize: 10,
    color: C.text,
    lineHeight: 1.6,
  },

  // ── Agent card ──
  agentCard: {
    backgroundColor: C.bg,
    borderRadius: 6,
    padding: 18,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  agentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.brand,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  agentInitials: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
  },
  agentName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
  },
  agentEmail: {
    fontSize: 9,
    color: C.muted,
  },
  agentMeta: {
    fontSize: 9,
    color: C.muted,
    marginTop: 2,
  },

  // ── Disclaimer ──
  disclaimer: {
    fontSize: 7,
    color: C.muted,
    lineHeight: 1.5,
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: C.line,
  },

  // ── Misc ──
  divider: { height: 1, backgroundColor: C.line, marginVertical: 12 },
  rangeBarTrack: {
    height: 8,
    backgroundColor: C.line,
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 6,
    position: "relative",
  },
  rangeBarFill: {
    height: 8,
    backgroundColor: C.brand,
    borderRadius: 4,
  },
  rangeBarLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: C.muted,
  },
});

// ─── Helpers ─────────────────────────────────────────────
function fmtR(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `R ${Math.round(n).toLocaleString("en-ZA")}`;
}
function fmtCompact(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "—";
  if (n >= 1_000_000) return `R ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `R ${(n / 1_000).toFixed(0)}k`;
  return `R ${n}`;
}
function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}
function pillStyle(level: string) {
  if (level === "high") return { ...S.pill, backgroundColor: C.goodSoft, color: C.good };
  if (level === "medium") return { ...S.pill, backgroundColor: C.warnSoft, color: C.warn };
  return { ...S.pill, backgroundColor: C.badSoft, color: C.bad };
}
function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}
function initials(name?: string, email?: string): string {
  const src = (name || email || "TC").trim();
  const parts = src.split(/\s+|@/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}
function valueRange(report: CmaReport, validComps: CmaComparable[]): { low: number; high: number; pct: number } {
  if (validComps.length < 2) {
    const pct = 0.10;
    return {
      low: Math.round(report.estimatedValue * (1 - pct)),
      high: Math.round(report.estimatedValue * (1 + pct)),
      pct,
    };
  }
  const prices = validComps.map((c) => c.salePrice);
  const stdDev = Math.sqrt(prices.reduce((s, p) => s + Math.pow(p - report.estimatedValue, 2), 0) / prices.length);
  const pct = Math.min(Math.max(stdDev / report.estimatedValue, 0.03), 0.15);
  return {
    low: Math.round(report.estimatedValue * (1 - pct)),
    high: Math.round(report.estimatedValue * (1 + pct)),
    pct,
  };
}
function pricingRecommendation(estimated: number, confidence: string) {
  // Suggested list, target sale, walk-away floor.
  const listMul = confidence === "high" ? 1.03 : confidence === "medium" ? 1.05 : 1.07;
  const targetMul = 1.0;
  const floorMul = confidence === "high" ? 0.96 : confidence === "medium" ? 0.93 : 0.90;
  return {
    list: Math.round(estimated * listMul),
    target: Math.round(estimated * targetMul),
    floor: Math.round(estimated * floorMul),
  };
}

// ─── Header / Footer ─────────────────────────────────────
function PageChrome({ address }: { address: string }) {
  return (
    <>
      <View style={S.headerStrip} fixed>
        <Text style={S.headerBrand}>THINA  ·  CMA</Text>
        <Text style={S.headerProperty}>{address}</Text>
      </View>
      <View style={S.headerAccent} fixed />
      <View style={S.footer} fixed>
        <Text>Thina CRM  ·  Comparative Market Analysis</Text>
        <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </>
  );
}

// ─── Document ────────────────────────────────────────────
interface CmaDocumentProps {
  report: CmaReport;
  /** Full agent profile from /settings/profile. Preferred. */
  agent?: AgentProfile | { name?: string; email?: string; phone?: string; agencyName?: string; ffcNumber?: string; photoUrl?: string; agencyLogoUrl?: string } | null;
  /** @deprecated Use agent.displayName / agent.name */
  agentName?: string;
}

// Normalize the agent prop — supports legacy `{ name, email }` shape and the
// full AgentProfile shape from /settings/profile.
function normalizeAgent(
  agent: CmaDocumentProps["agent"],
  fallbackName?: string
): {
  name: string;
  email: string;
  phone: string;
  agencyName: string;
  ffcNumber: string;
  photoUrl: string;
  agencyLogoUrl: string;
  bio: string;
  website: string;
  jobTitle: string;
} {
  const a = (agent ?? {}) as Partial<AgentProfile> & { name?: string };
  const name =
    a.displayName?.trim()
    || a.name?.trim()
    || `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim()
    || fallbackName?.trim()
    || a.email?.trim()
    || "";
  return {
    name,
    email: a.email ?? "",
    phone: a.phone ?? "",
    agencyName: a.agencyName ?? "",
    ffcNumber: a.ffcNumber ?? "",
    photoUrl: a.photoUrl ?? "",
    agencyLogoUrl: a.agencyLogoUrl ?? "",
    bio: a.bio ?? "",
    website: a.website ?? "",
    jobTitle: a.jobTitle ?? "",
  };
}

export function CmaDocument({ report, agent, agentName }: CmaDocumentProps) {
  const today = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
  const validComps = report.comparables.filter((c) => c.salePrice > 0);
  const range = valueRange(report, validComps);
  const reco = pricingRecommendation(report.estimatedValue, report.confidenceLevel);

  // Stats
  const minPrice = validComps.length ? Math.min(...validComps.map((c) => c.salePrice)) : 0;
  const maxPrice = validComps.length ? Math.max(...validComps.map((c) => c.salePrice)) : 0;
  const avgPrice = validComps.length ? Math.round(validComps.reduce((s, c) => s + c.salePrice, 0) / validComps.length) : 0;
  const compsWithFloor = validComps.filter((c) => c.floorSize > 0);
  const avgPpsm = compsWithFloor.length
    ? Math.round(compsWithFloor.reduce((s, c) => s + c.salePrice / c.floorSize, 0) / compsWithFloor.length)
    : 0;
  const avgDom = validComps.length ? Math.round(validComps.reduce((s, c) => s + (c.daysOnMarket || 0), 0) / validComps.length) : 0;

  const agentInfo = normalizeAgent(agent, agentName);
  const agentName_ = agentInfo.name;
  const agentEmail = agentInfo.email;
  const headerAddr = `${report.subjectAddress}  ·  ${report.subjectSuburb}`;

  return (
    <Document
      title={`CMA — ${report.subjectAddress}`}
      author={agentName_ || "Thina CRM"}
      subject={`Comparative Market Analysis for ${report.subjectAddress}`}
      keywords={`CMA, ${report.subjectSuburb}, ${report.subjectCity}, real estate, valuation`}
    >
      {/* ─── COVER ─── */}
      <Page size="A4" style={S.coverPage}>
        <View style={S.coverHero}>
          <View style={S.coverBrandRow}>
            <Text style={S.coverBrandMark}>THINA</Text>
            <Text style={S.coverTagline}>REAL ESTATE INTELLIGENCE</Text>
          </View>
          <View>
            <Text style={S.coverSubtitle}>Comparative Market Analysis</Text>
            <Text style={S.coverTitle}>Property Valuation</Text>
            <Text style={S.coverTitle}>Report</Text>
          </View>
        </View>

        <View style={S.coverAddressBlock}>
          <Text style={S.coverAddressBig}>{report.subjectAddress || "—"}</Text>
          <Text style={S.coverAddressSub}>
            {[report.subjectSuburb, report.subjectCity].filter(Boolean).join(", ")}
            {"  ·  "}
            {cap(report.subjectType)} · {report.subjectBedrooms} bed · {report.subjectBathrooms} bath · {report.subjectFloorSize} m²
          </Text>
          <View style={S.coverEstimateRow}>
            <View>
              <Text style={S.coverEstimateLabel}>Estimated Market Value</Text>
              <Text style={S.coverEstimateValue}>{fmtR(report.estimatedValue)}</Text>
            </View>
            <View>
              <Text style={S.coverRangeText}>Likely Range</Text>
              <Text style={S.coverRangeValue}>{fmtR(range.low)} – {fmtR(range.high)}</Text>
              <Text style={[S.coverRangeText, { marginTop: 2 }]}>±{(range.pct * 100).toFixed(1)}%</Text>
            </View>
          </View>
        </View>

        <View style={S.coverFooter}>
          <View>
            <Text style={S.coverPreparedFor}>Prepared For</Text>
            <Text style={S.coverPreparedName}>{report.contactName || "—"}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={S.coverPreparedFor}>Prepared By</Text>
            <Text style={S.coverPreparedName}>{agentName_ || "Thina CRM"}</Text>
            {agentInfo.jobTitle ? (
              <Text style={S.coverPreparedAgent}>{agentInfo.jobTitle}</Text>
            ) : null}
            {agentInfo.agencyName ? (
              <Text style={S.coverPreparedAgent}>{agentInfo.agencyName}</Text>
            ) : null}
            {agentEmail ? <Text style={S.coverPreparedAgent}>{agentEmail}</Text> : null}
            {agentInfo.phone ? <Text style={S.coverPreparedAgent}>{agentInfo.phone}</Text> : null}
            <Text style={[S.coverPreparedAgent, { marginTop: 6 }]}>{today}</Text>
          </View>
        </View>
      </Page>

      {/* ─── EXECUTIVE SUMMARY ─── */}
      <Page size="A4" style={S.page}>
        <PageChrome address={headerAddr} />

        <Text style={S.sectionEyebrow}>Section 1</Text>
        <Text style={S.sectionTitle}>Executive Summary</Text>
        <Text style={S.sectionLead}>
          This Comparative Market Analysis estimates the current market value of the subject property
          based on {validComps.length} recent comparable {validComps.length === 1 ? "sale" : "sales"} in
          {" "}{report.subjectSuburb || "the area"} and surrounding suburbs. The valuation reflects current
          market conditions, the subject property&rsquo;s features, and observable price trends for similar
          {" "}{report.subjectType}s in {report.subjectCity || "this market"}.
        </Text>

        <View style={S.kpiRow}>
          <View style={S.kpiTilePrimary}>
            <Text style={S.kpiLabelLight}>Estimated Value</Text>
            <Text style={S.kpiValueLight}>{fmtR(report.estimatedValue)}</Text>
            <Text style={S.kpiSubLight}>±{(range.pct * 100).toFixed(1)}% confidence band</Text>
          </View>
          <View style={S.kpiTile}>
            <Text style={S.kpiLabel}>Price per m²</Text>
            <Text style={S.kpiValue}>{fmtR(report.pricePerSqm)}</Text>
            <Text style={S.kpiSub}>Subject benchmark</Text>
          </View>
          <View style={S.kpiTile}>
            <Text style={S.kpiLabel}>Confidence</Text>
            <Text style={pillStyle(report.confidenceLevel)}>{report.confidenceLevel}</Text>
            <Text style={S.kpiSub}>{validComps.length} comparable {validComps.length === 1 ? "sale" : "sales"}</Text>
          </View>
        </View>

        {/* Range bar */}
        <Text style={S.subhead}>Value Range</Text>
        <View style={S.rangeBarTrack}>
          <View style={[S.rangeBarFill, { width: "100%" }]} />
        </View>
        <View style={S.rangeBarLabels}>
          <Text>{fmtR(range.low)}</Text>
          <Text>Estimated  ·  {fmtR(report.estimatedValue)}</Text>
          <Text>{fmtR(range.high)}</Text>
        </View>

        {/* Key insights */}
        <Text style={S.subhead}>Key Insights</Text>
        <View style={S.notesBox}>
          <Text style={S.notesText}>
            {validComps.length > 0 && (
              <>• Comparable sale prices range from {fmtR(minPrice)} to {fmtR(maxPrice)} (average {fmtR(avgPrice)}).{"\n"}</>
            )}
            {avgPpsm > 0 && (
              <>• Average price per square metre across comparables is {fmtR(avgPpsm)}/m². Subject is benchmarked at {fmtR(report.pricePerSqm)}/m².{"\n"}</>
            )}
            {avgDom > 0 && (
              <>• Comparable properties spent on average {avgDom} days on market before sale.{"\n"}</>
            )}
            • The estimated value reflects a {report.confidenceLevel} confidence assessment, supported by current
            {" "}market data and the subject&rsquo;s positioning relative to recent sales.
          </Text>
        </View>
      </Page>

      {/* ─── SUBJECT PROPERTY ─── */}
      <Page size="A4" style={S.page}>
        <PageChrome address={headerAddr} />

        <Text style={S.sectionEyebrow}>Section 2</Text>
        <Text style={S.sectionTitle}>Subject Property</Text>
        <Text style={S.sectionLead}>
          The detailed profile of the property under valuation. All measurements are subject to verification
          against the title deed and physical inspection.
        </Text>

        <View style={S.detailGrid}>
          <View style={S.detailItem}>
            <Text style={S.detailLabel}>Street Address</Text>
            <Text style={S.detailValue}>{report.subjectAddress || "—"}</Text>
          </View>
          <View style={S.detailItem}>
            <Text style={S.detailLabel}>Suburb</Text>
            <Text style={S.detailValue}>{report.subjectSuburb || "—"}</Text>
          </View>
          <View style={S.detailItem}>
            <Text style={S.detailLabel}>City</Text>
            <Text style={S.detailValue}>{report.subjectCity || "—"}</Text>
          </View>
          <View style={S.detailItem}>
            <Text style={S.detailLabel}>Property Type</Text>
            <Text style={S.detailValue}>{cap(report.subjectType)}</Text>
          </View>
          <View style={S.detailItem}>
            <Text style={S.detailLabel}>Bedrooms</Text>
            <Text style={S.detailValue}>{report.subjectBedrooms}</Text>
          </View>
          <View style={S.detailItem}>
            <Text style={S.detailLabel}>Bathrooms</Text>
            <Text style={S.detailValue}>{report.subjectBathrooms}</Text>
          </View>
          <View style={S.detailItem}>
            <Text style={S.detailLabel}>Floor Size</Text>
            <Text style={S.detailValue}>{report.subjectFloorSize} m²</Text>
          </View>
          <View style={S.detailItem}>
            <Text style={S.detailLabel}>Erf Size</Text>
            <Text style={S.detailValue}>{report.subjectErfSize} m²</Text>
          </View>
          <View style={S.detailItem}>
            <Text style={S.detailLabel}>Subject Price/m²</Text>
            <Text style={S.detailValue}>{fmtR(report.pricePerSqm)}</Text>
          </View>
          {report.subjectLat && report.subjectLng ? (
            <View style={S.detailItem}>
              <Text style={S.detailLabel}>Geocoded</Text>
              <Text style={S.detailValue}>{report.subjectLat.toFixed(4)}, {report.subjectLng.toFixed(4)}</Text>
            </View>
          ) : null}
          <View style={S.detailItem}>
            <Text style={S.detailLabel}>Report Status</Text>
            <Text style={S.detailValue}>{cap(report.status)}</Text>
          </View>
          <View style={S.detailItem}>
            <Text style={S.detailLabel}>Report Title</Text>
            <Text style={S.detailValue}>{report.title}</Text>
          </View>
        </View>
      </Page>

      {/* ─── COMPARABLES — DETAILED CARDS ─── */}
      <Page size="A4" style={S.page}>
        <PageChrome address={headerAddr} />

        <Text style={S.sectionEyebrow}>Section 3</Text>
        <Text style={S.sectionTitle}>Comparable Sales</Text>
        <Text style={S.sectionLead}>
          The {validComps.length} properties below were selected based on proximity, type, and feature similarity
          to the subject. Each comparable contributes to the estimated market value.
        </Text>

        {report.comparables.map((comp, idx) => {
          const ppsm = comp.floorSize > 0 ? Math.round(comp.salePrice / comp.floorSize) : 0;
          return (
            <View key={idx} style={S.compCard} wrap={false}>
              <View style={S.compHeader}>
                <View style={{ flexDirection: "row", flex: 1, alignItems: "flex-start" }}>
                  <Text style={S.compNumber}>COMP {idx + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={S.compAddress}>{comp.address || "—"}</Text>
                    <Text style={S.compSuburb}>{comp.suburb || "—"}  ·  Sold {fmtDate(comp.saleDate)}</Text>
                  </View>
                </View>
                <View>
                  <Text style={S.compPrice}>{fmtR(comp.salePrice)}</Text>
                  {ppsm > 0 && <Text style={S.compPpsm}>{fmtR(ppsm)} / m²</Text>}
                </View>
              </View>
              <View style={S.compFacts}>
                <View style={S.compFact}>
                  <Text style={S.detailLabel}>Type</Text>
                  <Text style={S.detailValue}>{cap(comp.propertyType || "—")}</Text>
                </View>
                <View style={S.compFact}>
                  <Text style={S.detailLabel}>Bed / Bath</Text>
                  <Text style={S.detailValue}>{comp.bedrooms} / {comp.bathrooms}</Text>
                </View>
                <View style={S.compFact}>
                  <Text style={S.detailLabel}>Floor</Text>
                  <Text style={S.detailValue}>{comp.floorSize || "—"} m²</Text>
                </View>
                <View style={S.compFact}>
                  <Text style={S.detailLabel}>Erf</Text>
                  <Text style={S.detailValue}>{comp.erfSize || "—"} m²</Text>
                </View>
                <View style={S.compFact}>
                  <Text style={S.detailLabel}>Days on Market</Text>
                  <Text style={S.detailValue}>{comp.daysOnMarket || "—"}</Text>
                </View>
                {comp.adjustedPrice ? (
                  <View style={S.compFact}>
                    <Text style={S.detailLabel}>Adjusted Price</Text>
                    <Text style={S.detailValue}>{fmtR(comp.adjustedPrice)}</Text>
                  </View>
                ) : null}
              </View>
              {comp.notes ? <Text style={S.compNotes}>“{comp.notes}”</Text> : null}
            </View>
          );
        })}
      </Page>

      {/* ─── COMPARISON MATRIX ─── */}
      <Page size="A4" style={S.page}>
        <PageChrome address={headerAddr} />

        <Text style={S.sectionEyebrow}>Section 4</Text>
        <Text style={S.sectionTitle}>Side-by-Side Comparison</Text>
        <Text style={S.sectionLead}>
          Direct feature comparison of the subject against each comparable, highlighting differences that
          influence relative pricing.
        </Text>

        <View>
          <View style={S.tHead}>
            <Text style={[S.tHeadCell, { flex: 1.4 }]}>Feature</Text>
            <Text style={[S.tHeadCell, { width: 70, textAlign: "center" }]}>Subject</Text>
            {report.comparables.slice(0, 5).map((_, i) => (
              <Text key={i} style={[S.tHeadCell, { width: 60, textAlign: "center" }]}>Comp {i + 1}</Text>
            ))}
          </View>

          {[
            { label: "Sale Price", subj: "—", get: (c: CmaComparable) => fmtCompact(c.salePrice), bold: true },
            { label: "Type", subj: cap(report.subjectType), get: (c: CmaComparable) => cap(c.propertyType || "—") },
            { label: "Bedrooms", subj: String(report.subjectBedrooms), get: (c: CmaComparable) => String(c.bedrooms) },
            { label: "Bathrooms", subj: String(report.subjectBathrooms), get: (c: CmaComparable) => String(c.bathrooms) },
            { label: "Floor Size (m²)", subj: String(report.subjectFloorSize), get: (c: CmaComparable) => String(c.floorSize || "—") },
            { label: "Erf Size (m²)", subj: String(report.subjectErfSize), get: (c: CmaComparable) => String(c.erfSize || "—") },
            { label: "Price / m²", subj: fmtR(report.pricePerSqm), get: (c: CmaComparable) => c.floorSize > 0 ? fmtR(Math.round(c.salePrice / c.floorSize)) : "—", bold: true },
            { label: "Days on Market", subj: "—", get: (c: CmaComparable) => String(c.daysOnMarket || "—") },
            { label: "Sale Date", subj: today, get: (c: CmaComparable) => fmtDate(c.saleDate) },
          ].map((row, i) => (
            <View key={i} style={i % 2 === 0 ? S.tRow : S.tRowAlt}>
              <Text style={[row.bold ? S.tCellBold : S.tCell, { flex: 1.4 }]}>{row.label}</Text>
              <Text style={[row.bold ? S.tCellBold : S.tCellCenter, { width: 70, textAlign: "center" }]}>{row.subj}</Text>
              {report.comparables.slice(0, 5).map((c, j) => (
                <Text key={j} style={[S.tCellCenter, { width: 60 }]}>{row.get(c)}</Text>
              ))}
            </View>
          ))}
        </View>

        {/* Comparable price chart */}
        {validComps.length > 0 && (
          <>
            <Text style={S.subhead}>Sale Price Distribution</Text>
            <PriceChart
              comps={validComps}
              estimated={report.estimatedValue}
              minVal={Math.min(minPrice, range.low, report.estimatedValue)}
              maxVal={Math.max(maxPrice, range.high, report.estimatedValue)}
            />
          </>
        )}
      </Page>

      {/* ─── PRICING STRATEGY ─── */}
      <Page size="A4" style={S.page}>
        <PageChrome address={headerAddr} />

        <Text style={S.sectionEyebrow}>Section 5</Text>
        <Text style={S.sectionTitle}>Pricing Strategy &amp; Recommendation</Text>
        <Text style={S.sectionLead}>
          A recommended three-tier pricing structure derived from the estimated value and the confidence band.
          Use the suggested list price to anchor negotiations and the floor as a walk-away threshold.
        </Text>

        <View style={S.recoBox}>
          <Text style={S.recoEyebrow}>Recommended Pricing Tiers</Text>
          <Text style={S.recoTitle}>Position with confidence, defend with data</Text>
          <View style={S.recoTier}>
            <View style={[S.recoCol, { borderTopColor: C.accent }]}>
              <Text style={S.recoColLabel}>Suggested List</Text>
              <Text style={S.recoColValue}>{fmtR(reco.list)}</Text>
              <Text style={S.recoColSub}>Anchor price for marketing</Text>
            </View>
            <View style={[S.recoCol, { borderTopColor: C.brandSoft }]}>
              <Text style={S.recoColLabel}>Target Sale</Text>
              <Text style={S.recoColValue}>{fmtR(reco.target)}</Text>
              <Text style={S.recoColSub}>Estimated market value</Text>
            </View>
            <View style={[S.recoCol, { borderTopColor: C.faint }]}>
              <Text style={S.recoColLabel}>Walk-away Floor</Text>
              <Text style={S.recoColValue}>{fmtR(reco.floor)}</Text>
              <Text style={S.recoColSub}>Minimum acceptable offer</Text>
            </View>
          </View>
        </View>

        <Text style={S.subhead}>Market Conditions</Text>
        <View style={S.kpiRow}>
          <View style={S.kpiTile}>
            <Text style={S.kpiLabel}>Avg Sale Price</Text>
            <Text style={S.kpiValue}>{fmtR(avgPrice)}</Text>
            <Text style={S.kpiSub}>Across {validComps.length} comps</Text>
          </View>
          <View style={S.kpiTile}>
            <Text style={S.kpiLabel}>Avg Price / m²</Text>
            <Text style={S.kpiValue}>{fmtR(avgPpsm)}</Text>
            <Text style={S.kpiSub}>Comparable benchmark</Text>
          </View>
          <View style={S.kpiTile}>
            <Text style={S.kpiLabel}>Avg Days on Market</Text>
            <Text style={S.kpiValue}>{avgDom || "—"}</Text>
            <Text style={S.kpiSub}>Time to sell</Text>
          </View>
        </View>

        <Text style={S.subhead}>Marketing Recommendations</Text>
        <View style={S.notesBox}>
          <Text style={S.notesText}>
            • List at {fmtR(reco.list)} to leave room for negotiation while remaining within market expectations.{"\n"}
            • Position professional photography and a floor plan within the first 48 hours — comparable properties
            {" "}with quality marketing assets typically transact {avgDom > 0 ? `inside the ${avgDom}-day market average` : "more quickly"}.{"\n"}
            • Schedule a launch open day in the first weekend on market to maximise inspection volume and create
            {" "}competitive tension among buyers.{"\n"}
            • Re-evaluate pricing after 21 days if buyer engagement is below expectations.
          </Text>
        </View>
      </Page>

      {/* ─── NOTES & DISCLAIMER ─── */}
      <Page size="A4" style={S.page}>
        <PageChrome address={headerAddr} />

        <Text style={S.sectionEyebrow}>Section 6</Text>
        <Text style={S.sectionTitle}>Notes, Methodology &amp; Disclaimer</Text>

        {report.notes ? (
          <>
            <Text style={S.subhead}>Agent Notes &amp; Market Insights</Text>
            <View style={S.notesBox}>
              <Text style={S.notesText}>{report.notes}</Text>
            </View>
          </>
        ) : null}

        <Text style={S.subhead}>Methodology</Text>
        <Text style={S.notesText}>
          The estimated market value is derived from a sales-comparison approach, weighted by the proximity,
          recency, and feature similarity of each comparable to the subject property. Where applicable, an
          adjusted price is applied to normalise for material feature differences (floor area, erf size,
          condition, and amenities). Confidence is graded based on the depth of comparable data and the
          consistency of observed pricing.
        </Text>

        <Text style={S.subhead}>About this Report</Text>
        <Text style={S.notesText}>
          This report has been generated by Thina CRM for the agent and recipient named on the cover page.
          It is intended to support an informed pricing conversation between agent and seller, and should
          be read together with a physical property inspection.
        </Text>

        {/* Agent card */}
        <View style={S.agentCard}>
          {agentInfo.photoUrl ? (
            <Image
              src={agentInfo.photoUrl}
              style={{ width: 48, height: 48, borderRadius: 24, marginRight: 14 }}
            />
          ) : (
            <View style={S.agentAvatar}>
              <Text style={S.agentInitials}>{initials(agentName_, agentEmail)}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={S.agentName}>{agentName_ || "Thina CRM Agent"}</Text>
            {agentInfo.jobTitle ? (
              <Text style={S.agentEmail}>
                {agentInfo.jobTitle}
                {agentInfo.agencyName ? `  ·  ${agentInfo.agencyName}` : ""}
              </Text>
            ) : agentInfo.agencyName ? (
              <Text style={S.agentEmail}>{agentInfo.agencyName}</Text>
            ) : null}
            {agentEmail ? <Text style={S.agentEmail}>{agentEmail}</Text> : null}
            {agentInfo.phone ? <Text style={S.agentEmail}>{agentInfo.phone}</Text> : null}
            {agentInfo.ffcNumber ? (
              <Text style={S.agentMeta}>FFC #{agentInfo.ffcNumber}</Text>
            ) : null}
            <Text style={S.agentMeta}>Report generated on {today}</Text>
          </View>
          {agentInfo.agencyLogoUrl ? (
            <Image
              src={agentInfo.agencyLogoUrl}
              style={{ width: 70, height: 40, objectFit: "contain", marginLeft: 12 }}
            />
          ) : null}
        </View>

        <Text style={S.disclaimer}>
          DISCLAIMER — This Comparative Market Analysis (CMA) is not a formal valuation as contemplated by
          the South African Property Valuers Profession Act. It is an estimate of market value based on
          available comparable sales information at the date of preparation, and is intended for guidance
          purposes only. Market conditions may change and actual transaction prices may differ from the
          estimated value. The comparable sales data may be sourced from publicly available records,
          third-party databases, and AI-assisted research, and has not been independently verified. This
          report is prepared for the exclusive use of the named recipient and may not be relied upon by
          third parties. The agent and Thina CRM accept no liability for decisions taken on the basis of
          this report without independent professional advice.
          {"\n\n"}© {new Date().getFullYear()} Thina CRM  ·  Generated {today}
        </Text>
      </Page>
    </Document>
  );
}

// ─── Mini bar chart (View-based, reliable in react-pdf) ──
function PriceChart({
  comps,
  estimated,
  minVal,
  maxVal,
}: {
  comps: CmaComparable[];
  estimated: number;
  minVal: number;
  maxVal: number;
}) {
  const items = comps.slice(0, 5);
  const range = Math.max(maxVal - minVal, 1);
  const heightPx = 90;
  const heightFor = (v: number) => Math.max(4, Math.round(((v - minVal) / range) * heightPx));

  const allBars: Array<{ label: string; sub: string; value: number; color: string; bold?: boolean }> = [
    ...items.map((c, i) => ({
      label: `Comp ${i + 1}`,
      sub: fmtCompact(c.salePrice),
      value: c.salePrice,
      color: C.brand,
    })),
    { label: "Subject", sub: fmtCompact(estimated), value: estimated, color: C.accent, bold: true },
  ];

  return (
    <View style={{ marginTop: 6 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          height: heightPx + 12,
          borderBottomWidth: 0.5,
          borderBottomColor: C.line,
          paddingHorizontal: 4,
        }}
      >
        {allBars.map((b, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center", paddingHorizontal: 4 }}>
            <View
              style={{
                width: "70%",
                height: heightFor(b.value),
                backgroundColor: b.color,
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
              }}
            />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", marginTop: 4 }}>
        {allBars.map((b, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 8,
                color: b.bold ? C.ink : C.text,
                fontFamily: b.bold ? "Helvetica-Bold" : "Helvetica",
              }}
            >
              {b.label}
            </Text>
            <Text style={{ fontSize: 7, color: C.muted, marginTop: 1 }}>{b.sub}</Text>
          </View>
        ))}
      </View>
      <Text style={{ fontSize: 7, color: C.muted, marginTop: 8, textAlign: "center" }}>
        Range: {fmtCompact(minVal)} – {fmtCompact(maxVal)}  ·  Subject estimate highlighted
      </Text>
    </View>
  );
}
