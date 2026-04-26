---
name: word-docs
description: "Create, edit, and regenerate Word (.docx) documents in Thina CRM with the unified Thina design system. Use when adding/updating any document under docs/ — including DRM/DLP/IRM-protected sources where in-place editing is impossible. Covers the generator-script pattern, shared design helpers, table/heading/bullet primitives, image embedding, and verification."
---
# Word Documents — Thina CRM

## Core Rule
**Never hand-edit `.docx` binaries in this repo. Always regenerate via a Node script using the `docx` package.**

The `.docx` files under `docs/` are *build artifacts*, not source. Source-of-truth lives in:
- `scripts/generate-spec.mjs` — System Specification
- `scripts/generate-brand-kit.mjs` — Brand Kit
- `scripts/convert-docs.mjs` — Markdown→docx converter & reformatter for ad-hoc docs
- `scripts/generate-security-audit.py` — Security Audit (Python, `python-docx`)

This pattern sidesteps every DRM/AIP/IRM/DLP problem because:
- Generator scripts write straight to the filesystem with `Packer.toBuffer()` + `writeFileSync`
- No COM interop, no Word desktop session, no protection inheritance
- The output `.docx` is unprotected (the source `.mjs` is the version-controlled artifact)

## When to Use This Skill
- User asks to add/update content in any document under `docs/`
- User wants a new branded `.docx` (proposal, training, marketing, spec)
- An existing `.docx` is DRM/AIP-locked, corrupt, or won't open
- A doc generator needs new sections, tables, version history entries, etc.

## Pre-Flight
1. Identify the target document and its generator script.
   - System Specification → `scripts/generate-spec.mjs` (large; sections function-per-area)
   - Brand Kit → `scripts/generate-brand-kit.mjs`
   - Anything else under `docs/` → likely produced by `scripts/convert-docs.mjs` or has no generator yet
2. If **no generator exists** for a doc the user wants to update:
   - Default: build a fresh generator script following the unified design system below
   - Add the script to BACKLOG if it's out of scope for the current task
3. Confirm content changes with user if non-trivial (new section vs. typo fix).

## Unified Design System (mandatory)
Match `scripts/convert-docs.mjs` and `scripts/generate-spec.mjs` exactly:

| Element | Spec |
|--------|------|
| Font | `Aptos` (body + headings) |
| Body size | `22` half-points (11pt) |
| Heading 1 | size 36, bold, color `18181B` (Zinc 900) |
| Heading 2 | size 28, bold, color `27272A` (Zinc 800) |
| Heading 3 | size 24, bold, color `3F3F46` (Zinc 700) |
| Table header | shading `18181B`, white bold text size 20 |
| Table body | size 20, no zebra stripes |
| Code | font `Consolas`, size 18, shading `F4F4F5` |
| Title accent | `4F46E5` (Indigo 600) |
| Muted text | `71717A` / `A1A1AA` (Zinc 500/400) italic |
| Page margin | `convertInchesToTwip(1)` all sides |
| Footer/header | small italic Zinc-400 |

## Standard Imports
```js
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType,
  BorderStyle, Footer, Header, ImageRun, ShadingType,
  convertInchesToTwip, LevelFormat, PageBreak, ExternalHyperlink,
} from "docx";
import { writeFileSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
```

## Helper Library (copy from convert-docs.mjs)
Always reuse these — do **not** invent new primitives:

- `heading(text, level)`, `h2(text)`, `h3(text)` — section headings
- `para(text)` — body paragraph
- `bullet(text)`, `bulletBold(label, value)` — bulleted list items
- `emptyPara()` — vertical spacer
- `codeBlock(text)` — monospace shaded block
- `tableHeader(...cells)`, `tableRow(...cells)`, `makeTable(headers, rows)` — tables
- `titlePage(title, subtitle)` — branded cover with "THINA CRM" wordmark
- `endOfDocument(title)` — closing marker
- `buildDocument(title, subtitle, paragraphs)` — wraps content in styled `Document` + page setup

If you're writing a new generator, **import or duplicate these helpers verbatim** — do not restyle.

## Procedure (Update Existing Doc)
1. Open the generator script (e.g. `scripts/generate-spec.mjs`).
2. Bump `const VERSION = "x.y.z"` if the change is release-worthy.
3. For Specification: also update collection counts, route lists, function tables, and append a new entry to **both** version-history tables (Section 12.2 Copilot activity *and* Section 13 Version History — they're separate arrays).
4. Use `multi_replace_string_in_file` for related edits in one shot.
5. Regenerate:
   ```powershell
   node scripts/generate-spec.mjs
   ```
6. **Verify** — open the resulting `.docx` and spot-check, OR at minimum check the new file size grew sensibly. If you have Excel-MCP loaded for Word equivalents, skip — there's no Word-MCP. Trust the generator.
7. `git add` both the script *and* the regenerated `.docx`. Commit them together so the artifact stays in sync with source.

## Procedure (New Document)
1. Create `scripts/generate-<name>.mjs`.
2. Copy the imports + helper block from `scripts/convert-docs.mjs` (lines 1–130).
3. Build content as an array of `Paragraph` / `Table` objects.
4. Wrap with `buildDocument(title, subtitle, [...titlePage(), ...content, ...endOfDocument()])`.
5. Output:
   ```js
   const buffer = await Packer.toBuffer(doc);
   writeFileSync(resolve(ROOT, "docs/<Folder>/<Filename>_v" + VERSION + ".docx"), buffer);
   ```
6. Add an `npm` script alias if the doc will be regenerated regularly.

## DRM / DLP / IRM Source Documents
If the user supplies a protected `.docx` and asks you to "edit" it:
1. **Do not attempt COM/Word automation** — saves silently fail, content reverts.
2. Read the source content (Word UI screenshot from user, or `mammoth`/`docx-parser` extraction if available).
3. Build a brand-new `.docx` via the generator pattern above. The new file is unprotected by default.
4. Tell the user the regenerated file is unprotected and they should reapply their organisation's label/protection in Word if needed.

## Image Embedding
Use `ImageRun` for logos / screenshots:
```js
import { ImageRun } from "docx";
new Paragraph({
  children: [new ImageRun({
    data: readFileSync(resolve(ROOT, "docs/Marketing Documents/Logo/thina-mark.png")),
    transformation: { width: 120, height: 120 },
  })],
});
```
PNG and JPEG only — SVG is not supported by the `docx` package.

## Common Pitfalls
- **Two version-history tables** in `generate-spec.mjs`: Section 12.2 (short bullets in `Copilot Activity`) and Section 13 (long-form). Update both.
- **Collection / route counts** appear in Section 4 *and* version-history descriptions — grep for the old number to find every site.
- **Table column widths** — `WidthType.PERCENTAGE` is more reliable than DXA for our docs.
- **Page breaks** — use `new Paragraph({ children: [new PageBreak()] })`, not raw `\f`.
- **No Markdown** — the `docx` package doesn't parse Markdown. Convert manually (or via `convert-docs.mjs --reformat`).
- **OneDrive note** — the active repo (`C:\dev\thina-crm`) is **outside OneDrive**, so DLP/sync corruption is not a concern here. Don't reintroduce OneDrive paths.

## Verification Checklist (before commit)
- [ ] Generator runs with no errors (`node scripts/generate-<name>.mjs`)
- [ ] Output `.docx` exists at the expected path with non-trivial size (>20 KB for spec docs)
- [ ] Version constant bumped if release-worthy
- [ ] Both version-history tables updated (spec only)
- [ ] Counts (collections, routes, tests) consistent across the doc
- [ ] Both the generator `.mjs` and the regenerated `.docx` staged together
