/**
 * Thina CRM — Document Converter & Reformatter
 *
 * Two modes:
 *   node scripts/convert-docs.mjs              — convert .md files to .docx
 *   node scripts/convert-docs.mjs --reformat   — extract content from existing
 *                                                 .docx files and regenerate with
 *                                                 unified Thina design system
 *
 * Design system matches generate-spec.mjs exactly:
 *   Font: Aptos · Headings: Zinc 900/800/700 · Body: Zinc 800
 *   Tables: Dark header (Zinc 900), no zebra stripes · Accent: Indigo 600
 *   Title page: 72pt "THINA CRM" in Indigo · Header/Footer: Zinc 400 italic
 */

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType,
  BorderStyle, Footer, Header, ShadingType, convertInchesToTwip,
  LevelFormat, PageBreak,
} from "docx";
import { readFileSync, writeFileSync, readdirSync, statSync, unlinkSync } from "fs";
import { resolve, dirname, basename, join, relative } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DOCS_DIR = resolve(ROOT, "docs");
const VERSION = "1.0.0";
const DOC_DATE = new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" });

// ═══════════════════════════════════════════════════════════════════════════════
// Unified Design System — matches generate-spec.mjs exactly
// ═══════════════════════════════════════════════════════════════════════════════

const FONT = "Aptos";

function normal(text) {
  return new TextRun({ text, size: 22, font: FONT });
}

function bold(text) {
  return new TextRun({ text, bold: true, size: 22, font: FONT });
}

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level, spacing: { before: 300, after: 120 } });
}

function h2(text) { return heading(text, HeadingLevel.HEADING_2); }
function h3(text) { return heading(text, HeadingLevel.HEADING_3); }

function para(text) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text, size: 22, font: FONT })],
  });
}

function emptyPara() {
  return new Paragraph({ spacing: { after: 40 }, children: [] });
}

function bullet(text) {
  return new Paragraph({
    spacing: { after: 40 },
    bullet: { level: 0 },
    children: [normal(text)],
  });
}

function bulletBold(label, value) {
  return new Paragraph({
    spacing: { after: 40 },
    bullet: { level: 0 },
    children: [bold(label + ": "), normal(value)],
  });
}

function codeBlock(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    shading: { type: ShadingType.CLEAR, fill: "F4F4F5" },
    children: [new TextRun({ text, font: "Consolas", size: 18 })],
  });
}

function tableHeader(...cells) {
  return new TableRow({
    tableHeader: true,
    children: cells.map((text) =>
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
    children: cells.map((text) =>
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
    rows: [tableHeader(...headers), ...rows.map((r) => tableRow(...r))],
  });
}

// ─── Title Page (matches spec generator exactly) ──────────────────────────────

function titlePage(docTitle, subtitle) {
  return [
    new Paragraph({ spacing: { before: 4000 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: "THINA CRM", bold: true, size: 72, font: FONT, color: "4F46E5" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: docTitle, size: 36, font: FONT, color: "52525B" })],
    }),
    ...(subtitle ? [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: subtitle, size: 24, font: FONT, color: "71717A" })],
    })] : []),
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
  ];
}

// ─── End-of-document marker ───────────────────────────────────────────────────

function endOfDocument(docTitle) {
  return [
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
  ];
}

// ─── Build a Document with the unified Thina theme ────────────────────────────

function buildDocument(docTitle, subtitle, contentParagraphs) {
  return new Document({
    creator: "Thina CRM Team",
    title: `Thina CRM — ${docTitle}`,
    description: `${docTitle} — Thina CRM Documentation`,
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
              text: `Thina CRM — ${docTitle}`,
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
        ...titlePage(docTitle, subtitle),
        ...contentParagraphs,
        ...endOfDocument(docTitle),
      ],
    }],
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOCX Content Extractor — walks .docx XML body in document order
// ═══════════════════════════════════════════════════════════════════════════════

function decodeXmlEntities(str) {
  // Decode all levels of XML entity encoding (handles double-encoded entities)
  let s = str, prev;
  do {
    prev = s;
    s = s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
         .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
  } while (s !== prev);
  return s;
}

function findClosingTag(xml, startPos, tagName) {
  const open1 = `<${tagName}>`, open2 = `<${tagName} `;
  const close = `</${tagName}>`;
  let depth = 0, pos = startPos;
  while (pos < xml.length) {
    if (xml.startsWith(open1, pos) || xml.startsWith(open2, pos)) {
      depth++;
      pos += tagName.length + 2;
    } else if (xml.startsWith(close, pos)) {
      depth--;
      if (depth === 0) return pos + close.length;
      pos += close.length;
    } else {
      pos++;
    }
  }
  return xml.length;
}

function parseParagraphXml(pXml) {
  const styleMatch = pXml.match(/<w:pStyle w:val="([^"]+)"/);
  const style = styleMatch ? styleMatch[1] : "";
  const hasNumbering = /<w:numPr>/.test(pXml);

  const parts = [];
  const runRegex = /<w:r[ >][\s\S]*?<\/w:r>/g;
  let rMatch;
  while ((rMatch = runRegex.exec(pXml)) !== null) {
    const rXml = rMatch[0];
    const isBold = /<w:b[\s/>]/.test(rXml);
    const isItalic = /<w:i[\s/>]/.test(rXml);
    const isCode = /Consolas|Courier/.test(rXml);
    const tRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let tMatch;
    while ((tMatch = tRegex.exec(rXml)) !== null) {
      if (tMatch[1]) {
        parts.push({ text: decodeXmlEntities(tMatch[1]), bold: isBold, italic: isItalic, code: isCode });
      }
    }
  }

  const text = parts.map(p => p.text).join("").trim();
  if (!text) return null;

  let type = "paragraph";
  if (style === "Heading1") type = "h1";
  else if (style === "Heading2") type = "h2";
  else if (style === "Heading3") type = "h3";
  else if (hasNumbering) type = "bullet";

  return { type, parts, text };
}

function parseTableXml(tblXml) {
  const rows = [];
  const trRegex = /<w:tr[ >][\s\S]*?<\/w:tr>/g;
  let trMatch;
  while ((trMatch = trRegex.exec(tblXml)) !== null) {
    const cells = [];
    const tcRegex = /<w:tc[ >][\s\S]*?<\/w:tc>/g;
    let tcMatch;
    while ((tcMatch = tcRegex.exec(trMatch[0])) !== null) {
      const texts = [];
      const tRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
      let tMatch;
      while ((tMatch = tRegex.exec(tcMatch[0])) !== null) {
        texts.push(decodeXmlEntities(tMatch[1]));
      }
      cells.push(texts.join(""));
    }
    rows.push(cells);
  }
  return { type: "table", headers: rows[0] || [], rows: rows.slice(1) };
}

async function extractContentFromDocx(docxPath) {
  const AdmZip = require("adm-zip");
  const zip = new AdmZip(docxPath);
  const xml = zip.readAsText("word/document.xml");

  // Get body content
  const bodyMatch = xml.match(/<w:body>([\s\S]*)<\/w:body>/);
  if (!bodyMatch) return [];

  let bodyXml = bodyMatch[1];
  // Remove section properties at the end
  bodyXml = bodyXml.replace(/<w:sectPr[\s\S]*$/, "");

  // Walk top-level elements in document order
  const elements = [];
  let pos = 0;

  while (pos < bodyXml.length) {
    // Skip whitespace
    const wsMatch = bodyXml.substring(pos).match(/^\s+/);
    if (wsMatch) pos += wsMatch[0].length;
    if (pos >= bodyXml.length) break;

    if (bodyXml.startsWith("<w:tbl>", pos) || bodyXml.startsWith("<w:tbl ", pos)) {
      const endPos = findClosingTag(bodyXml, pos, "w:tbl");
      elements.push({ kind: "table", xml: bodyXml.substring(pos, endPos) });
      pos = endPos;
    } else if (bodyXml.startsWith("<w:p>", pos) || bodyXml.startsWith("<w:p ", pos)) {
      const endTag = "</w:p>";
      const endIdx = bodyXml.indexOf(endTag, pos);
      if (endIdx === -1) break;
      const endPos = endIdx + endTag.length;
      elements.push({ kind: "paragraph", xml: bodyXml.substring(pos, endPos) });
      pos = endPos;
    } else {
      pos++;
    }
  }

  // Find the title page boundary (first page break)
  let contentStartIdx = 0;
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].kind === "paragraph" && elements[i].xml.includes('w:type="page"')) {
      contentStartIdx = i + 1;
      break;
    }
  }

  // Process content elements in document order
  const blocks = [];
  for (let i = contentStartIdx; i < elements.length; i++) {
    const elem = elements[i];
    if (elem.kind === "table") {
      blocks.push(parseTableXml(elem.xml));
    } else {
      const parsed = parseParagraphXml(elem.xml);
      if (parsed) blocks.push(parsed);
    }
  }

  // Trim end-of-document markers from the tail
  while (blocks.length > 0) {
    const last = blocks[blocks.length - 1];
    if (last.type === "paragraph" && (
      last.text === "" || last.text.startsWith("— End of Document") ||
      last.text.startsWith("Thina CRM v")
    )) {
      blocks.pop();
    } else break;
  }

  return blocks;
}

// ─── Strip old title page artifacts from content start ────────────────────────

function cleanOldTitleArtifacts(blocks, meta) {
  // The first reformat baked old title page decorations into content.
  // Strip leading decorative lines and duplicate title/subtitle.
  while (blocks.length > 0) {
    const first = blocks[0];
    if (first.type !== "paragraph" && first.type !== "bullet") break;
    // Decorative repeating characters
    if (/^[━─═•·\s]+$/.test(first.text)) { blocks.shift(); continue; }
    // Duplicate title / subtitle (case-insensitive, ignoring XML entity leftovers)
    const t = first.text.toLowerCase().replace(/&amp;/g, "&");
    if (meta.title && t === meta.title.toLowerCase()) { blocks.shift(); continue; }
    if (meta.subtitle && t === meta.subtitle.toLowerCase()) { blocks.shift(); continue; }
    break;
  }
  return blocks;
}

// ─── Render extracted blocks using unified design system ──────────────────────

function renderBlocks(blocks) {
  const paragraphs = [];

  for (const block of blocks) {
    switch (block.type) {
      case "table":
        if (block.headers.length > 0 && block.rows.length > 0) {
          paragraphs.push(emptyPara());
          paragraphs.push(makeTable(block.headers, block.rows));
          paragraphs.push(emptyPara());
        }
        break;

      case "h1":
        paragraphs.push(heading(block.text));
        break;
      case "h2":
        paragraphs.push(h2(block.text));
        break;
      case "h3":
        paragraphs.push(h3(block.text));
        break;

      case "bullet": {
        if (block.parts.length >= 2 && block.parts[0].bold) {
          const label = block.parts[0].text.replace(/:?\s*$/, "").trim();
          const value = block.parts.slice(1).map(p => p.text).join("").replace(/^:\s*/, "").trim();
          if (value) {
            paragraphs.push(bulletBold(label, value));
          } else {
            paragraphs.push(bullet(block.text));
          }
        } else {
          paragraphs.push(bullet(block.text));
        }
        break;
      }

      case "paragraph":
      default: {
        const runs = block.parts.map(p => {
          if (p.code) return new TextRun({ text: p.text, font: "Consolas", size: 18 });
          if (p.bold && p.italic) return new TextRun({ text: p.text, bold: true, italics: true, size: 22, font: FONT });
          if (p.bold) return bold(p.text);
          if (p.italic) return new TextRun({ text: p.text, italics: true, size: 22, font: FONT });
          return normal(p.text);
        });
        paragraphs.push(new Paragraph({ spacing: { after: 100 }, children: runs }));
        break;
      }
    }
  }

  return paragraphs;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Markdown Parser (for .md → .docx conversion)
// ═══════════════════════════════════════════════════════════════════════════════

function parseMarkdown(md) {
  let text = md
    .replace(/\\\[/g, "[").replace(/\\\]/g, "]").replace(/\\\*/g, "*")
    .replace(/\\\#/g, "#").replace(/\\_/g, "_").replace(/\\\-/g, "-")
    .replace(/\\\./g, ".").replace(/\[cite_start\]/g, "")
    .replace(/\[cite:\s*[\d,\s]+\]/g, "").replace(/\[file-tag:[^\]]+\]/g, "");

  const lines = text.split("\n");
  const paragraphs = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (trimmed === "") { i++; continue; }
    if (/^[-*_]{3,}$/.test(trimmed)) { i++; continue; }

    // Code fences
    if (trimmed.startsWith("```")) {
      i++;
      const codeLines = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) { codeLines.push(lines[i]); i++; }
      if (i < lines.length) i++;
      const codeText = codeLines.join("\n").trim();
      if (codeText && !codeText.includes("brand_kit_content") && !codeText.includes("= \"\"\"")) {
        for (const line of codeText.split("\n")) {
          paragraphs.push(codeBlock(line));
        }
      }
      continue;
    }

    // Headings
    const hMatch = trimmed.match(/^(#{1,4})\s+(.+)/);
    if (hMatch) {
      const level = hMatch[1].length;
      if (level === 1) paragraphs.push(heading(hMatch[2]));
      else if (level === 2) paragraphs.push(h2(hMatch[2]));
      else if (level === 3) paragraphs.push(h3(hMatch[2]));
      else paragraphs.push(new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [new TextRun({ text: hMatch[2], bold: true, size: 22, font: FONT })],
      }));
      i++; continue;
    }

    // Table
    if (trimmed.startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const row = lines[i].trim();
        if (!/^\|[\s\-:]+\|$/.test(row.replace(/[^|:\-\s]/g, ""))) {
          const cells = row.split("|").slice(1, -1).map(c => c.trim());
          if (cells.length > 0) rows.push(cells);
        }
        i++;
      }
      if (rows.length >= 2) {
        paragraphs.push(emptyPara());
        paragraphs.push(makeTable(rows[0], rows.slice(1)));
        paragraphs.push(emptyPara());
      }
      continue;
    }

    // Checklist
    if (trimmed.match(/^[-*]\s+\[[ x]\]/)) {
      const checked = trimmed.includes("[x]");
      const content = trimmed.replace(/^[-*]\s+\[[ x]\]\s*/, "");
      const icon = checked ? "☑ " : "☐ ";
      paragraphs.push(new Paragraph({
        spacing: { after: 40 },
        bullet: { level: 0 },
        children: [bold(icon), normal(content)],
      }));
      i++; continue;
    }

    // Bullet
    if (trimmed.match(/^[-*+]\s+/)) {
      const content = trimmed.replace(/^[-*+]\s+/, "");
      // Detect "**Label:** value" pattern
      const bMatch = content.match(/^\*\*([^*]+)\*\*:?\s*(.*)/);
      if (bMatch) {
        paragraphs.push(bulletBold(bMatch[1], bMatch[2]));
      } else {
        paragraphs.push(bullet(content.replace(/\*\*/g, "")));
      }
      i++; continue;
    }

    // Ordered list
    if (trimmed.match(/^\d+\.\s+/)) {
      const content = trimmed.replace(/^\d+\.\s+/, "");
      paragraphs.push(new Paragraph({
        spacing: { after: 40 },
        bullet: { level: 0 },
        children: [normal(content.replace(/\*\*/g, ""))],
      }));
      i++; continue;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      const content = trimmed.replace(/^>\s*/, "").replace(/\*/g, "");
      paragraphs.push(new Paragraph({
        spacing: { before: 120, after: 120 },
        indent: { left: convertInchesToTwip(0.4) },
        border: { left: { style: BorderStyle.SINGLE, size: 12, color: "4F46E5", space: 8 } },
        children: [new TextRun({ text: content, font: FONT, size: 22, italics: true, color: "52525B" })],
      }));
      i++; continue;
    }

    // Regular paragraph — handle inline bold/italic
    const runs = [];
    const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|[^*`]+)/g;
    let m;
    while ((m = regex.exec(trimmed)) !== null) {
      if (m[2]) runs.push(new TextRun({ text: m[2], bold: true, italics: true, font: FONT, size: 22 }));
      else if (m[3]) runs.push(bold(m[3]));
      else if (m[4]) runs.push(new TextRun({ text: m[4], italics: true, font: FONT, size: 22 }));
      else if (m[5]) runs.push(new TextRun({ text: m[5], font: "Consolas", size: 18 }));
      else runs.push(normal(m[0]));
    }
    if (runs.length === 0) runs.push(normal(trimmed));
    paragraphs.push(new Paragraph({ spacing: { after: 100 }, children: runs }));
    i++;
  }

  return paragraphs;
}

// ═══════════════════════════════════════════════════════════════════════════════
// File Discovery & Metadata
// ═══════════════════════════════════════════════════════════════════════════════

const FILE_METADATA = {
  "Thina_CRM_Demo_Guide": {
    title: "Demo Guide",
    subtitle: "A structured walkthrough for presenting Thina CRM to stakeholders",
  },
  "Thina_CRM_Brand_Kit": {
    title: "Brand Kit",
    subtitle: "Visual identity, colour palette, and brand guidelines",
  },
  "Thina_CRM_Marketing_Guide": {
    title: "Marketing & Feature Guide",
    subtitle: "Audience-segmented feature overview for agency principals, agents, and clients",
  },
  "Thina_CRM_Features_and_Data_Model": {
    title: "Features & Data Model",
    subtitle: "Comprehensive feature inventory and complete data model reference",
  },
  "Thina_CRM_Feature_Research": {
    title: "Feature Research — SA Real Estate",
    subtitle: "Competitor analysis and prioritised feature recommendations",
  },
  "Thina_CRM_User_Training_Guide": {
    title: "User Training Guide",
    subtitle: "Step-by-step instructions for every feature in Thina CRM",
  },
};

function findFiles(dir, ext) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory() && entry !== "System Specification") {
      results.push(...findFiles(fullPath, ext));
    } else if (entry.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  const mode = process.argv.includes("--reformat") ? "reformat" : "markdown";

  if (mode === "reformat") {
    // ─── Reformat existing .docx files ──────────────────────────────────
    const docxFiles = findFiles(DOCS_DIR, ".docx");
    console.log(`\n📄 Found ${docxFiles.length} .docx files to reformat:\n`);

    for (const docxPath of docxFiles) {
      const fileName = basename(docxPath, ".docx");
      const relPath = relative(DOCS_DIR, docxPath);
      const meta = FILE_METADATA[fileName] || {
        title: fileName.replace(/[-_]/g, " "),
        subtitle: "",
      };

      console.log(`  Reformatting: ${relPath}`);

      // Extract content from existing .docx
      let blocks = await extractContentFromDocx(docxPath);
      blocks = cleanOldTitleArtifacts(blocks, meta);
      console.log(`    → Extracted ${blocks.length} content blocks`);

      if (blocks.length === 0) {
        console.log(`    ⚠ Skipped (empty content): ${relPath}`);
        continue;
      }

      // Render with unified design system
      const contentParagraphs = renderBlocks(blocks);

      // Build new document
      const doc = buildDocument(meta.title, meta.subtitle, contentParagraphs);

      // Overwrite the original file
      const buffer = await Packer.toBuffer(doc);
      writeFileSync(docxPath, buffer);
      console.log(`  ✅ Reformatted: ${relPath}`);
    }

    console.log(`\n✅ All ${docxFiles.length} documents reformatted with unified Thina design system.\n`);

  } else {
    // ─── Convert .md files to .docx ─────────────────────────────────────
    const mdFiles = findFiles(DOCS_DIR, ".md");
    console.log(`\n📄 Found ${mdFiles.length} Markdown files to convert:\n`);

    for (const mdPath of mdFiles) {
      const fileName = basename(mdPath, ".md");
      const relPath = relative(DOCS_DIR, mdPath);
      const meta = FILE_METADATA[fileName] || {
        title: fileName.replace(/[-_]/g, " "),
        subtitle: "",
      };

      console.log(`  Converting: ${relPath}`);

      const markdown = readFileSync(mdPath, "utf-8");
      const contentParagraphs = parseMarkdown(markdown);

      const doc = buildDocument(meta.title, meta.subtitle, contentParagraphs);

      const outputPath = resolve(dirname(mdPath), fileName.replace(/\s/g, "_") + ".docx");
      const buffer = await Packer.toBuffer(doc);
      writeFileSync(outputPath, buffer);
      console.log(`  ✅ Created: ${relative(DOCS_DIR, outputPath)}`);
    }

    console.log(`\n✅ All ${mdFiles.length} documents converted.\n`);
  }
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
