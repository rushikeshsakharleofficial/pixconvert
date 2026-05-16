# Frontend Audit Design — PixConvert

**Date:** 2026-05-16
**Scope:** All pages and shared components — 100% coverage
**Strategy:** Audit + fix in the same pass (find issue → fix → move on)

---

## Audit Dimensions

Every page and component is checked against all 4 dimensions before moving to the next.

### 1. Mobile / Responsive

Check at 375px, 480px, 768px, 1024px viewports.

- `document.documentElement.scrollWidth === clientWidth` (no horizontal overflow)
- Touch targets ≥ 44×44px (buttons, links, form controls)
- Base font size ≥ 16px; no text requires pinch-zoom to read
- Grid/flex layouts collapse to single column where appropriate
- No text truncation that hides critical content
- Inputs, selects, textareas full-width on mobile
- Images and canvases don't overflow their containers

### 2. Accessibility (a11y)

- All `<img>` elements have non-empty `alt` attributes
- All icon-only buttons have `aria-label`
- Color contrast ratio ≥ 4.5:1 for body text, ≥ 3:1 for large text / UI components
- Focus indicators visible on all interactive elements (not just outline: none)
- Heading hierarchy correct: one `<h1>` per page, `h2 → h3` without skipping levels
- All form `<input>`, `<select>`, `<textarea>` have associated `<label>` or `aria-label`
- Keyboard navigation: Tab reaches all interactive elements; Enter/Space activates; Escape closes modals/drawers
- File upload drop zones keyboard-accessible
- Dynamic content changes announced via `aria-live` where relevant

### 3. Visual Polish

- Spacing uses CSS custom properties (no magic pixel values)
- Typography scale consistent across pages (heading sizes match `--font-*` vars)
- Dark mode and light mode both render correctly (no invisible text, broken backgrounds)
- `prefers-reduced-motion` media query respected — animations disabled/reduced
- Hover and focus states on all interactive elements
- Loading states present on async operations (file processing, conversions)
- Error states styled and informative (not raw JS error objects)
- Empty states handled (e.g., no files uploaded yet)

### 4. Performance

- Lighthouse performance score ≥ 90 on mobile emulation
- CLS (Cumulative Layout Shift) < 0.1
- LCP (Largest Contentful Paint) < 2.5s
- No render-blocking scripts or stylesheets
- Images use lazy loading (`loading="lazy"`) where not above the fold
- Heavy libraries (PDF.js, Tesseract, FFmpeg) code-split and loaded on demand
- No unnecessary re-renders on tool pages during file upload

---

## Execution Groups

Groups are ordered by dependency — shared components first since fixes cascade to all pages.

### Group 1 — Shared Components (6 components)

Fixes here apply globally. Audit fully before touching any page.

| Component | File |
|-----------|------|
| Navbar | `Navbar.jsx` |
| Footer | `Footer.jsx` |
| DropZone | `DropZone.jsx` |
| FolderUpload | `FolderUpload.jsx` |
| ToolProgressBar | `ToolProgressBar.jsx` |
| ErrorBoundary | `ErrorBoundary.jsx` |

### Group 2 — Info Pages (8 pages)

| Page | Route | File |
|------|-------|------|
| Home | `/` | `Home.jsx` |
| All Tools | `/tools` | `Tools.jsx` |
| About | `/about` | `About.jsx` |
| Privacy | `/privacy` | `Privacy.jsx` |
| Contact | `/contact` | `Contact.jsx` |
| API Docs | `/api` | `ApiDocs.jsx` |
| Analytics | `/analytics` | `Analytics.jsx` |
| Not Found | `*` | `NotFound.jsx` |

### Group 3 — Standard Tool Pages (~28 pages)

Same upload → process → download pattern. Audit one as template, apply systematic fixes to all.

**PDF Operations:**
`MergePdf`, `SplitPdf`, `RemovePages`, `ExtractPages`, `OrganizePdf`, `ScanToPdf`,
`OcrPdf`, `RotatePdf`, `AddPageNumbers`, `AddWatermark`, `CropPdf`

**PDF Security:**
`PdfUnlocker`, `PdfLocker`

**PDF Conversions (to PDF):**
`JpgToPdf`, `WordToPdf`, `PowerpointToPdf`, `ExcelToPdf`, `HtmlToPdf`

**PDF Conversions (from PDF):**
`PdfToJpg`, `PdfToWord`, `PdfToPowerpoint`, `PdfToExcel`, `PdfToPdfA`

**Image / Universal:**
`UniversalConverter` + image-to-image converters (JPG→PNG, PNG→JPG, WebP→JPG, HEIC→JPG, BMP→PNG, Photo→Markdown)

### Group 4 — Complex Tool Pages (6 pages)

Rich UI with canvas, drag handles, multi-panel layouts. Requires deeper testing.

| Tool | File(s) |
|------|---------|
| Edit PDF | `EditPdf.jsx` + `pdf-editor/EditorToolbar.jsx`, `PageCanvas.jsx`, `ThumbnailSidebar.jsx` |
| Sign PDF | `SignPdf.jsx` |
| Redact PDF | `RedactPdf.jsx` |
| Compare PDF | `ComparePdf.jsx` |
| GIF Maker | `GifMaker.jsx` |
| OCR Tool | `OcrTool.jsx` |

---

## Per-Page Audit Protocol

For each page/component in order:

1. **Navigate** Chrome DevTools to the page URL at 375px mobile emulation
2. **Screenshot (before)** — `take_screenshot fullPage:true` — baseline record
3. **Run overflow check** via `evaluate_script` → fix any `scrollWidth > clientWidth`
4. **Step through breakpoints** 480→768→1024 via `emulate viewport` → screenshot each → fix breaks
5. **Run Lighthouse** mobile audit via `lighthouse_audit` → record CLS, LCP, performance score
6. **Tab through page** — verify all interactive elements reachable, focus visible
7. **Check contrast** on text elements using DevTools color picker / `evaluate_script`
8. **Check alt/ARIA** via `take_snapshot` (a11y tree) — verify alt, aria-label, heading order
9. **Toggle dark/light mode** → `take_screenshot` → verify no visual regressions
10. **Check animations** → emulate `prefers-reduced-motion: reduce` → verify they stop
11. **Fix all found issues** in source CSS/JSX
12. **Screenshot (after)** at 375px → confirm fixes visible
13. **Re-run overflow check script** → must return `canScrollX: false` before marking page done

---

## Definition of Done

A page is complete when:
- [ ] Zero horizontal overflow at all 4 breakpoints
- [ ] Lighthouse mobile performance ≥ 90
- [ ] CLS < 0.1, LCP < 2.5s
- [ ] All interactive elements keyboard-reachable with visible focus
- [ ] All images have alt text, all icon buttons have aria-label
- [ ] Dark and light mode both render correctly
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Loading and error states are styled

---

## Constraints

- CSS fixes go in `src/index.css` using existing custom properties
- Component fixes in the relevant `.jsx` file only — no new abstractions
- Do not change tool business logic (PDF processing, conversions)
- Group 1 shared components: changes must be verified across ≥3 pages before moving on
