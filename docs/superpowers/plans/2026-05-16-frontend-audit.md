# Frontend Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit and fix every page and component in PixConvert for mobile responsiveness, accessibility, visual polish, and performance — 100% coverage.

**Architecture:** Audit runs in-browser via Chrome DevTools MCP (navigate → screenshot → run scripts → fix CSS/JSX → screenshot after). Fixes land in `src/index.css` and component files. Shared components fixed first so every page inherits corrections. Group 3 tool pages are audited via one deep-template audit then batch verification since they share identical layout patterns.

**Tech Stack:** React + Vite, CSS custom properties, Chrome DevTools MCP (`take_screenshot`, `evaluate_script`, `take_snapshot`, `emulate`, `lighthouse_audit`, `navigate_page`)

---

## Reusable Audit Scripts

Paste these into `evaluate_script` at each page. Save for reference.

### Overflow Check
```js
() => {
  const bad = [];
  document.querySelectorAll('*').forEach(el => {
    if (el.scrollWidth > document.documentElement.clientWidth + 4) {
      bad.push({ tag: el.tagName, cls: el.className?.toString().slice(0,60), scrollW: el.scrollWidth });
    }
  });
  return { canScrollX: document.documentElement.scrollWidth > document.documentElement.clientWidth, count: bad.length, items: bad.slice(0,10) };
}
```
**Pass condition:** `canScrollX: false`

### Touch Target Check
```js
() => {
  const small = [];
  document.querySelectorAll('a, button, [role="button"], input, select, textarea').forEach(el => {
    const r = el.getBoundingClientRect();
    if ((r.width < 44 || r.height < 44) && r.width > 0) {
      small.push({ tag: el.tagName, text: el.textContent?.trim().slice(0,30), w: Math.round(r.width), h: Math.round(r.height) });
    }
  });
  return small.slice(0,15);
}
```
**Pass condition:** empty array

### A11y Quick Check
```js
() => {
  const issues = [];
  document.querySelectorAll('img').forEach(img => { if (!img.alt && img.alt !== '') issues.push('img missing alt: ' + (img.src?.slice(-40))); });
  document.querySelectorAll('button, [role="button"]').forEach(btn => {
    if (!btn.textContent?.trim() && !btn.getAttribute('aria-label')) issues.push('icon button no aria-label: ' + btn.className?.slice(0,40));
  });
  const h1s = document.querySelectorAll('h1');
  if (h1s.length !== 1) issues.push(`h1 count: ${h1s.length} (expected 1)`);
  return issues.slice(0,20);
}
```
**Pass condition:** empty array

### Heading Order Check
```js
() => {
  const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'))
    .map(h => ({ level: parseInt(h.tagName[1]), text: h.textContent?.trim().slice(0,50) }));
  const skips = [];
  for (let i = 1; i < headings.length; i++) {
    if (headings[i].level - headings[i-1].level > 1) skips.push(`H${headings[i-1].level} → H${headings[i].level}: "${headings[i].text}"`);
  }
  return { headings, skips };
}
```

---

## Task 1: Shared Component — Navbar

**Files:**
- Modify: `src/components/Navbar.jsx`
- Modify: `src/index.css` (navbar-related rules)

**Vercel URL:** `https://fileconverter-three.vercel.app/`

- [ ] Navigate to home, emulate 375px mobile
```
emulate viewport: 375x812x2,mobile,touch
navigate_page url: https://fileconverter-three.vercel.app/
```

- [ ] Screenshot before
```
take_screenshot fullPage: false
```

- [ ] Run overflow check — verify `canScrollX: false` (already fixed in previous session)
```js
// use Overflow Check script above
```

- [ ] Run touch target check on nav elements
```js
// use Touch Target Check script above — navbar buttons should be ≥44px
```

- [ ] Take a11y snapshot — check hamburger button has aria-label, nav landmark present
```
take_snapshot
```
Fix if `<button class="hamburger">` lacks `aria-label="Open menu"` — add it in `Navbar.jsx`.

- [ ] Open hamburger menu (click), screenshot to confirm drawer opens correctly at 375px
```
click hamburger button uid
take_screenshot fullPage: false
```

- [ ] Check focus trap in drawer: Tab should cycle through nav links, Escape closes
- [ ] Close drawer, emulate 768px, screenshot to confirm desktop nav visible
```
emulate viewport: 768x1024x2
take_screenshot fullPage: false
```

- [ ] Emulate 1024px, screenshot
```
emulate viewport: 1024x768x2
take_screenshot fullPage: false
```

- [ ] Fix any issues found in `Navbar.jsx` or `src/index.css`

- [ ] Screenshot after at 375px
```
emulate viewport: 375x812x2,mobile,touch
take_screenshot fullPage: false
```

- [ ] Commit
```bash
git add src/components/Navbar.jsx src/index.css
git commit -m "fix(navbar): mobile a11y and responsive fixes"
```

---

## Task 2: Shared Component — Footer

**Files:**
- Modify: `src/components/Footer.jsx`
- Modify: `src/index.css` (`.footer`, `.footer-inner`, `.footer-bottom`)

**Vercel URL:** `https://fileconverter-three.vercel.app/`

- [ ] Navigate to home, emulate 375px, scroll to bottom, screenshot footer
```
navigate_page url: https://fileconverter-three.vercel.app/
emulate viewport: 375x812x2,mobile,touch
take_screenshot fullPage: true
```

- [ ] Run overflow check on page — footer must not cause horizontal scroll

- [ ] Run touch target check — footer links must be ≥44px tall (padding fix if needed)

- [ ] Take a11y snapshot — check footer has `<footer>` landmark, links have meaningful text

- [ ] Emulate 480px, screenshot — grid should be 1-column (already in CSS at 480px breakpoint)

- [ ] Emulate 768px, screenshot — grid should be 2-column

- [ ] Fix any issues found

- [ ] Commit
```bash
git add src/components/Footer.jsx src/index.css
git commit -m "fix(footer): mobile touch targets and a11y fixes"
```

---

## Task 3: Shared Component — DropZone

**Files:**
- Modify: `src/components/DropZone.jsx`
- Modify: `src/index.css` (`.drop-zone`, `.drop-zone-orb`)

**Vercel URL:** `https://fileconverter-three.vercel.app/tools/merge-pdf`

- [ ] Navigate to merge-pdf (has DropZone), emulate 375px, screenshot
```
emulate viewport: 375x812x2,mobile,touch
navigate_page url: https://fileconverter-three.vercel.app/tools/merge-pdf
take_screenshot fullPage: false
```

- [ ] Run overflow check — DropZone must not overflow

- [ ] Run touch target check — "Select Files" button and drag zone must be ≥44px

- [ ] Take a11y snapshot — check drop zone has `role="button"` or is a `<button>`, has `aria-label`

- [ ] Check keyboard: Tab to drop zone, Enter should trigger file picker

- [ ] Check dark/light mode toggle — drop zone orbs must be visible in both modes
```js
() => document.documentElement.setAttribute('data-theme', 'light')
```
```
take_screenshot fullPage: false
```
```js
() => document.documentElement.setAttribute('data-theme', 'dark')
```

- [ ] Fix any issues in `DropZone.jsx` or CSS

- [ ] Commit
```bash
git add src/components/DropZone.jsx src/index.css
git commit -m "fix(dropzone): a11y, keyboard access, mobile fixes"
```

---

## Task 4: Shared Component — ToolProgressBar

**Files:**
- Modify: `src/components/ToolProgressBar.jsx`
- Modify: `src/index.css` (`.tool-progress-wrap`, `.tool-progress-loader`)

**Vercel URL:** `https://fileconverter-three.vercel.app/tools/merge-pdf`

- [ ] Navigate, emulate 375px

- [ ] Run overflow check — progress bar must not overflow at any width

- [ ] Run touch target check — any buttons inside progress bar (cancel, etc.)

- [ ] Check `prefers-reduced-motion` — loader animation must stop
```js
() => {
  // Check if animations respect prefers-reduced-motion
  const style = document.createElement('style');
  style.textContent = '* { animation: none !important; transition: none !important; }';
  document.head.appendChild(style);
  return 'motion disabled — take screenshot';
}
```
```
take_screenshot fullPage: false
```
Then remove the style and verify the actual `@media (prefers-reduced-motion)` rule in CSS covers loader.

- [ ] Fix any issues

- [ ] Commit
```bash
git add src/components/ToolProgressBar.jsx src/index.css
git commit -m "fix(progressbar): reduced-motion and mobile fixes"
```

---

## Task 5: Shared Component — FolderUpload + ErrorBoundary

**Files:**
- Modify: `src/components/FolderUpload.jsx`
- Modify: `src/components/ErrorBoundary.jsx`

- [ ] Navigate to converter, emulate 375px, screenshot
```
navigate_page url: https://fileconverter-three.vercel.app/tools/converter
take_screenshot fullPage: true
```

- [ ] Run touch target check — "Select Folder" button must be ≥44px

- [ ] Take a11y snapshot — FolderUpload button must have accessible text

- [ ] Trigger an error state (DevTools → disable JS → reload) to see ErrorBoundary UI, screenshot

- [ ] Check ErrorBoundary renders gracefully on mobile — no overflow, readable text

- [ ] Fix any issues in both files

- [ ] Commit
```bash
git add src/components/FolderUpload.jsx src/components/ErrorBoundary.jsx
git commit -m "fix(upload/error): mobile and a11y fixes"
```

---

## Task 6: Info Page — Home

**Files:**
- Modify: `src/components/Home.jsx`
- Modify: `src/index.css` (hero, features-grid, steps, trust-strip, tool-marquee sections)

**Vercel URL:** `https://fileconverter-three.vercel.app/`

- [ ] Navigate, emulate 375px, screenshot full page (baseline)
```
emulate viewport: 375x812x2,mobile,touch
navigate_page url: https://fileconverter-three.vercel.app/
take_screenshot fullPage: true
```

- [ ] Run overflow check — must return `canScrollX: false` (already fixed)

- [ ] Run touch target check on hero CTAs and nav pills

- [ ] Run a11y check + heading check — exactly 1 `<h1>`, no heading skips

- [ ] Take a11y snapshot — check hero eyebrow badge is not an empty element, CTA buttons have clear labels

- [ ] Emulate 480px, screenshot full page — features grid should be 2-col

- [ ] Emulate 768px, screenshot — features grid should be 2-col, stats row horizontal

- [ ] Emulate 1024px, screenshot — full desktop layout

- [ ] Run Lighthouse mobile audit
```
lighthouse_audit categories: ["performance","accessibility"]
```
Record: performance score, accessibility score, CLS, LCP.

- [ ] Fix issues found (common: missing alt on hero image/logo, button labels, spacing at 480px)

- [ ] Toggle light mode, screenshot full page, toggle back
```js
() => document.documentElement.setAttribute('data-theme','light')
```
```
take_screenshot fullPage: true
```
```js
() => document.documentElement.setAttribute('data-theme','dark')
```

- [ ] Screenshot after at 375px

- [ ] Commit
```bash
git add src/components/Home.jsx src/index.css
git commit -m "fix(home): a11y, mobile polish, lighthouse fixes"
```

---

## Task 7: Info Page — All Tools (`/tools`)

**Files:**
- Modify: `src/components/Tools.jsx`
- Modify: `src/index.css` (`.tool-cards-grid`, `.tool-card`)

**Vercel URL:** `https://fileconverter-three.vercel.app/tools`

- [ ] Navigate, emulate 375px, screenshot full page

- [ ] Run overflow check

- [ ] Run touch target check — tool cards must be ≥44px tall

- [ ] A11y check — card links must have descriptive text (not just icon)

- [ ] Take a11y snapshot — check section headings (PDF TOOLS, IMAGE TOOLS, etc.) use correct heading level

- [ ] Emulate 480px — grid should be 2-column (`.tool-cards-grid: 1fr 1fr`)

- [ ] Emulate 768px — grid should be auto-fill minmax(150px)

- [ ] Run Lighthouse mobile audit — note performance score

- [ ] Fix any issues

- [ ] Commit
```bash
git add src/components/Tools.jsx src/index.css
git commit -m "fix(tools-page): a11y, grid, touch targets"
```

---

## Task 8: Info Page — About

**Files:**
- Modify: `src/components/About.jsx`
- Modify: `src/index.css` (about-specific rules if any)

**Vercel URL:** `https://fileconverter-three.vercel.app/about`

- [ ] Navigate, emulate 375px, screenshot full page

- [ ] Run overflow check

- [ ] Run touch target check

- [ ] A11y check: exactly 1 `<h1>`, feature icons have alt or aria-hidden, bullet list accessible

- [ ] Check list items are `<ul>/<li>` not `<div>` — if divs, fix to semantic HTML

- [ ] Emulate 768px, screenshot

- [ ] Light mode toggle, screenshot

- [ ] Fix any issues

- [ ] Commit
```bash
git add src/components/About.jsx src/index.css
git commit -m "fix(about): semantic HTML, a11y, mobile fixes"
```

---

## Task 9: Info Page — Privacy

**Files:**
- Modify: `src/components/Privacy.jsx`

**Vercel URL:** `https://fileconverter-three.vercel.app/privacy`

- [ ] Navigate, emulate 375px, screenshot full page

- [ ] Run overflow check

- [ ] A11y check: heading hierarchy for policy sections, links have clear text

- [ ] Check line length — body text should not exceed ~70ch on desktop (readability)

- [ ] Emulate 768px, screenshot

- [ ] Fix any issues

- [ ] Commit
```bash
git add src/components/Privacy.jsx
git commit -m "fix(privacy): a11y and readability fixes"
```

---

## Task 10: Info Page — Contact

**Files:**
- Modify: `src/components/Contact.jsx`
- Modify: `src/index.css` (`.contact-grid`)

**Vercel URL:** `https://fileconverter-three.vercel.app/contact`

- [ ] Navigate, emulate 375px, screenshot full page

- [ ] Run overflow check

- [ ] Run touch target check — form inputs, submit button ≥44px

- [ ] A11y check: every `<input>` has `<label>` or `aria-label`, form has `<fieldset>`/`<legend>` if grouped, submit button has type="submit"

- [ ] Check form error state: what shows if fields are empty on submit? Must be styled and readable

- [ ] Emulate 480px, screenshot — contact grid should be 1-column

- [ ] Emulate 768px — should be 2-column (form + info)

- [ ] Fix any issues

- [ ] Commit
```bash
git add src/components/Contact.jsx src/index.css
git commit -m "fix(contact): form a11y, mobile layout fixes"
```

---

## Task 11: Info Page — API Docs

**Files:**
- Modify: `src/components/ApiDocs.jsx`
- Modify: `src/index.css` (api-docs rules if any)

**Vercel URL:** `https://fileconverter-three.vercel.app/api`

- [ ] Navigate, emulate 375px, screenshot full page

- [ ] Run overflow check — code blocks often cause horizontal scroll; must be `overflow-x: auto` not overflow-hidden

- [ ] Check `<pre><code>` blocks have `overflow-x: auto` and `max-width: 100%`

- [ ] A11y check: code blocks have `<code>` or `<pre>` tags (not divs), headings correct

- [ ] Run touch target check — copy buttons, section links

- [ ] Emulate 768px, screenshot

- [ ] Fix any issues (code block horizontal scroll is the most common issue here)

- [ ] Commit
```bash
git add src/components/ApiDocs.jsx src/index.css
git commit -m "fix(api-docs): code block overflow, a11y fixes"
```

---

## Task 12: Info Page — Analytics

**Files:**
- Modify: `src/components/Analytics.jsx`
- Modify: `src/components/ui/donut-chart.jsx`
- Modify: `src/components/ui/glowing-line-chart.jsx`
- Modify: `src/components/ui/line-chart.jsx`

**Vercel URL:** `https://fileconverter-three.vercel.app/analytics`

- [ ] Navigate, emulate 375px, screenshot full page

- [ ] Run overflow check — charts often overflow on mobile

- [ ] Check chart SVGs/canvas have `width: 100%` and `max-width: 100%` or `viewBox` set

- [ ] Check charts have `aria-label` or `<title>` for screen readers

- [ ] Emulate 480px, screenshot — charts should not overflow

- [ ] Emulate 768px, screenshot

- [ ] Fix overflow on charts (add `max-width: 100%; overflow: hidden` to chart containers)

- [ ] Commit
```bash
git add src/components/Analytics.jsx src/components/ui/donut-chart.jsx src/components/ui/glowing-line-chart.jsx src/components/ui/line-chart.jsx src/index.css
git commit -m "fix(analytics): chart overflow, svg a11y, mobile fixes"
```

---

## Task 13: Info Page — NotFound (404)

**Files:**
- Modify: `src/components/NotFound.jsx`

**Vercel URL:** `https://fileconverter-three.vercel.app/this-does-not-exist`

- [ ] Navigate to non-existent route, emulate 375px, screenshot

- [ ] Run overflow check, touch target check

- [ ] A11y check: exactly 1 `<h1>`, CTA button has clear label, back-to-home link present

- [ ] Fix any issues

- [ ] Commit
```bash
git add src/components/NotFound.jsx
git commit -m "fix(404): a11y and mobile fixes"
```

---

## Task 14: Template Tool Audit — MergePdf (Group 3 baseline)

This is the deep audit for Group 3. Patterns found here apply to all other standard tools.

**Files:**
- Modify: `src/components/MergePdf.jsx`
- Modify: `src/index.css` (`.tool-container`, `.glass`, `.tool-header`, `.tool-desc`, `.file-list`, `.preview-card`)

**Vercel URL:** `https://fileconverter-three.vercel.app/tools/merge-pdf`

- [ ] Navigate, emulate 375px, screenshot full page

- [ ] Run overflow check

- [ ] Run touch target check — "Merge PDF" button, file remove buttons, page reorder handles

- [ ] A11y check + heading check — `<h1>` is tool name, file list items accessible

- [ ] Take a11y snapshot — uploaded file list items should be `<li>` with file name as text

- [ ] Check drag handles (reorder) have `aria-label` and are keyboard accessible

- [ ] Check upload confirmation state: after files added, screenshot to see file list layout at 375px

- [ ] Emulate 480px, screenshot

- [ ] Emulate 768px, screenshot

- [ ] Run Lighthouse mobile audit, record scores

- [ ] Light mode toggle, screenshot, dark mode back

- [ ] Check `prefers-reduced-motion` — any file card animations stop

- [ ] Fix all issues found — document any that are systemic (affect all tool pages)

- [ ] Commit
```bash
git add src/components/MergePdf.jsx src/index.css
git commit -m "fix(merge-pdf): template audit fixes — mobile, a11y, polish"
```

---

## Task 15: Systemic CSS Fixes from Template Audit

Apply any systemic fixes to `src/index.css` that affect all Group 3 tool pages (e.g., `.tool-header`, `.glass`, `.file-list`, `.preview-card` mobile overrides).

- [ ] List all systemic issues found in Task 14

- [ ] Write CSS fixes in `src/index.css` under appropriate media queries

- [ ] Verify fixes on MergePdf at 375px still pass overflow check

- [ ] Commit
```bash
git add src/index.css
git commit -m "fix(css): systemic tool-page mobile and a11y fixes"
```

---

## Task 16: Batch Verify Group 3 — PDF Operations

**Pages:** SplitPdf, RemovePages, ExtractPages, OrganizePdf, ScanToPdf, RotatePdf

For each page run this protocol:
1. Navigate → 375px → overflow check (`canScrollX: false`) → touch target check → screenshot
2. Fix any page-specific issues
3. Move to next

**URLs:**
- `https://fileconverter-three.vercel.app/tools/split-pdf`
- `https://fileconverter-three.vercel.app/tools/remove-pages`
- `https://fileconverter-three.vercel.app/tools/extract-pages`
- `https://fileconverter-three.vercel.app/tools/organize-pdf`
- `https://fileconverter-three.vercel.app/tools/scan-to-pdf`
- `https://fileconverter-three.vercel.app/tools/rotate-pdf`

- [ ] SplitPdf — navigate, overflow check, touch check, screenshot, fix if needed
- [ ] RemovePages — navigate, overflow check, touch check, screenshot, fix if needed
- [ ] ExtractPages — navigate, overflow check, touch check, screenshot, fix if needed
- [ ] OrganizePdf — navigate, overflow check, touch check, screenshot, fix if needed (drag-to-reorder UI needs special attention)
- [ ] ScanToPdf — navigate, overflow check, touch check, screenshot, fix if needed
- [ ] RotatePdf — navigate, overflow check, touch check, screenshot, fix if needed

- [ ] Commit all fixes
```bash
git add src/components/SplitPdf.jsx src/components/RemovePages.jsx src/components/ExtractPages.jsx src/components/OrganizePdf.jsx src/components/ScanToPdf.jsx src/components/RotatePdf.jsx src/index.css
git commit -m "fix(pdf-ops): batch mobile and a11y fixes"
```

---

## Task 17: Batch Verify Group 3 — PDF Utilities

**Pages:** AddPageNumbers, AddWatermark, CropPdf, PdfUnlocker, PdfLocker

For each: navigate → 375px → overflow check → touch check → screenshot → fix if needed.

**URLs:**
- `https://fileconverter-three.vercel.app/tools/add-page-numbers`
- `https://fileconverter-three.vercel.app/tools/add-watermark`
- `https://fileconverter-three.vercel.app/tools/crop-pdf`
- `https://fileconverter-three.vercel.app/tools/pdf` (Unlock)
- `https://fileconverter-three.vercel.app/tools/pdf-lock` (Protect)

- [ ] AddPageNumbers — overflow, touch, a11y snapshot (options panel must be keyboard accessible), screenshot
- [ ] AddWatermark — overflow, touch, a11y (text input has label, position picker accessible), screenshot
- [ ] CropPdf — overflow, touch, a11y (crop handles need aria), screenshot — **NOTE:** canvas crop UI likely has keyboard issues; document if found
- [ ] PdfUnlocker — overflow, touch, password input has `<label>`, screenshot
- [ ] PdfLocker — overflow, touch, password fields have labels, match-password validation accessible, screenshot

- [ ] Commit
```bash
git add src/components/AddPageNumbers.jsx src/components/AddWatermark.jsx src/components/CropPdf.jsx src/components/PdfUnlocker.jsx src/components/PdfLocker.jsx src/index.css
git commit -m "fix(pdf-utils): batch mobile, a11y, form label fixes"
```

---

## Task 18: Batch Verify Group 3 — Convert to PDF

**Pages:** JpgToPdf, WordToPdf, PowerpointToPdf, ExcelToPdf, HtmlToPdf

For each: navigate → 375px → overflow check → touch check → screenshot → fix if needed.

**URLs:**
- `https://fileconverter-three.vercel.app/tools/jpg-to-pdf`
- `https://fileconverter-three.vercel.app/tools/word-to-pdf`
- `https://fileconverter-three.vercel.app/tools/powerpoint-to-pdf`
- `https://fileconverter-three.vercel.app/tools/excel-to-pdf`
- `https://fileconverter-three.vercel.app/tools/html-to-pdf`

- [ ] Each page: overflow check, touch check, screenshot
- [ ] HtmlToPdf: special check — URL input field has label, ≥44px height

- [ ] Commit
```bash
git add src/components/JpgToPdf.jsx src/components/WordToPdf.jsx src/components/PowerpointToPdf.jsx src/components/ExcelToPdf.jsx src/components/HtmlToPdf.jsx src/index.css
git commit -m "fix(to-pdf): batch mobile and a11y fixes"
```

---

## Task 19: Batch Verify Group 3 — Convert from PDF

**Pages:** PdfToJpg, PdfToWord, PdfToPowerpoint, PdfToExcel, PdfToPdfA

For each: navigate → 375px → overflow check → touch check → screenshot → fix if needed.

**URLs:**
- `https://fileconverter-three.vercel.app/tools/pdf-to-jpg`
- `https://fileconverter-three.vercel.app/tools/pdf-to-word`
- `https://fileconverter-three.vercel.app/tools/pdf-to-powerpoint`
- `https://fileconverter-three.vercel.app/tools/pdf-to-excel`
- `https://fileconverter-three.vercel.app/tools/pdf-to-pdf-a`

- [ ] Each page: overflow check, touch check, screenshot
- [ ] PdfToJpg: check quality slider has `<label>` and is keyboard accessible
- [ ] PdfToWord/Excel/Powerpoint: check output format selector is accessible

- [ ] Commit
```bash
git add src/components/PdfToJpg.jsx src/components/PdfToWord.jsx src/components/PdfToPowerpoint.jsx src/components/PdfToExcel.jsx src/components/PdfToPdfA.jsx src/index.css
git commit -m "fix(from-pdf): batch mobile, slider/select a11y fixes"
```

---

## Task 20: Batch Verify Group 3 — Universal Converter + Image Tools

**Pages:** UniversalConverter (and its route aliases: jpg-to-png, png-to-jpg, webp-to-jpg, heic-to-jpg, bmp-to-png)

**URLs:**
- `https://fileconverter-three.vercel.app/tools/converter`
- `https://fileconverter-three.vercel.app/tools/jpg-to-png`
- `https://fileconverter-three.vercel.app/tools/png-to-jpg`
- `https://fileconverter-three.vercel.app/tools/heic-to-jpg`
- `https://fileconverter-three.vercel.app/tools/webp-to-jpg`
- `https://fileconverter-three.vercel.app/tools/bmp-to-png`

- [ ] Converter: overflow check, touch check, a11y snapshot (format selector, quality slider, popular conversions grid), screenshot at 375px, 480px, 768px
- [ ] Each alias route: overflow check, touch check, screenshot — verify UI updates for format preset

- [ ] Commit
```bash
git add src/components/UniversalConverter.jsx src/index.css
git commit -m "fix(converter): mobile, a11y, format selector fixes"
```

---

## Task 21: Group 4 — OCR Tool (photo-to-markdown + ocr-pdf)

**Files:**
- Modify: `src/components/OcrTool.jsx`
- Modify: `src/index.css`

**URLs:**
- `https://fileconverter-three.vercel.app/tools/ocr-pdf`
- `https://fileconverter-three.vercel.app/tools/photo-to-markdown`

- [ ] Navigate to ocr-pdf, emulate 375px, screenshot full page

- [ ] Run overflow check, touch target check

- [ ] A11y: output text area has `<label>`, copy button has `aria-label`, language selector has label

- [ ] Check output text area — must be readable on mobile, scrollable within bounds

- [ ] Emulate 480px, 768px, screenshot each

- [ ] Navigate to photo-to-markdown (same component, different type prop), repeat checks

- [ ] Run Lighthouse mobile audit on ocr-pdf

- [ ] Fix all issues

- [ ] Commit
```bash
git add src/components/OcrTool.jsx src/index.css
git commit -m "fix(ocr): mobile layout, textarea a11y, label fixes"
```

---

## Task 22: Group 4 — GIF Maker

**Files:**
- Modify: `src/components/GifMaker.jsx`
- Modify: `src/index.css`

**URL:** `https://fileconverter-three.vercel.app/tools/gif`

- [ ] Navigate, emulate 375px, screenshot

- [ ] Run overflow check — frame list, preview, controls

- [ ] Run touch target check — play/pause, add/remove frame, FPS slider, export button

- [ ] A11y: FPS slider has `<label>`, frame thumbnails have alt text, controls have aria-labels

- [ ] Check preview canvas `max-width: 100%` on mobile

- [ ] Emulate 480px, 768px, screenshot each

- [ ] Run Lighthouse mobile audit

- [ ] Light mode toggle, screenshot

- [ ] Fix all issues

- [ ] Commit
```bash
git add src/components/GifMaker.jsx src/index.css
git commit -m "fix(gif-maker): mobile overflow, canvas sizing, a11y fixes"
```

---

## Task 23: Group 4 — Edit PDF

**Files:**
- Modify: `src/components/EditPdf.jsx`
- Modify: `src/components/pdf-editor/EditorToolbar.jsx`
- Modify: `src/components/pdf-editor/PageCanvas.jsx`
- Modify: `src/components/pdf-editor/ThumbnailSidebar.jsx`
- Modify: `src/index.css`

**URL:** `https://fileconverter-three.vercel.app/tools/edit-pdf`

- [ ] Navigate, emulate 375px, screenshot — editor likely needs significant mobile work

- [ ] Run overflow check — canvas, toolbar, sidebar

- [ ] Check if toolbar is usable on 375px — buttons likely too small or clipped

- [ ] Check ThumbnailSidebar collapses or hides on mobile (takes too much space)

- [ ] Run touch target check on toolbar buttons — annotate/draw tools must be ≥44px

- [ ] A11y: toolbar buttons have aria-labels (Bold, Italic, Draw, etc.), canvas has aria-label="PDF editor canvas"

- [ ] Emulate 768px — at tablet, sidebar may work alongside canvas

- [ ] Emulate 1024px — full editor layout

- [ ] Fix: add mobile layout (sidebar hidden by default with toggle button, toolbar wraps)

- [ ] Run Lighthouse mobile audit

- [ ] Commit
```bash
git add src/components/EditPdf.jsx src/components/pdf-editor/EditorToolbar.jsx src/components/pdf-editor/PageCanvas.jsx src/components/pdf-editor/ThumbnailSidebar.jsx src/index.css
git commit -m "fix(edit-pdf): mobile layout, sidebar toggle, toolbar a11y"
```

---

## Task 24: Group 4 — Sign PDF

**Files:**
- Modify: `src/components/SignPdf.jsx`
- Modify: `src/index.css`

**URL:** `https://fileconverter-three.vercel.app/tools/sign-pdf`

- [ ] Navigate, emulate 375px, screenshot

- [ ] Run overflow check — signature canvas must not overflow

- [ ] Run touch target check — draw/type/upload signature tabs, clear button, apply button

- [ ] Check signature canvas has proper touch event handling (`touch-action: none` on canvas to prevent scroll while drawing)

- [ ] A11y: tabs have `role="tab"`, canvas has `aria-label="Signature drawing area"`, clear button has aria-label

- [ ] Test: can user draw signature with touch on mobile? Verify `touch-action` CSS

- [ ] Emulate 768px, screenshot

- [ ] Fix all issues

- [ ] Commit
```bash
git add src/components/SignPdf.jsx src/index.css
git commit -m "fix(sign-pdf): touch-action on canvas, tab a11y, mobile layout"
```

---

## Task 25: Group 4 — Redact PDF

**Files:**
- Modify: `src/components/RedactPdf.jsx`
- Modify: `src/index.css`

**URL:** `https://fileconverter-three.vercel.app/tools/redact-pdf`

- [ ] Navigate, emulate 375px, screenshot

- [ ] Run overflow check — PDF preview and redaction selection handles

- [ ] Run touch target check — redact selection tool, apply button

- [ ] Check selection handles on mobile — pinch-zoom / touch selection must not conflict with browser zoom

- [ ] A11y: redaction tool has aria-label, apply button clear, undo button present and labeled

- [ ] Emulate 768px, screenshot

- [ ] Fix issues

- [ ] Commit
```bash
git add src/components/RedactPdf.jsx src/index.css
git commit -m "fix(redact-pdf): mobile selection, a11y fixes"
```

---

## Task 26: Group 4 — Compare PDF

**Files:**
- Modify: `src/components/ComparePdf.jsx`
- Modify: `src/index.css`

**URL:** `https://fileconverter-three.vercel.app/tools/compare-pdf`

- [ ] Navigate, emulate 375px, screenshot — dual-pane layout likely breaks at mobile

- [ ] Run overflow check

- [ ] Check if side-by-side diff collapses to stacked layout at mobile

- [ ] Run touch target check

- [ ] A11y: left/right panels have aria-labels ("Original PDF", "Compared PDF"), diff highlights described

- [ ] Emulate 768px — stacked or side-by-side?

- [ ] Fix: if dual-pane overflows at 375px, stack panels vertically

- [ ] Commit
```bash
git add src/components/ComparePdf.jsx src/index.css
git commit -m "fix(compare-pdf): mobile stacked layout, a11y panel labels"
```

---

## Task 26b: ComingSoon Pages + PdfInteractivePreview

**Pages:** compress-pdf, repair-pdf, ai-summarizer, translate-pdf (all render `ComingSoon.jsx`)
**Component:** `PdfInteractivePreview.jsx` (used in tools that show PDF page preview)

**Files:**
- Modify: `src/components/ComingSoon.jsx`
- Modify: `src/components/PdfInteractivePreview.jsx`

- [ ] Navigate to `https://fileconverter-three.vercel.app/tools/compress-pdf`, emulate 375px, screenshot
- [ ] Run overflow check, touch target check — CTA links and email/notify buttons ≥44px
- [ ] A11y check: `<h1>` present, CTA has clear label, page not empty of content
- [ ] Verify all 4 ComingSoon routes render same component correctly
- [ ] Navigate to a tool that uses `PdfInteractivePreview` (e.g., split-pdf after upload), screenshot preview panel at 375px
- [ ] Check preview thumbnails don't overflow, have alt text or aria-label
- [ ] Fix any issues

- [ ] Commit
```bash
git add src/components/ComingSoon.jsx src/components/PdfInteractivePreview.jsx
git commit -m "fix(coming-soon, pdf-preview): mobile and a11y fixes"
```

---

## Task 27: Final Pass — Lighthouse Batch on Key Pages

Run Lighthouse mobile audit on 5 key pages, record all scores, fix any remaining performance issues.

**Pages:**
- `/` (Home)
- `/tools`
- `/tools/converter`
- `/tools/merge-pdf`
- `/tools/edit-pdf`

For each:
```
navigate_page url: <url>
lighthouse_audit categories: ["performance","accessibility","best-practices","seo"]
```

- [ ] Record scores in a table
- [ ] Fix any accessibility score < 90: check specific flagged items
- [ ] Fix any performance score < 90: check LCP, CLS, render-blocking
- [ ] Fix any best-practices issues (HTTPS, no errors in console)

- [ ] Commit
```bash
git add src/index.css src/components/*.jsx
git commit -m "fix: lighthouse final pass — performance and a11y fixes"
```

---

## Task 28: Final — Push + Verify on Vercel

- [ ] Push all commits to GitHub
```bash
git push origin master
```

- [ ] Wait for Vercel deployment (check via `vercel ls` or CLI — should show `● Ready` within 60s)

- [ ] Navigate Chrome DevTools to `https://fileconverter-three.vercel.app/`

- [ ] Emulate 375px, run overflow check, screenshot

- [ ] Navigate to `/tools/merge-pdf`, run overflow check, screenshot

- [ ] Navigate to `/tools/edit-pdf`, run overflow check, screenshot

- [ ] All three must return `canScrollX: false` before marking audit complete

---

## Definition of Done (per page)

- [ ] `canScrollX: false` at 375px, 480px, 768px, 1024px
- [ ] Zero touch targets < 44px
- [ ] Zero images missing `alt`
- [ ] Zero icon buttons missing `aria-label`
- [ ] Exactly 1 `<h1>`, no heading-level skips
- [ ] All form inputs have labels
- [ ] Lighthouse accessibility ≥ 90
- [ ] Lighthouse performance ≥ 90 (or documented exception with reason)
- [ ] Dark and light mode render correctly
- [ ] Animations stop under `prefers-reduced-motion`
- [ ] Chrome DevTools before/after screenshots committed
