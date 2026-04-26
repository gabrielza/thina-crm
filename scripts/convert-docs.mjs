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
const VERSION = "1.3.6";
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
// v1.0.1 Content Updates — version strings + new feature content
// ═══════════════════════════════════════════════════════════════════════════════

function makeBlock(type, text) {
  return { type, text, parts: [{ text, bold: false, italic: false, code: false }] };
}

function makeBoldBlock(label, value) {
  return {
    type: "bullet",
    text: `${label}: ${value}`,
    parts: [
      { text: `${label}: `, bold: true, italic: false, code: false },
      { text: value, bold: false, italic: false, code: false },
    ],
  };
}

function findBlockIndex(blocks, textIncludes) {
  return blocks.findIndex(b => b.text && b.text.includes(textIncludes));
}

function updateVersionStrings(blocks) {
  return blocks.map(b => {
    if (b.type === "table" || !b.text) return b;
    let changed = false;
    const replacements = [
      [/Version:\s*0\.12\.0/g, "Version: 1.1.0"],
      [/Version:\s*0\.11\.0/g, "Version: 1.1.0"],
      [/Version:\s*1\.0\.0(?!\.\d)/g, "Version: 1.1.0"],
      [/Version:\s*1\.0\.1/g, "Version: 1.1.0"],
      [/\bv0\.12\.0\b/g, "v1.1.0"],
      [/\bv0\.11\.0\b/g, "v1.1.0"],
      [/\bv1\.0\.0(?!\.\d)\b/g, "v1.1.0"],
      [/\bv1\.0\.1\b/g, "v1.1.0"],
    ];
    let newText = b.text;
    for (const [re, rep] of replacements) {
      const t = newText.replace(re, rep);
      if (t !== newText) { newText = t; changed = true; }
    }
    if (!changed) return b;
    const newParts = b.parts.map(p => {
      let t = p.text;
      for (const [re, rep] of replacements) t = t.replace(re, rep);
      return { ...p, text: t };
    });
    return { ...b, text: newText, parts: newParts };
  });
}

function updateFeaturesDoc(blocks) {
  // Add v1.0.1 features after "Customer-Centric Architecture" section or at end
  const v101Section = [
    makeBlock("h2", "v1.0.1 Feature Additions"),
    makeBlock("paragraph", "The following features were added in v1.0.1 to support agent operations, backend API integration, and document management."),
    makeBlock("h3", "Customer-Agent Assignment"),
    makeBlock("paragraph", "Every lead and contact is now assigned to a specific agent. When an agent creates or first interacts with a customer, they are permanently assigned via a lock-on-first-touch mechanism."),
    makeBoldBlock("assignedAgentId", "Firebase Auth UID of the assigned agent"),
    makeBoldBlock("assignedAgentName", "Display name of the assigned agent"),
    makeBoldBlock("assignedAt", "ISO 8601 timestamp of the assignment"),
    makeBlock("paragraph", "These fields are added to both the Lead and Contact data models. An agent badge is displayed on contact and lead cards throughout the UI."),
    makeBlock("h3", "BulkSMS API Integration"),
    makeBlock("paragraph", "Real SMS sending is now wired via the BulkSMS.co.za REST API through a server-side API route."),
    makeBoldBlock("API Route", "/api/sms/send — POST endpoint with token-based authentication"),
    makeBoldBlock("Auth", "BULKSMS_TOKEN_ID and BULKSMS_TOKEN_SECRET environment variables"),
    makeBoldBlock("Features", "Send SMS, delivery status tracking, message history in Firestore"),
    makeBlock("h3", "Inbound Webhook API Route"),
    makeBlock("paragraph", "A secure webhook endpoint for automated lead injection from property portals such as Property24 and Private Property."),
    makeBoldBlock("API Route", "/api/leads/inbound — POST endpoint with HMAC-SHA256 signature verification"),
    makeBoldBlock("Auth", "INBOUND_WEBHOOK_SECRET environment variable for HMAC signing"),
    makeBoldBlock("Flow", "Webhook → signature verification → parse payload → create InboundLead document"),
    makeBlock("h3", "Firebase Storage for Documents"),
    makeBlock("paragraph", "Document uploads are now stored in Firebase Storage with security rules scoped by ownerId. The upload handler supports file type validation, size limits, and automatic metadata tagging. This replaces the previous placeholder URL system."),
    makeBlock("h3", "Pipeline UX Improvements"),
    makeBlock("paragraph", "Pipeline cards on both the lead and transaction Kanban boards now support full click-through navigation. Clicking any card navigates to the corresponding detail page."),
    makeBlock("h3", "Health Check API"),
    makeBoldBlock("API Route", "/api/health — GET endpoint returning { status: 'healthy', timestamp }"),
    makeBlock("h3", "Updated Scale Metrics"),
    makeBlock("paragraph", "16 Firestore collections · 76+ database functions · 26 page routes · 3 API routes · 1,604 seed records · 61 unit tests · 89 E2E tests"),
  ];

  const v110Section = [
    makeBlock("h2", "v1.1.0 Feature Additions"),
    makeBlock("paragraph", "The following features were added in v1.1.0 to deliver AI-powered analytics, advanced buyer matching, and comprehensive compliance tooling."),
    makeBlock("h3", "Gemini AI CMA Research"),
    makeBlock("paragraph", "Comparative Market Analysis reports are now powered by Google Gemini 2.0 Flash with Google Search grounding. The /api/cma/research endpoint accepts a property address and returns AI-generated neighbourhood insights, recent comparable sales, and pricing recommendations."),
    makeBoldBlock("API Route", "/api/cma/research — POST endpoint using @google/genai SDK"),
    makeBoldBlock("Model", "gemini-2.0-flash with Google Search grounding tool"),
    makeBoldBlock("Output", "CMA PDF document with neighbourhood analysis, comparable sales, and pricing recommendation"),
    makeBlock("h3", "Buyer-Match Engine"),
    makeBlock("paragraph", "An algorithmic matching system that pairs buyer requirements with available property listings. Scores are computed across price range, location, bedroom count, property type, and amenity overlap."),
    makeBlock("h3", "Compliance Dashboard"),
    makeBlock("paragraph", "A centralised compliance view that surfaces FICA document expiry, missing mandatory documents, and regulatory checklist status for every active transaction."),
    makeBlock("h3", "Lead ROI Analytics"),
    makeBlock("paragraph", "Source-level ROI reporting across all lead channels. Tracks cost-per-lead, conversion rates, revenue attribution, and ROI percentage per source (Portal, Referral, Walk-in, Digital Ad, Show Day, Social)."),
    makeBlock("h3", "Speed-to-Lead Metrics"),
    makeBlock("paragraph", "Measures response time from lead creation to first agent contact. Dashboard shows average response times, distribution charts, and alerts for leads exceeding SLA thresholds."),
    makeBlock("h3", "Show Day Management"),
    makeBlock("paragraph", "Full show day lifecycle management — create events linked to properties, track attendees via QR code sign-in, capture visitor details, and convert attendees to leads."),
    makeBlock("h3", "Zod 4 Runtime Validation"),
    makeBlock("paragraph", "All Firestore document reads are now validated at runtime using Zod 4.3.6 schemas. Every collection has a corresponding schema ensuring type safety at the database boundary."),
    makeBlock("h3", "Updated Scale Metrics (v1.1.0)"),
    makeBlock("paragraph", "16 Firestore collections · 76+ database functions · 26 page routes · 4 API routes · 1,604 seed records · 83 unit tests · 89 E2E tests · 172 total tests"),
  ];

  // Find the last heading/content and append
  blocks.push(...v101Section);
  blocks.push(...v110Section);

  // ─── v1.2.0 → v1.3.6 rollup ──────────────────────────────────────────
  const v13Section = [
    makeBlock("h2", "v1.2.0 → v1.3.6 Feature Additions"),
    makeBlock("paragraph", "The following features were added across v1.2.0 through v1.3.6, covering production hardening, security sprint, AI improvements, CMA redesign, address autocomplete and the new Agent Profile system."),
    makeBlock("h3", "Production Hardening (v1.2.0)"),
    makeBoldBlock("Server-side auth middleware", "src/middleware.ts gates every protected route on the __session cookie; public exemptions for /login, /showday/*, /api/health, /api/leads/inbound"),
    makeBoldBlock("Rate limiting", "In-memory limiter (later replaced in v1.3.5) on /api/sms/send (20/min), /api/cma/research (10/min), /api/seed (2/min) with X-RateLimit-* response headers"),
    makeBoldBlock("Seed production guard", "/api/seed returns 403 in production unless ALLOW_SEED=true is explicitly set"),
    makeBoldBlock("Error pages", "Root-level error.tsx, not-found.tsx, loading.tsx for clean failure UX"),
    makeBlock("h3", "Code Quality & Observability (v1.3.0)"),
    makeBoldBlock("ESLint enforcement", "Fixed 70+ lint errors across 25 files; removed ignoreDuringBuilds so ESLint blocks bad builds"),
    makeBoldBlock("Security headers", "X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, HSTS preload, Permissions-Policy denying camera/mic/geolocation"),
    makeBoldBlock("Prompt sanitisation", "CMA prompt inputs strip HTML/template chars, clamp numeric ranges, limit string lengths to defeat prompt injection"),
    makeBoldBlock("Sentry", "Client + server + global-error.tsx boundary integrated via @sentry/nextjs"),
    makeBlock("h3", "Auth Stability (v1.3.1)"),
    makeBlock("paragraph", "Fixed page-navigation logout: sign-in helpers now set the __session cookie synchronously before returning; switched to onIdTokenChanged so the cookie stays alive on automatic ~55-minute Firebase token refresh; conditional Secure cookie flag for HTTPS only."),
    makeBlock("h3", "CMA Reliability (v1.3.2 → v1.3.3)"),
    makeBoldBlock("Crash fix", "Replaced eager <PDFDownloadLink/> (one PDF blob per row, broke under React 19 / Next 15) with on-click downloadCmaPdf() helper using dynamic pdf().toBlob() + anchor click + URL cleanup"),
    makeBoldBlock("Layout fix", "Merged Value Range column into Estimated Value cell (10→9 cols); whitespace-nowrap on actions to stop right-side truncation in the max-w-6xl container"),
    makeBlock("h3", "Address Autocomplete (v1.3.4 — R-27)"),
    makeBlock("paragraph", "New <AddressAutocomplete /> component wrapping Google Places Autocomplete (New) Web Component, restricted to ZA addresses. Used on the Properties form, the CMA Subject Property form, and each Comparable row. Captures placeId, lat, lng and formattedAddress alongside street/suburb/city."),
    makeBoldBlock("API Route", "/api/places/resolve — server-proxied Place Details using GOOGLE_MAPS_SERVER_KEY, results cached in placesCache Firestore collection (30-day TTL)"),
    makeBoldBlock("Gemini grounding", "Subject coordinates passed into /api/cma/research so Gemini anchors comparables to a precise location, not just a typed suburb name"),
    makeBoldBlock("CSP", "Updated to allow maps.googleapis.com + maps.gstatic.com on script-src and connect-src"),
    makeBlock("h3", "Security Sprint (v1.3.5)"),
    makeBoldBlock("F-01 Distributed rate limiter", "src/lib/rate-limit.ts now uses adminDb.runTransaction against a rateLimits collection with TTL auto-expiry on expiresAt; replaces the in-memory limiter that did not span App Hosting instances"),
    makeBoldBlock("F-02 CSP enforcing", "Content-Security-Policy flipped from Report-Only to enforcing; script-src restricted to 'self' + Google identity / Maps; 'unsafe-inline' retained for Next.js 15 streaming hydration scripts (nonce-based hardening on backlog)"),
    makeBoldBlock("F-05 Webhook rate limit", "/api/leads/inbound now reuses the F-01 limiter keyed by X-Webhook-Source (60/min)"),
    makeBoldBlock("Gemini hardening", "Friendly error mapping for quota / overload / configuration errors; removed responseSchema/responseMimeType because the googleSearch grounding tool is incompatible with structured output"),
    makeBlock("h3", "CMA PDF Redesign (v1.3.5)"),
    makeBlock("paragraph", "Full redesign of the CMA PDF: branded cover with hero address card; executive summary with KPI tiles + value-range bar; subject property tearsheet; per-comparable detailed cards; side-by-side comparison matrix; View-based price distribution chart (replaces fragile SVG charts); three-tier pricing recommendation (suggested list / target sale / walk-away floor); marketing recommendations; methodology; agent contact card. Download function hardened with try/catch + alert()."),
    makeBlock("h3", "Agent Profile System (v1.3.6 — R-41 MVP)"),
    makeBlock("paragraph", "New agentProfiles Firestore collection (17 total), keyed by Firebase Auth uid. Per-user /settings/profile page with personal details, agency, EAAB / FFC compliance, branding (profile photo + agency logo upload to Firebase Storage at agentProfiles/{uid}/), brand primary + accent colours, signature block, and web/social links."),
    makeBoldBlock("Hook", "useAgentProfile() loads/caches the current user's profile and exposes a save() helper"),
    makeBoldBlock("CMA PDF integration", "Cover 'Prepared By' shows job title + agency + email + phone; end-of-report agent card shows photo (or initials avatar fallback), agency logo, FFC #, full contact details"),
    makeBoldBlock("Historical integrity", "Each saved CMA snapshots agentSnapshot { agentId, agentName, agentEmail, agentPhone, agencyName, photoUrl, agencyLogoUrl, ffcNumber } so historical reports keep their preparer details even if the live profile changes"),
    makeBoldBlock("Security", "agentProfiles/{uid} — read by any signed-in user (so colleagues can see each other's contact card), write by owner only (request.auth.uid == uid && request.resource.data.uid == uid)"),
    makeBlock("h3", "Updated Scale Metrics (v1.3.6)"),
    makeBlock("paragraph", "17 Firestore collections · 80+ database functions · 32 page routes (incl. /settings/profile) · 6 API routes (health, sms/send, leads/inbound, cma/research, places/resolve, seed) · 1,604+ seed records · 126 unit tests · 89 E2E tests · 215 total tests"),
  ];
  blocks.push(...v13Section);
  return blocks;
}

function updateTrainingGuide(blocks) {
  const newSections = [
    makeBlock("h1", "v1.0.1 — New Feature Training"),
    makeBlock("h2", "Agent Assignment"),
    makeBlock("paragraph", "Every lead and contact in Thina CRM is now assigned to a specific agent. This ensures accountability and prevents leads from falling through the cracks."),
    makeBlock("h3", "How It Works"),
    makeBlock("bullet", "When you create a new lead or contact, you are automatically assigned as the owner."),
    makeBlock("bullet", "Your name and avatar appear as an 'Agent Badge' on each lead/contact card."),
    makeBlock("bullet", "Assignment is permanent (lock-on-first-touch) — the first agent to engage with a customer owns the relationship."),
    makeBlock("bullet", "You can view all your assigned leads and contacts from the respective list pages."),
    makeBlock("h2", "Document Upload with Firebase Storage"),
    makeBlock("paragraph", "The Document Vault now supports real file uploads powered by Firebase Storage."),
    makeBlock("h3", "How to Upload a Document"),
    makeBlock("bullet", "Navigate to Documents from the sidebar (under Transactions)."),
    makeBlock("bullet", "Click the 'Upload Document' button to open the upload sheet."),
    makeBlock("bullet", "Select the document category (FICA, OTP, Mandate, Bond, or Other)."),
    makeBlock("bullet", "Choose a file from your device. Supported types: PDF, JPEG, PNG, DOCX."),
    makeBlock("bullet", "Click 'Upload' — the file is securely stored in Firebase Storage and linked to your account."),
    makeBlock("bullet", "Uploaded documents appear in the Document Vault with category tags and timestamps."),
    makeBlock("h2", "Messaging — Real SMS via BulkSMS"),
    makeBlock("paragraph", "The Messaging page now sends real SMS messages through the BulkSMS.co.za API."),
    makeBlock("h3", "How to Send an SMS"),
    makeBlock("bullet", "Navigate to Messaging from the sidebar (under Pipeline)."),
    makeBlock("bullet", "Click 'Compose Message' to open the compose sheet."),
    makeBlock("bullet", "Select a recipient or enter a mobile number (South African format: +27...)."),
    makeBlock("bullet", "Type your message and click 'Send'."),
    makeBlock("bullet", "The message is sent via the BulkSMS API. Delivery status updates automatically."),
    makeBlock("bullet", "All sent messages are saved in the SMS history with delivery status indicators."),
    makeBlock("h2", "Inbound Lead Webhook"),
    makeBlock("paragraph", "Leads from property portals like Property24 and Private Property can now be injected automatically via a secure webhook endpoint. Contact your system administrator to configure the webhook URL and HMAC secret for your portal account."),
    makeBlock("h2", "Pipeline Card Navigation"),
    makeBlock("paragraph", "You can now click on any card on the Pipeline Board or Transaction Pipeline to navigate directly to the lead or transaction detail page. Previously, cards were display-only."),
  ];

  const v110Sections = [
    makeBlock("h1", "v1.1.0 — New Feature Training"),
    makeBlock("h2", "Gemini AI CMA Research"),
    makeBlock("paragraph", "Thina CRM now uses Google Gemini AI to generate Comparative Market Analysis reports with live market data."),
    makeBlock("h3", "How to Generate a CMA Report"),
    makeBlock("bullet", "Navigate to CMA from the sidebar."),
    makeBlock("bullet", "Enter the property address you want to analyse."),
    makeBlock("bullet", "Click 'Generate CMA' — the AI researches comparable sales, neighbourhood data, and market trends."),
    makeBlock("bullet", "Review the generated report with neighbourhood insights, comparable sales table, and pricing recommendation."),
    makeBlock("bullet", "Download the CMA as a PDF to share with clients."),
    makeBlock("h2", "Buyer-Match Engine"),
    makeBlock("paragraph", "The Buyer Match page algorithmically pairs buyer requirements with available property listings."),
    makeBlock("h3", "How to Use Buyer Match"),
    makeBlock("bullet", "Navigate to Buyer Match from the sidebar."),
    makeBlock("bullet", "The system automatically scores all buyers against all active listings."),
    makeBlock("bullet", "Match scores are computed across price range, location, bedrooms, property type, and amenities."),
    makeBlock("bullet", "Click any match to view the detailed breakdown and contact the buyer."),
    makeBlock("h2", "Compliance Dashboard"),
    makeBlock("paragraph", "The Compliance page provides a centralised view of FICA and regulatory status across all transactions."),
    makeBlock("h3", "How to Use Compliance"),
    makeBlock("bullet", "Navigate to Compliance from the sidebar."),
    makeBlock("bullet", "Review FICA document expiry dates and missing mandatory documents."),
    makeBlock("bullet", "Check regulatory checklist status for each active transaction."),
    makeBlock("bullet", "Address any flagged items before they become compliance issues."),
    makeBlock("h2", "Lead ROI Analytics"),
    makeBlock("paragraph", "The Lead ROI page shows return on investment metrics for each lead source."),
    makeBlock("bullet", "Navigate to Lead ROI from the sidebar."),
    makeBlock("bullet", "View cost-per-lead, conversion rates, and revenue attribution per source."),
    makeBlock("bullet", "Compare ROI across Portal, Referral, Walk-in, Digital Ad, Show Day, and Social channels."),
    makeBlock("h2", "Speed-to-Lead Metrics"),
    makeBlock("paragraph", "The Speed to Lead page measures how quickly agents respond to new leads."),
    makeBlock("bullet", "Navigate to Speed to Lead from the sidebar."),
    makeBlock("bullet", "View average response times and distribution charts."),
    makeBlock("bullet", "Monitor SLA threshold alerts for leads awaiting first contact."),
  ];

  blocks.push(...newSections);
  blocks.push(...v110Sections);

  // ─── v1.3.x training additions ───────────────────────────────────────
  const v13Training = [
    makeBlock("h1", "v1.3.x — New Feature Training"),
    makeBlock("h2", "Setting Up Your Agent Profile (v1.3.6)"),
    makeBlock("paragraph", "Your Agent Profile drives the branding on every CMA report and document Thina CRM produces for your clients. Set it up once and your details flow through automatically."),
    makeBlock("h3", "How to Complete Your Profile"),
    makeBlock("bullet", "Click the new 'Settings' group in the sidebar, then choose 'Agent Profile'."),
    makeBlock("bullet", "Fill in Personal Details: first name, last name, display name, phone, WhatsApp, job title, short bio."),
    makeBlock("bullet", "Fill in Agency: agency name, branch, company registration number, VAT number."),
    makeBlock("bullet", "Fill in EAAB / FFC Compliance: FFC number, FFC expiry date, EAAB registration number — these print on every CMA."),
    makeBlock("bullet", "Upload Branding: a profile photo and your agency logo (max 2MB each, PNG/JPEG). They are stored in Firebase Storage scoped to your account."),
    makeBlock("bullet", "Set your brand primary and accent colours and your email signature block."),
    makeBlock("bullet", "Add Web & Social links: website, LinkedIn, Facebook, Instagram handle."),
    makeBlock("bullet", "Click Save. Your profile photo and agency logo will now appear on the cover and the agent card of every CMA PDF you download."),
    makeBlock("h2", "Address Autocomplete (v1.3.4)"),
    makeBlock("paragraph", "The Properties form, the CMA Subject Property form and each CMA Comparable row now use Google Places autocomplete. Start typing a South African address and pick the right one from the dropdown — the system captures the full formatted address, suburb, city and exact GPS coordinates automatically."),
    makeBlock("bullet", "For CMAs, the captured coordinates are passed to the Gemini AI so it can find truly local comparables instead of guessing from the suburb name."),
    makeBlock("bullet", "All Place Details lookups are cached for 30 days, so re-using the same address is instant and free."),
    makeBlock("h2", "New CMA PDF Layout (v1.3.5)"),
    makeBlock("paragraph", "The CMA PDF has been completely redesigned. When you click 'Download PDF' on any CMA report you now get:"),
    makeBlock("bullet", "A branded cover page with the subject address and your name/agency."),
    makeBlock("bullet", "An executive summary with KPI tiles and a visual value-range bar."),
    makeBlock("bullet", "A subject property tearsheet showing all subject details on one page."),
    makeBlock("bullet", "Detailed per-comparable cards (one per comparable sale)."),
    makeBlock("bullet", "A side-by-side comparison matrix and a price distribution chart."),
    makeBlock("bullet", "A three-tier pricing strategy: suggested list price, target sale price, walk-away floor."),
    makeBlock("bullet", "Your full agent contact card at the end — with profile photo, agency logo, FFC# and contact details from your Agent Profile."),
    makeBlock("h2", "Better Login Stability (v1.3.1)"),
    makeBlock("paragraph", "You should no longer be unexpectedly logged out when navigating between pages. The system now keeps your session alive even when Firebase rotates your authentication token in the background (every ~55 minutes)."),
  ];
  blocks.push(...v13Training);
  return blocks;
}

function updateMarketingGuide(blocks) {
  const newSections = [
    makeBlock("h1", "v1.0.1 — New Capabilities"),
    makeBlock("paragraph", "The following capabilities have been added in v1.0.1, moving from 'planned' to 'live' status."),
    makeBlock("h2", "Now Live: BulkSMS API Integration"),
    makeBlock("paragraph", "Thina CRM now sends real SMS messages through the BulkSMS.co.za API — South Africa's leading SMS gateway. Agents can compose and send SMS directly from the Messaging page, with delivery status tracking and full message history."),
    makeBlock("h2", "Now Live: Automated Portal Lead Injection"),
    makeBlock("paragraph", "Property portal leads from Property24 and Private Property are now injected automatically via a secure webhook endpoint with HMAC-SHA256 signature verification. No more manually copying leads from emails — they appear instantly in the Inbound Leads queue for review and acceptance."),
    makeBlock("h2", "Now Live: Customer-Agent Assignment"),
    makeBlock("paragraph", "Every lead and contact is now assigned to a specific agent with lock-on-first-touch ownership. Agent badges appear on cards throughout the system, ensuring clear accountability and preventing leads from falling through the cracks."),
    makeBlock("h2", "Now Live: Firebase Storage Document Vault"),
    makeBlock("paragraph", "The Document Vault now supports real file uploads to Firebase Storage with security rules scoped by agent. Upload FICA documents, OTPs, mandates, and bond applications with automatic categorisation and metadata tagging."),
    makeBlock("h2", "Now Live: Pipeline Click-Through"),
    makeBlock("paragraph", "Pipeline board cards are now fully interactive — click any lead or transaction card to navigate directly to its detail page for faster workflow."),
    makeBlock("h2", "Updated Platform Summary"),
  ];

  // Add updated summary table
  newSections.push({
    type: "table",
    headers: ["Metric", "Value"],
    rows: [
      ["Firestore Collections", "16"],
      ["Database Functions", "76+"],
      ["Page Routes", "26"],
      ["API Routes", "4 (health, sms/send, leads/inbound, cma/research)"],
      ["Seed Records", "1,604"],
      ["Unit Tests", "83"],
      ["E2E Tests", "89"],
      ["Total Tests", "172"],
    ],
  });

  const v110Sections = [
    makeBlock("h1", "v1.1.0 — New Capabilities"),
    makeBlock("paragraph", "The following capabilities have been added in v1.1.0, delivering AI-powered analytics and advanced operational tooling."),
    makeBlock("h2", "Now Live: Gemini AI CMA Research"),
    makeBlock("paragraph", "Thina CRM now generates Comparative Market Analysis reports powered by Google Gemini 2.0 Flash with live Google Search grounding. Agents enter a property address and receive AI-researched neighbourhood insights, comparable sales data, and pricing recommendations — delivered as a downloadable PDF."),
    makeBlock("h2", "Now Live: Buyer-Match Engine"),
    makeBlock("paragraph", "An algorithmic matching system pairs buyer requirements with available listings. Match scores are computed across price, location, bedrooms, property type, and amenities — helping agents connect the right buyer to the right property instantly."),
    makeBlock("h2", "Now Live: Compliance Dashboard"),
    makeBlock("paragraph", "A centralised compliance view surfaces FICA expiry, missing mandatory documents, and regulatory checklist status. Every active transaction is monitored for compliance readiness."),
    makeBlock("h2", "Now Live: Lead ROI Analytics"),
    makeBlock("paragraph", "Source-level ROI reporting tracks cost-per-lead, conversion rates, and revenue attribution across Portal, Referral, Walk-in, Digital Ad, Show Day, and Social channels. Principals can instantly see which sources deliver the best return."),
    makeBlock("h2", "Now Live: Speed-to-Lead Metrics"),
    makeBlock("paragraph", "Response time measurement from lead creation to first agent contact, with average response times, distribution analysis, and SLA breach alerts."),
    makeBlock("h2", "Now Live: Show Day Management"),
    makeBlock("paragraph", "Full show day lifecycle — create events, link to properties, track attendees via QR code sign-in, and convert visitors to leads."),
    makeBlock("h2", "Now Live: Zod 4 Runtime Validation"),
    makeBlock("paragraph", "All Firestore document reads are validated at runtime with Zod 4.3.6 schemas, ensuring type safety at the database boundary."),
  ];

  blocks.push(...newSections);
  blocks.push(...v110Sections);

  // ─── v1.3.x marketing additions ──────────────────────────────────────
  const v13Marketing = [
    makeBlock("h1", "v1.3.x — New Capabilities"),
    makeBlock("paragraph", "The following capabilities have shipped across v1.2.0 through v1.3.6."),
    makeBlock("h2", "Now Live: Agent Profile & Branded CMAs (v1.3.6)"),
    makeBlock("paragraph", "Each agent now has a personal profile in Thina CRM — personal details, agency, EAAB FFC compliance, profile photo, agency logo, brand colours and signature block. These details flow automatically onto every CMA PDF your team produces, so every report goes out professionally branded with the correct preparer's photo, contact details and FFC number. CMAs even snapshot the agent's details at the time of saving so historical reports stay accurate."),
    makeBlock("h2", "Now Live: Address Autocomplete (v1.3.4)"),
    makeBlock("paragraph", "Property addresses on the Properties form and on every CMA (subject + each comparable) now use Google Places autocomplete restricted to South Africa. Agents type, pick, and the system captures the full formatted address plus precise GPS coordinates. Subject coordinates are passed to the AI so generated comparables are anchored on the real location — not a typed suburb name."),
    makeBlock("h2", "Now Live: Redesigned CMA PDF (v1.3.5)"),
    makeBlock("paragraph", "A complete visual redesign of the Comparative Market Analysis PDF: branded cover, executive summary with KPI tiles and value-range bar, subject tearsheet, per-comparable detailed cards, side-by-side comparison matrix, price distribution chart, three-tier pricing strategy (suggested list / target sale / walk-away floor), marketing recommendations and a rich agent contact card. The output stands up to anything the big franchises produce."),
    makeBlock("h2", "Now Live: Distributed Rate Limiting & Enforcing CSP (v1.3.5)"),
    makeBlock("paragraph", "Rate limits on SMS, CMA, seed and webhook endpoints are now enforced across every Firebase App Hosting instance via a Firestore-backed limiter with TTL auto-expiry. The Content-Security-Policy is now in enforcing mode, blocking any unauthorised script source. The independent security audit rates the platform at ~9.0 / 10."),
    makeBlock("h2", "Now Live: Production Hardening & Observability (v1.2.0 → v1.3.0)"),
    makeBlock("paragraph", "Server-side auth middleware on every protected route, root-level error / not-found / loading pages, hardened security headers (X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy), CMA prompt sanitisation against AI prompt injection, full Sentry error tracking, and ESLint enforcement on every build."),
    makeBlock("h2", "Updated Platform Summary (v1.3.6)"),
  ];
  v13Marketing.push({
    type: "table",
    headers: ["Metric", "Value"],
    rows: [
      ["Firestore Collections", "17 (incl. agentProfiles, placesCache, rateLimits)"],
      ["Database Functions", "80+"],
      ["Page Routes", "32 (incl. /settings/profile)"],
      ["API Routes", "6 (health, sms/send, leads/inbound, cma/research, places/resolve, seed)"],
      ["Seed Records", "1,604+"],
      ["Unit Tests", "126"],
      ["E2E Tests", "89"],
      ["Total Tests", "215"],
      ["Security Rating", "~9.0 / 10 (post-sprint)"],
    ],
  });
  blocks.push(...v13Marketing);
  return blocks;
}

function updateDemoGuide(blocks) {
  const newSections = [
    makeBlock("h1", "v1.0.1 — New Demo Talking Points"),
    makeBlock("paragraph", "The following features are new in v1.0.1. Add these to your demo flow."),
    makeBlock("h2", "Agent Assignment Badge"),
    makeBlock("paragraph", "Show the agent badge on any lead or contact card. Say: 'Every lead is automatically assigned to the agent who first engages. This ensures accountability — no leads fall through the cracks.'"),
    makeBlock("h2", "Real SMS Sending"),
    makeBlock("paragraph", "Navigate to Messaging and compose a real SMS. Say: 'Thina integrates directly with BulkSMS.co.za, South Africa's leading SMS gateway. Agents can send SMS from the CRM and track delivery status in real time.'"),
    makeBlock("bullet", "Tip: For a live demo, send a test SMS to your own phone and show the delivery confirmation."),
    makeBlock("h2", "Document Upload"),
    makeBlock("paragraph", "Navigate to Documents and show the upload flow. Say: 'All transaction documents — FICA, OTPs, mandates, bond applications — can be uploaded and categorised directly in the CRM. Files are stored securely in Firebase Storage with per-agent access control.'"),
    makeBlock("h2", "Pipeline Click-Through"),
    makeBlock("paragraph", "On the Pipeline Board, click a lead card to navigate to the detail page. Say: 'Agents can click any card on the pipeline board to jump straight to the detail page. No more searching — one click from overview to action.'"),
    makeBlock("h2", "Inbound Webhook (v1.0.1)"),
    makeBlock("paragraph", "If demoing to a technical audience, mention: 'Property24 and Private Property leads can now be injected automatically via a secure webhook with HMAC-SHA256 verification. Leads appear in the Inbound queue within seconds of the portal notification.'"),
  ];

  const v110Sections = [
    makeBlock("h1", "v1.1.0 — New Demo Talking Points"),
    makeBlock("paragraph", "The following features are new in v1.1.0. Add these to your demo flow."),
    makeBlock("h2", "Gemini AI CMA Research"),
    makeBlock("paragraph", "Navigate to CMA and generate a report. Say: 'Thina now uses Google Gemini AI with live search grounding to generate Comparative Market Analysis reports. Enter an address and the AI researches comparable sales, neighbourhood data, and generates a pricing recommendation — all in seconds.'"),
    makeBlock("bullet", "Tip: Show the PDF download with AI-generated neighbourhood insights and comparable sales table."),
    makeBlock("h2", "Buyer-Match Engine"),
    makeBlock("paragraph", "Navigate to Buyer Match. Say: 'Our algorithmic matching engine scores buyers against listings across price, location, bedrooms, property type, and amenities. Agents instantly see which buyers match which properties.'"),
    makeBlock("h2", "Compliance Dashboard"),
    makeBlock("paragraph", "Navigate to Compliance. Say: 'The compliance dashboard surfaces FICA expiry, missing documents, and regulatory checklists — ensuring every transaction stays audit-ready.'"),
    makeBlock("h2", "Lead ROI Analytics"),
    makeBlock("paragraph", "Navigate to Lead ROI. Say: 'Principals can now see exactly which lead sources deliver the best return on investment — cost-per-lead, conversion rates, and revenue attribution broken down by source.'"),
    makeBlock("h2", "Speed-to-Lead Metrics"),
    makeBlock("paragraph", "Navigate to Speed to Lead. Say: 'We measure response time from lead creation to first contact. Agents and managers can see average response times and SLA breach alerts.'"),
  ];

  blocks.push(...newSections);
  blocks.push(...v110Sections);

  // ─── v1.3.x demo talking points ──────────────────────────────────────
  const v13Demo = [
    makeBlock("h1", "v1.3.x — New Demo Talking Points"),
    makeBlock("h2", "Agent Profile & Branded CMAs (v1.3.6)"),
    makeBlock("paragraph", "Open Settings → Agent Profile and show the form (photo + agency logo + FFC#). Then download any CMA PDF and flip to the cover and the last page. Say: 'Every agent has their own branded profile — photo, agency logo, FFC number, contact details. It flows automatically onto every CMA we produce. And because we snapshot the agent's details onto each saved report, historical CMAs always show the correct preparer — even if the agent later updates their profile or leaves.'"),
    makeBlock("bullet", "Tip: have a demo agent profile fully populated before the demo so the PDF looks polished."),
    makeBlock("h2", "Address Autocomplete (v1.3.4)"),
    makeBlock("paragraph", "On the Properties form or the CMA form, type a partial address and pick from the dropdown. Say: 'We use Google Places autocomplete restricted to South Africa, and we capture the exact GPS coordinates. For CMAs, those coordinates are passed to the AI so the comparables it researches are properly local — not just based on a typed suburb name.'"),
    makeBlock("h2", "The New CMA PDF (v1.3.5)"),
    makeBlock("paragraph", "Open any CMA report and click 'Download PDF'. Walk through it page by page: cover, executive summary with KPI tiles and value-range bar, subject tearsheet, per-comparable detailed cards, comparison matrix, price distribution chart, three-tier pricing strategy, agent contact card. Say: 'This output is the equal of anything the major franchises produce — it gives our agents a real edge in winning mandates.'"),
    makeBlock("h2", "Enterprise-Grade Security (v1.3.5)"),
    makeBlock("paragraph", "For technical / IT-buyer audiences, mention: 'We've completed a full security sprint — distributed Firestore-backed rate limiting that scales across all instances, Content-Security-Policy in enforcing mode, HMAC-signed webhooks, and full Sentry observability. The independent audit rates us at 9.0 out of 10.'"),
    makeBlock("h2", "AI-Grounded CMA Research"),
    makeBlock("paragraph", "On the CMA page, click 'Research with Gemini'. Say: 'We use Google Gemini with live Search grounding, and now the AI is anchored on the exact GPS coordinates of the subject property — so the comparables it surfaces are genuinely nearby and recent.'"),
  ];
  blocks.push(...v13Demo);
  return blocks;
}

function updateFeatureResearch(blocks) {
  // Update checklist items from ❌ to ✅ for features now implemented
  return blocks.map(b => {
    if (!b.text) return b;
    let newText = b.text;
    const updates = [
      ["❌ Open house digital sign-in (QR code → form → auto-create lead)", "✅ Open house digital sign-in (QR code → form → auto-create lead) — implemented v0.11.0"],
      ["❌ QR code generation for signage (scan → lead form)", "✅ QR code generation for signage — Show Day QR codes implemented v0.11.0"],
    ];
    for (const [old, rep] of updates) {
      if (newText.includes(old)) {
        newText = newText.replace(old, rep);
        b.parts = [{ text: newText, bold: false, italic: false, code: false }];
      }
    }
    b.text = newText;
    return b;
  });
}

function applyContentUpdates(fileName, blocks) {
  // 1. Update version strings in all docs
  blocks = updateVersionStrings(blocks);

  // 2. File-specific content additions
  switch (fileName) {
    case "Thina_CRM_Features_and_Data_Model":
      return updateFeaturesDoc(blocks);
    case "Thina_CRM_User_Training_Guide":
      return updateTrainingGuide(blocks);
    case "Thina_CRM_Marketing_Guide":
      return updateMarketingGuide(blocks);
    case "Thina_CRM_Demo_Guide":
      return updateDemoGuide(blocks);
    case "Thina_CRM_Feature_Research":
      return updateFeatureResearch(blocks);
    default:
      return blocks;
  }
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
  const mode = process.argv.includes("--reformat") ? "reformat"
    : process.argv.includes("--rebuild") ? "rebuild"
    : "markdown";

  if (mode === "rebuild") {
    // ─── Rebuild docs from scratch using update functions ────────────────
    // This mode does NOT read existing .docx files. It generates fresh
    // documents containing only the v1.0.1 + v1.1.0 content sections.
    const REBUILD_TARGETS = {
      "Thina_CRM_Demo_Guide": {
        dir: "Demo Documents",
        fn: updateDemoGuide,
      },
      "Thina_CRM_Features_and_Data_Model": {
        dir: "Features",
        fn: updateFeaturesDoc,
      },
      "Thina_CRM_Feature_Research": {
        dir: "Features",
        fn: updateFeatureResearch,
      },
      "Thina_CRM_Marketing_Guide": {
        dir: "Marketing Documents",
        fn: updateMarketingGuide,
      },
      "Thina_CRM_User_Training_Guide": {
        dir: "Training Documents",
        fn: updateTrainingGuide,
      },
    };

    console.log(`\n📄 Rebuilding ${Object.keys(REBUILD_TARGETS).length} documents from scratch:\n`);

    for (const [fileName, { dir, fn }] of Object.entries(REBUILD_TARGETS)) {
      const meta = FILE_METADATA[fileName] || {
        title: fileName.replace(/[-_]/g, " "),
        subtitle: "",
      };

      // Start with empty blocks and let the update function add content
      const blocks = fn([]);
      console.log(`  ${meta.title}: ${blocks.length} content blocks`);

      const contentParagraphs = renderBlocks(blocks);
      const doc = buildDocument(meta.title, meta.subtitle, contentParagraphs);

      const outDir = resolve(DOCS_DIR, dir);
      const { mkdirSync } = await import("fs");
      mkdirSync(outDir, { recursive: true });

      const outputPath = resolve(outDir, `${fileName}.docx`);
      const buffer = await Packer.toBuffer(doc);
      writeFileSync(outputPath, buffer);
      console.log(`  ✅ Rebuilt: ${dir}/${fileName}.docx`);
    }

    console.log(`\n✅ All documents rebuilt with v${VERSION} content.\n`);

  } else if (mode === "reformat") {
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
      blocks = applyContentUpdates(fileName, blocks);
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
