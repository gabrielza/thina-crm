/**
 * Thina CRM — Brand Kit Document Generator
 * Regenerates the Brand Kit .docx with proper content using the unified design system.
 * Run: node scripts/generate-brand-kit.mjs
 */

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType,
  BorderStyle, Footer, Header, ShadingType, convertInchesToTwip,
  LevelFormat, PageBreak,
} from "docx";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const VERSION = "1.0.0";
const DOC_DATE = new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" });

// ─── Design System (identical to generate-spec.mjs) ──────────────────────────

const FONT = "Aptos";

function normal(t) { return new TextRun({ text: t, size: 22, font: FONT }); }
function bold(t) { return new TextRun({ text: t, bold: true, size: 22, font: FONT }); }

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level, spacing: { before: 300, after: 120 } });
}
function h2(text) { return heading(text, HeadingLevel.HEADING_2); }
function h3(text) { return heading(text, HeadingLevel.HEADING_3); }

function para(text) {
  return new Paragraph({ spacing: { after: 100 }, children: [normal(text)] });
}
function emptyPara() {
  return new Paragraph({ spacing: { after: 40 }, children: [] });
}
function bullet(text) {
  return new Paragraph({ spacing: { after: 40 }, bullet: { level: 0 }, children: [normal(text)] });
}
function bulletBold(label, value) {
  return new Paragraph({ spacing: { after: 40 }, bullet: { level: 0 }, children: [bold(label + ": "), normal(value)] });
}

function tableHeader(...cells) {
  return new TableRow({
    tableHeader: true,
    children: cells.map(text =>
      new TableCell({
        shading: { type: ShadingType.CLEAR, fill: "18181B" },
        children: [new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [new TextRun({ text, bold: true, size: 20, font: FONT, color: "FFFFFF" })],
        })],
        width: { size: 100 / cells.length, type: WidthType.PERCENTAGE },
      })
    ),
  });
}

function tableRow(...cells) {
  return new TableRow({
    children: cells.map(text =>
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text, size: 20, font: FONT })],
        })],
      })
    ),
  });
}

function makeTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [tableHeader(...headers), ...rows.map(r => tableRow(...r))],
  });
}

// ─── Brand Kit Content ────────────────────────────────────────────────────────

function buildContent() {
  return [
    // ─── 1. Brand Overview ─────────────────────────────────────────────
    heading("Brand Overview"),
    para('Thina CRM is a purpose-built customer relationship management platform designed exclusively for the South African real estate industry. The name "Thina" (pronounced tee-nah) comes from the Zulu and Xhosa word meaning "us" or "we" — reflecting the platform\'s commitment to collaboration between agencies, agents, and clients.'),
    para("This Brand Kit defines the visual identity, colour palette, typography, and tone of voice that ensure a consistent, professional appearance across all Thina CRM materials."),

    // ─── 2. Logo ───────────────────────────────────────────────────────
    heading("Logo"),

    h2("Primary Wordmark"),
    para("The primary logo is the word THINA CRM set in Aptos Bold, coloured in Indigo 600 (#4F46E5). This wordmark appears on title pages, login screens, and marketing collateral."),
    bulletBold("Typeface", "Aptos Bold"),
    bulletBold("Colour", "Indigo 600 (#4F46E5)"),
    bulletBold("Minimum size", "24 px on screen, 10 pt in print"),

    h2("Logo Usage Guidelines"),
    bullet("Always maintain a clear-space margin of at least 1× the height of the letter 'T' around the wordmark."),
    bullet("Do not rotate, skew, or apply drop shadows to the logo."),
    bullet("On dark backgrounds, use the white version of the wordmark (FFFFFF)."),
    bullet("Do not place the logo on visually busy or low-contrast backgrounds."),

    // ─── 3. Colour Palette ─────────────────────────────────────────────
    heading("Colour Palette"),
    para("The Thina CRM colour system is built on the Zinc neutral scale paired with a single Indigo accent colour. This creates a professional, modern appearance with high contrast and excellent readability."),

    h2("Primary Accent"),
    emptyPara(),
    makeTable(
      ["Swatch", "Name", "Hex", "Usage"],
      [
        ["█ Indigo", "Indigo 600", "#4F46E5", "Buttons, links, active states, accent highlights"],
        ["█ Indigo Light", "Indigo 50", "#EEF2FF", "Hover backgrounds, subtle highlights"],
      ],
    ),
    emptyPara(),

    h2("Neutral Scale (Zinc)"),
    para("All text, backgrounds, and borders use the Zinc palette for consistent neutral tones:"),
    emptyPara(),
    makeTable(
      ["Swatch", "Name", "Hex", "Usage"],
      [
        ["██ Zinc 900", "Zinc 900", "#18181B", "Headings H1, table headers, primary text"],
        ["██ Zinc 800", "Zinc 800", "#27272A", "Headings H2, body text"],
        ["██ Zinc 700", "Zinc 700", "#3F3F46", "Headings H3, secondary text"],
        ["██ Zinc 500", "Zinc 500", "#71717A", "Subtitles, versions, muted labels"],
        ["██ Zinc 400", "Zinc 400", "#A1A1AA", "Headers, footers, captions"],
        ["██ Zinc 300", "Zinc 300", "#D4D4D8", "Borders, dividers"],
        ["██ Zinc 100", "Zinc 100", "#F4F4F5", "Code block backgrounds, shading"],
        ["██ White", "White", "#FFFFFF", "Page backgrounds, table header text"],
      ],
    ),
    emptyPara(),

    h2("Colour Don'ts"),
    bullet("Do not use colours outside the Zinc/Indigo palette in official documents."),
    bullet("Do not reduce opacity of Indigo below 60% for interactive elements."),
    bullet("Do not use pure black (#000000) — always use Zinc 900 (#18181B)."),

    // ─── 4. Typography ────────────────────────────────────────────────
    heading("Typography"),

    h2("Primary Typeface — Aptos"),
    para("Aptos is the primary typeface for all Thina CRM materials. It offers excellent readability on screen and in print, with a modern, clean aesthetic."),
    emptyPara(),
    makeTable(
      ["Element", "Weight", "Size (half-points)", "Colour"],
      [
        ["Document Title", "Bold", "72", "Indigo 600 (#4F46E5)"],
        ["Heading 1", "Bold", "36", "Zinc 900 (#18181B)"],
        ["Heading 2", "Bold", "28", "Zinc 800 (#27272A)"],
        ["Heading 3", "Bold", "24", "Zinc 700 (#3F3F46)"],
        ["Body Text", "Regular", "22", "Zinc 800 (#27272A)"],
        ["Table Header", "Bold", "20", "White (#FFFFFF)"],
        ["Table Cell", "Regular", "20", "Zinc 800 (#27272A)"],
        ["Header / Footer", "Italic", "16", "Zinc 400 (#A1A1AA)"],
      ],
    ),
    emptyPara(),

    h2("Monospace Typeface — Consolas"),
    para("Consolas is used for code blocks, technical identifiers, and file paths."),
    bulletBold("Size", "18 half-points"),
    bulletBold("Background", "Zinc 100 (#F4F4F5)"),

    // ─── 5. Document Layout ───────────────────────────────────────────
    heading("Document Layout"),

    h2("Page Margins"),
    bulletBold("Top / Bottom", '1 inch (2.54 cm)'),
    bulletBold("Left / Right", '1.25 inches (3.175 cm)'),

    h2("Headers & Footers"),
    bulletBold("Header", "Right-aligned, italic, Zinc 400 — e.g. 'Thina CRM — [Document Title]'"),
    bulletBold("Footer", "Centre-aligned, Zinc 400 — 'Thina CRM • Confidential'"),

    h2("Title Page"),
    para("Every Thina CRM document begins with a branded title page:"),
    bullet('"THINA CRM" in Aptos Bold, 72 half-points, Indigo 600, centred'),
    bullet("Document title in 36 half-points, Zinc 500, centred"),
    bullet("Subtitle in 24 half-points, Zinc 500 (when applicable)"),
    bullet("Version number and date in Zinc 700, centred"),
    bullet('Tagline: "Thina" — Zulu/Xhosa for "Us" in italic, Zinc 400'),

    h2("Tables"),
    bullet("Dark header row: Zinc 900 (#18181B) background with white bold text"),
    bullet("Clean rows: no zebra striping, no cell borders"),
    bullet("Full-width tables (100%)"),

    h2("Bullets"),
    bullet("Standard bullet character (•) at level 0"),
    bullet("Open circle (◦) at level 1"),
    bullet("Bold-label bullets for key–value pairs (e.g. 'Field: value')"),

    // ─── 6. Tone of Voice ─────────────────────────────────────────────
    heading("Tone of Voice"),
    para("Thina CRM's written voice is professional, clear, and direct — reflecting the practical needs of South African real estate professionals."),

    h2("Principles"),
    bulletBold("Clarity first", "Use plain language. Avoid jargon unless speaking to a technical audience."),
    bulletBold("Confident", "State features and benefits directly. Avoid hedging ('might', 'could possibly')."),
    bulletBold("Locally rooted", "Reference South African contexts — FICA, POPIA, mandates, show days, sectional titles."),
    bulletBold("Inclusive", 'The name "Thina" means "us" — our tone invites collaboration, never talks down.'),

    h2("Writing Guidelines"),
    bullet("Use active voice: 'Thina CRM tracks your leads' not 'Leads are tracked by the system'."),
    bullet("Capitalise product name as 'Thina CRM' (not 'thina crm' or 'THINA crm')."),
    bullet("Use South African English spelling (colour, centre, organise)."),
    bullet("Keep sentences under 25 words where possible."),

    // ─── 7. Brand Assets ──────────────────────────────────────────────
    heading("Brand Assets"),
    para("Official brand assets are maintained in the repository under docs/Marketing Documents/Logo/ and include:"),
    bullet("Wordmark (PNG, SVG) — light and dark variants"),
    bullet("Favicon set (16×16, 32×32, 180×180)"),
    bullet("Social media banners (1200×630 for Open Graph, 1500×500 for Twitter)"),
    para("Contact the Thina CRM Team for access to additional brand assets or for co-branding approval."),
  ];
}

// ─── Build Document ───────────────────────────────────────────────────────────

function build() {
  const DOC_TITLE = "Brand Kit";
  const SUBTITLE = "Visual identity, colour palette, and brand guidelines";

  return new Document({
    creator: "Thina CRM Team",
    title: `Thina CRM — ${DOC_TITLE}`,
    description: `${DOC_TITLE} — Thina CRM Documentation`,
    styles: {
      default: {
        document: { run: { font: FONT, size: 22 } },
        heading1: {
          run: { font: FONT, size: 36, bold: true, color: "18181B" },
          paragraph: { spacing: { before: 360, after: 160 } },
        },
        heading2: {
          run: { font: FONT, size: 28, bold: true, color: "27272A" },
          paragraph: { spacing: { before: 280, after: 120 } },
        },
        heading3: {
          run: { font: FONT, size: 24, bold: true, color: "3F3F46" },
          paragraph: { spacing: { before: 200, after: 100 } },
        },
      },
    },
    numbering: {
      config: [{
        reference: "thina-bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT },
          { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT },
        ],
      }],
    },
    features: { updateFields: true },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.25),
            right: convertInchesToTwip(1.25),
          },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({
              text: `Thina CRM — ${DOC_TITLE}`,
              italics: true, size: 16, font: FONT, color: "A1A1AA",
            })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: "Thina CRM • Confidential",
              size: 16, font: FONT, color: "A1A1AA",
            })],
          })],
        }),
      },
      children: [
        // Title Page
        new Paragraph({ spacing: { before: 4000 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "THINA CRM", bold: true, size: 72, font: FONT, color: "4F46E5" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: DOC_TITLE, size: 36, font: FONT, color: "52525B" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: SUBTITLE, size: 24, font: FONT, color: "71717A" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: `Version ${VERSION}`, size: 28, font: FONT, color: "71717A" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: DOC_DATE, size: 24, font: FONT, color: "71717A" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 1600 },
          children: [new TextRun({ text: '"Thina" — Zulu/Xhosa for "Us"', italics: true, size: 24, font: FONT, color: "A1A1AA" })],
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // Content
        ...buildContent(),

        // End of Document
        emptyPara(),
        emptyPara(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 600 },
          children: [new TextRun({ text: "— End of Document —", italics: true, size: 22, font: FONT, color: "A1A1AA" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: `Thina CRM v${VERSION} • Generated ${DOC_DATE}`, size: 18, font: FONT, color: "A1A1AA" })],
        }),
      ],
    }],
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const doc = build();
  const buffer = await Packer.toBuffer(doc);
  const outPath = resolve(ROOT, "docs", "Marketing Documents", "Thina_CRM_Brand_Kit.docx");
  writeFileSync(outPath, buffer);
  console.log(`✅ Brand Kit generated: docs/Marketing Documents/Thina_CRM_Brand_Kit.docx`);
}

main().catch(err => { console.error("❌ Failed:", err); process.exit(1); });
