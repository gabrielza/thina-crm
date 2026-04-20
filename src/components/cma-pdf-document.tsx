"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { CmaReport } from "@/lib/firestore";

// ─── Styles ──────────────────────────────────────────────

const colors = {
  primary: "#4F46E5",     // indigo-600
  primaryLight: "#E0E7FF", // indigo-100
  text: "#18181B",         // zinc-900
  muted: "#71717A",        // zinc-500
  border: "#E4E4E7",       // zinc-200
  white: "#FFFFFF",
  green: "#16A34A",
  amber: "#D97706",
  red: "#DC2626",
  bgLight: "#FAFAFA",
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.5,
  },
  // Cover page
  coverPage: {
    padding: 0,
    fontFamily: "Helvetica",
    color: colors.text,
  },
  coverTop: {
    backgroundColor: colors.primary,
    height: "45%",
    padding: 50,
    justifyContent: "flex-end",
  },
  coverTitle: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
    marginBottom: 8,
  },
  coverSubtitle: {
    fontSize: 16,
    color: colors.primaryLight,
    marginBottom: 4,
  },
  coverBottom: {
    padding: 50,
    flex: 1,
    justifyContent: "space-between",
  },
  coverAddress: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    marginBottom: 4,
  },
  coverSuburb: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 24,
  },
  coverDetailsRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  coverLabel: {
    fontSize: 11,
    color: colors.muted,
    width: 130,
  },
  coverValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  coverFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  coverDate: {
    fontSize: 10,
    color: colors.muted,
  },
  // Section headers
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    marginBottom: 12,
    marginTop: 8,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  subSectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  // Property details grid
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  detailItem: {
    width: "33%",
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 8,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  // Table
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgLight,
  },
  tableCell: {
    fontSize: 9,
  },
  tableCellBold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  tableCellRight: {
    fontSize: 9,
    textAlign: "right",
  },
  // Valuation summary
  valuationBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
  },
  valuationMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  valuationLabel: {
    fontSize: 10,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  valuationAmount: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
  },
  valuationRange: {
    fontSize: 12,
    color: colors.muted,
    textAlign: "right",
  },
  valuationStats: {
    flexDirection: "row",
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: colors.primary,
    paddingTop: 10,
  },
  valuationStat: {
    flex: 1,
  },
  // Badges
  badgeHigh: {
    backgroundColor: "#DCFCE7",
    color: colors.green,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  badgeMedium: {
    backgroundColor: "#FEF3C7",
    color: colors.amber,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  badgeLow: {
    backgroundColor: "#FEE2E2",
    color: colors.red,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  // Adjustment table
  adjustmentRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  adjustmentLabel: {
    flex: 1,
    fontSize: 9,
    color: colors.muted,
  },
  adjustmentSubject: {
    width: 80,
    fontSize: 9,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
  },
  adjustmentComp: {
    width: 80,
    fontSize: 9,
    textAlign: "center",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: colors.muted,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  // Notes
  notesBox: {
    backgroundColor: colors.bgLight,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  notesText: {
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.6,
  },
  // Disclaimer
  disclaimer: {
    fontSize: 7,
    color: colors.muted,
    lineHeight: 1.4,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
});

// ─── Helpers ─────────────────────────────────────────────

function fmtCurrency(value: number): string {
  return `R ${value.toLocaleString("en-ZA")}`;
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function getConfidenceBadgeStyle(level: string) {
  if (level === "high") return styles.badgeHigh;
  if (level === "medium") return styles.badgeMedium;
  return styles.badgeLow;
}

function calculateValueRange(report: CmaReport): { low: number; high: number } {
  const comps = report.comparables.filter((c) => c.salePrice > 0);
  if (comps.length < 2) {
    const pct = 0.10;
    return { low: Math.round(report.estimatedValue * (1 - pct)), high: Math.round(report.estimatedValue * (1 + pct)) };
  }
  const prices = comps.map((c) => c.salePrice);
  const stdDev = Math.sqrt(prices.reduce((sum, p) => sum + Math.pow(p - report.estimatedValue, 2), 0) / prices.length);
  const pct = Math.min(Math.max(stdDev / report.estimatedValue, 0.03), 0.15);
  return {
    low: Math.round(report.estimatedValue * (1 - pct)),
    high: Math.round(report.estimatedValue * (1 + pct)),
  };
}

// ─── Comparable column widths ────────────────────────────

const colW = {
  address: "25%",
  suburb: "15%",
  price: "15%",
  date: "12%",
  beds: "8%",
  baths: "8%",
  floor: "9%",
  dom: "8%",
};

// ─── Document Component ─────────────────────────────────

interface CmaDocumentProps {
  report: CmaReport;
  agentName?: string;
}

export function CmaDocument({ report, agentName }: CmaDocumentProps) {
  const today = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
  const range = calculateValueRange(report);
  const validComps = report.comparables.filter((c) => c.salePrice > 0);

  return (
    <Document title={`CMA - ${report.subjectAddress}`} author={agentName || "Thina CRM"}>
      {/* ─── Cover Page ─── */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverTop}>
          <Text style={styles.coverSubtitle}>THINA CRM</Text>
          <Text style={styles.coverTitle}>Comparative Market Analysis</Text>
          <Text style={styles.coverSubtitle}>Professional Property Valuation Report</Text>
        </View>
        <View style={styles.coverBottom}>
          <View>
            <Text style={styles.coverAddress}>{report.subjectAddress}</Text>
            <Text style={styles.coverSuburb}>{report.subjectSuburb}, {report.subjectCity}</Text>

            <View style={styles.coverDetailsRow}>
              <Text style={styles.coverLabel}>Property Type:</Text>
              <Text style={styles.coverValue}>{report.subjectType.charAt(0).toUpperCase() + report.subjectType.slice(1)}</Text>
            </View>
            <View style={styles.coverDetailsRow}>
              <Text style={styles.coverLabel}>Bedrooms / Bathrooms:</Text>
              <Text style={styles.coverValue}>{report.subjectBedrooms} bed · {report.subjectBathrooms} bath</Text>
            </View>
            <View style={styles.coverDetailsRow}>
              <Text style={styles.coverLabel}>Floor Size:</Text>
              <Text style={styles.coverValue}>{report.subjectFloorSize} m²</Text>
            </View>
            <View style={styles.coverDetailsRow}>
              <Text style={styles.coverLabel}>Erf Size:</Text>
              <Text style={styles.coverValue}>{report.subjectErfSize} m²</Text>
            </View>
            <View style={styles.coverDetailsRow}>
              <Text style={styles.coverLabel}>Estimated Value:</Text>
              <Text style={styles.coverValue}>{fmtCurrency(report.estimatedValue)}</Text>
            </View>
            {report.contactName && (
              <View style={{ ...styles.coverDetailsRow, marginTop: 12 }}>
                <Text style={styles.coverLabel}>Prepared for:</Text>
                <Text style={styles.coverValue}>{report.contactName}</Text>
              </View>
            )}
          </View>
          <View style={styles.coverFooter}>
            <Text style={styles.coverDate}>{agentName ? `Prepared by ${agentName}` : "Prepared by Thina CRM"} · {today}</Text>
            <Text style={styles.coverDate}>Report: {report.title}</Text>
          </View>
        </View>
      </Page>

      {/* ─── Subject Property Page ─── */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>1. Subject Property Details</Text>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Address</Text>
            <Text style={styles.detailValue}>{report.subjectAddress}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Suburb</Text>
            <Text style={styles.detailValue}>{report.subjectSuburb}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>City</Text>
            <Text style={styles.detailValue}>{report.subjectCity}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Property Type</Text>
            <Text style={styles.detailValue}>{report.subjectType.charAt(0).toUpperCase() + report.subjectType.slice(1)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Bedrooms</Text>
            <Text style={styles.detailValue}>{report.subjectBedrooms}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Bathrooms</Text>
            <Text style={styles.detailValue}>{report.subjectBathrooms}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Floor Size</Text>
            <Text style={styles.detailValue}>{report.subjectFloorSize} m²</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Erf Size</Text>
            <Text style={styles.detailValue}>{report.subjectErfSize} m²</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Price per m²</Text>
            <Text style={styles.detailValue}>{fmtCurrency(report.pricePerSqm)}/m²</Text>
          </View>
        </View>

        {/* ─── Valuation Summary ─── */}
        <Text style={styles.sectionTitle}>2. Valuation Summary</Text>

        <View style={styles.valuationBox}>
          <View style={styles.valuationMain}>
            <View>
              <Text style={styles.valuationLabel}>Estimated Market Value</Text>
              <Text style={styles.valuationAmount}>{fmtCurrency(report.estimatedValue)}</Text>
            </View>
            <View>
              <Text style={styles.valuationRange}>Value Range</Text>
              <Text style={styles.valuationRange}>{fmtCurrency(range.low)} – {fmtCurrency(range.high)}</Text>
            </View>
          </View>
          <View style={styles.valuationStats}>
            <View style={styles.valuationStat}>
              <Text style={styles.detailLabel}>Price per m²</Text>
              <Text style={styles.detailValue}>{fmtCurrency(report.pricePerSqm)}</Text>
            </View>
            <View style={styles.valuationStat}>
              <Text style={styles.detailLabel}>Comparables Used</Text>
              <Text style={styles.detailValue}>{validComps.length}</Text>
            </View>
            <View style={styles.valuationStat}>
              <Text style={styles.detailLabel}>Confidence Level</Text>
              <Text style={getConfidenceBadgeStyle(report.confidenceLevel)}>
                {report.confidenceLevel.toUpperCase()}
              </Text>
            </View>
            <View style={styles.valuationStat}>
              <Text style={styles.detailLabel}>Report Status</Text>
              <Text style={styles.detailValue}>{report.status.charAt(0).toUpperCase() + report.status.slice(1)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Thina CRM — Comparative Market Analysis</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* ─── Comparable Sales Page ─── */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>3. Comparable Sales Analysis</Text>
        <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 12 }}>
          The following {validComps.length} comparable properties were analysed to determine the estimated market value.
        </Text>

        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableHeaderCell, width: colW.address }}>Address</Text>
            <Text style={{ ...styles.tableHeaderCell, width: colW.suburb }}>Suburb</Text>
            <Text style={{ ...styles.tableHeaderCell, width: colW.price, textAlign: "right" }}>Sale Price</Text>
            <Text style={{ ...styles.tableHeaderCell, width: colW.date }}>Sale Date</Text>
            <Text style={{ ...styles.tableHeaderCell, width: colW.beds, textAlign: "center" }}>Beds</Text>
            <Text style={{ ...styles.tableHeaderCell, width: colW.baths, textAlign: "center" }}>Baths</Text>
            <Text style={{ ...styles.tableHeaderCell, width: colW.floor, textAlign: "right" }}>Floor m²</Text>
            <Text style={{ ...styles.tableHeaderCell, width: colW.dom, textAlign: "right" }}>DOM</Text>
          </View>
          {/* Table Rows */}
          {report.comparables.map((comp, idx) => (
            <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={{ ...styles.tableCell, width: colW.address }}>{comp.address}</Text>
              <Text style={{ ...styles.tableCell, width: colW.suburb }}>{comp.suburb}</Text>
              <Text style={{ ...styles.tableCellRight, width: colW.price }}>{fmtCurrency(comp.salePrice)}</Text>
              <Text style={{ ...styles.tableCell, width: colW.date }}>{fmtDate(comp.saleDate)}</Text>
              <Text style={{ ...styles.tableCell, width: colW.beds, textAlign: "center" }}>{comp.bedrooms}</Text>
              <Text style={{ ...styles.tableCell, width: colW.baths, textAlign: "center" }}>{comp.bathrooms}</Text>
              <Text style={{ ...styles.tableCellRight, width: colW.floor }}>{comp.floorSize}</Text>
              <Text style={{ ...styles.tableCellRight, width: colW.dom }}>{comp.daysOnMarket}</Text>
            </View>
          ))}
        </View>

        {/* Per-comparable summary statistics */}
        {validComps.length > 0 && (
          <>
            <Text style={styles.subSectionTitle}>Comparable Statistics</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Lowest Sale</Text>
                <Text style={styles.detailValue}>{fmtCurrency(Math.min(...validComps.map((c) => c.salePrice)))}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Highest Sale</Text>
                <Text style={styles.detailValue}>{fmtCurrency(Math.max(...validComps.map((c) => c.salePrice)))}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Average Sale</Text>
                <Text style={styles.detailValue}>{fmtCurrency(Math.round(validComps.reduce((s, c) => s + c.salePrice, 0) / validComps.length))}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Avg Floor Size</Text>
                <Text style={styles.detailValue}>{Math.round(validComps.filter((c) => c.floorSize > 0).reduce((s, c) => s + c.floorSize, 0) / (validComps.filter((c) => c.floorSize > 0).length || 1))} m²</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Avg Price/m²</Text>
                <Text style={styles.detailValue}>{fmtCurrency(Math.round(validComps.filter((c) => c.floorSize > 0).reduce((s, c) => s + c.salePrice / c.floorSize, 0) / (validComps.filter((c) => c.floorSize > 0).length || 1)))}/m²</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Avg Days on Market</Text>
                <Text style={styles.detailValue}>{Math.round(validComps.reduce((s, c) => s + c.daysOnMarket, 0) / validComps.length)}</Text>
              </View>
            </View>
          </>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Thina CRM — Comparative Market Analysis</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* ─── Feature Comparison & Adjustments Page ─── */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>4. Feature Comparison</Text>
        <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 12 }}>
          Side-by-side comparison of the subject property against each comparable sale.
        </Text>

        {/* Adjustment-style comparison table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableHeaderCell, flex: 1 }}>Feature</Text>
            <Text style={{ ...styles.tableHeaderCell, width: 80, textAlign: "center" }}>Subject</Text>
            {report.comparables.slice(0, 5).map((_, i) => (
              <Text key={i} style={{ ...styles.tableHeaderCell, width: 80, textAlign: "center" }}>Comp {i + 1}</Text>
            ))}
          </View>

          {/* Sale Price row */}
          <View style={styles.tableRow}>
            <Text style={{ ...styles.adjustmentLabel, fontFamily: "Helvetica-Bold" }}>Sale Price</Text>
            <Text style={styles.adjustmentSubject}>—</Text>
            {report.comparables.slice(0, 5).map((c, i) => (
              <Text key={i} style={styles.adjustmentComp}>{fmtCurrency(c.salePrice)}</Text>
            ))}
          </View>

          {/* Property Type */}
          <View style={styles.tableRowAlt}>
            <Text style={styles.adjustmentLabel}>Type</Text>
            <Text style={styles.adjustmentSubject}>{report.subjectType}</Text>
            {report.comparables.slice(0, 5).map((c, i) => (
              <Text key={i} style={styles.adjustmentComp}>{c.propertyType || "—"}</Text>
            ))}
          </View>

          {/* Bedrooms */}
          <View style={styles.tableRow}>
            <Text style={styles.adjustmentLabel}>Bedrooms</Text>
            <Text style={styles.adjustmentSubject}>{report.subjectBedrooms}</Text>
            {report.comparables.slice(0, 5).map((c, i) => (
              <Text key={i} style={styles.adjustmentComp}>{c.bedrooms}</Text>
            ))}
          </View>

          {/* Bathrooms */}
          <View style={styles.tableRowAlt}>
            <Text style={styles.adjustmentLabel}>Bathrooms</Text>
            <Text style={styles.adjustmentSubject}>{report.subjectBathrooms}</Text>
            {report.comparables.slice(0, 5).map((c, i) => (
              <Text key={i} style={styles.adjustmentComp}>{c.bathrooms}</Text>
            ))}
          </View>

          {/* Floor Size */}
          <View style={styles.tableRow}>
            <Text style={styles.adjustmentLabel}>Floor Size (m²)</Text>
            <Text style={styles.adjustmentSubject}>{report.subjectFloorSize}</Text>
            {report.comparables.slice(0, 5).map((c, i) => (
              <Text key={i} style={styles.adjustmentComp}>{c.floorSize}</Text>
            ))}
          </View>

          {/* Erf Size */}
          <View style={styles.tableRowAlt}>
            <Text style={styles.adjustmentLabel}>Erf Size (m²)</Text>
            <Text style={styles.adjustmentSubject}>{report.subjectErfSize}</Text>
            {report.comparables.slice(0, 5).map((c, i) => (
              <Text key={i} style={styles.adjustmentComp}>{c.erfSize}</Text>
            ))}
          </View>

          {/* Price/m² */}
          <View style={styles.tableRow}>
            <Text style={{ ...styles.adjustmentLabel, fontFamily: "Helvetica-Bold" }}>Price/m²</Text>
            <Text style={styles.adjustmentSubject}>{fmtCurrency(report.pricePerSqm)}</Text>
            {report.comparables.slice(0, 5).map((c, i) => (
              <Text key={i} style={styles.adjustmentComp}>{c.floorSize > 0 ? fmtCurrency(Math.round(c.salePrice / c.floorSize)) : "—"}</Text>
            ))}
          </View>

          {/* Days on Market */}
          <View style={styles.tableRowAlt}>
            <Text style={styles.adjustmentLabel}>Days on Market</Text>
            <Text style={styles.adjustmentSubject}>—</Text>
            {report.comparables.slice(0, 5).map((c, i) => (
              <Text key={i} style={styles.adjustmentComp}>{c.daysOnMarket}</Text>
            ))}
          </View>
        </View>

        {/* Notes */}
        {report.notes && (
          <>
            <Text style={styles.sectionTitle}>5. Notes & Observations</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{report.notes}</Text>
            </View>
          </>
        )}

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          DISCLAIMER: This Comparative Market Analysis (CMA) is not a formal appraisal or valuation. It is an estimate of market value based on
          recent comparable sales data and is intended as a guide only. The estimated value may differ from a formal valuation conducted by a
          registered property valuer. Market conditions can change rapidly, and the actual selling price of a property may be higher or lower than
          the estimated value. This report is prepared for the exclusive use of the named recipient and should not be relied upon by third parties.
          {"\n\n"}Generated by Thina CRM · {today}
        </Text>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Thina CRM — Comparative Market Analysis</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
