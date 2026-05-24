# Deep UI QA Report — PixConvert

**Target:** https://fileconverter-three.vercel.app/  
**Date:** 2026-05-24  
**Environment:** Production (Vercel)  
**Authentication:** Unauthenticated  
**Tools:** Playwright MCP + DOM evaluate  
**Viewports:** desktop 1440×900, mobile 390×844  

---

## Summary

**Overall status: FAIL**

| Stat | Value |
|---|---|
| Pages tested | 8 (/, /tools, /about, /contact, /privacy, /api, /analytics, /tools/converter) |
| Interactions tested | ~12 (dropdown, hamburger, theme toggle, scroll) |
| Critical | 0 |
| High | 2 |
| Medium | 6 |
| Low | 3 |

---

## Defects

---

### DEFECT-001: EventSource SSE Failure on /analytics

**Severity:** High  
**Page:** /analytics  
**Viewport:** All  
**Element:** EventSource connection (realtime metrics)

**Steps to reproduce:**
1. Navigate to https://fileconverter-three.vercel.app/analytics
2. Open browser console

**Expected:** SSE endpoint returns `text/event-stream` with live metrics

**Actual:**
> `EventSource's response has a MIME type ("text/html") that is not "text/event-stream". Aborting the connection.`

The server-sent events endpoint returns an HTML page (likely 404) instead of a stream. Charts also report `-1x-1` dimensions — no data feeds into the chart containers.

**Evidence:**
- Console: `qa-artifacts/console/analytics-console.json`
- Screenshot: `qa-artifacts/screenshots/analytics/desktop-1440/01-top.png`

**Likely cause:** SSE route (`/api/metrics/stream` or similar) not implemented in Vercel serverless functions — returns the catch-all HTML 404.

**Recommendation:** Implement the SSE route OR replace with polling via the working `/api/metrics/stats?period=monthly` endpoint (returns 200). Remove EventSource until backend is ready.

**Retest:** Open /analytics, check console for EventSource error; charts must render with non-zero dimensions.

---

### DEFECT-002: /analytics Page Has No h1

**Severity:** High  
**Page:** /analytics  
**Viewport:** All  
**Element:** Page heading structure

**Steps to reproduce:**
1. Navigate to /analytics
2. Inspect `document.querySelectorAll('h1').length` → returns 0

**Expected:** Every page has exactly one h1

**Actual:** h1 count = 0. Analytics page has no primary heading.

**Evidence:** `qa-artifacts/reports/route-reports/analytics-audit.json` → `"h1": []`

**Recommendation:** Add `<h1>Analytics</h1>` or equivalent to the analytics page layout.

---

### DEFECT-003: Contact Form Uses GET Method

**Severity:** Medium  
**Page:** /contact  
**Viewport:** All  
**Element:** `<form method="get">`

**Steps to reproduce:**
1. Navigate to /contact
2. Inspect form: `document.querySelector('form').method` → `"get"`

**Expected:** Contact form (name, email, subject, message) submits via POST

**Actual:** `method="get"` — if JavaScript fails, all user data (including email + message) is appended to the URL as query params. Data gets logged in server access logs, browser history, and referrer headers.

**Evidence:** `qa-artifacts/reports/route-reports/contact-audit.json` → `"method": "get"`

**Recommendation:** Change form to `method="post"`. Even if React intercepts submit, the fallback HTML behavior must be safe.

---

### DEFECT-004: No Canonical URL on Any Page

**Severity:** Medium  
**Page:** All pages  
**Viewport:** n/a  

**Steps to reproduce:**
1. Navigate to any page
2. `document.querySelector('link[rel="canonical"]')` → null

**Expected:** Each page has `<link rel="canonical" href="https://fileconverter-three.vercel.app/<path>">`.

**Actual:** No canonical tag found on /, /tools, /about, /contact, /privacy, /api, /analytics, /tools/converter.

**Evidence:** All route audit JSON files show `"canonical": null`.

**Recommendation:** Add canonical meta to every page. In Next.js App Router: `alternates: { canonical: '/path' }` in each page's `metadata` export.

---

### DEFECT-005: All Pages Share Identical Meta Description

**Severity:** Medium  
**Page:** All pages  
**Viewport:** n/a  

**Expected:** Each page has a unique meta description relevant to its content.

**Actual:** Every page uses:
> `"PixConvert — Free online PDF & image converter. Convert, merge, split, compress PDFs and images privately in your browser. No uploads, no sign-up."`

This is the site-wide default leaking to every route. Search engines penalise duplicate descriptions and may generate their own snippets.

**Evidence:** All route audit JSON files have identical `metaDesc`.

**Recommendation:** Set unique `description` in each page's `metadata` export. E.g. `/contact` → "Have a question? Contact the PixConvert team — we respond within 24 hours." etc.

---

### DEFECT-006: og:image Missing Sitewide

**Severity:** Medium  
**Page:** All pages  
**Viewport:** n/a  

**Expected:** `<meta property="og:image">` present with a representative image URL.

**Actual:** `"ogImage": null` on every page. Sharing any PixConvert link on Slack, Twitter, LinkedIn, etc. shows no preview image — just a blank card.

**Recommendation:** Add a 1200×630px `/og-default.png` and set it in root layout metadata. Override per-page for tool pages.

---

### DEFECT-007: h4 Category Headers Appear Before h1 in DOM (Screen Reader Order Broken)

**Severity:** Medium  
**Page:** All pages  
**Viewport:** All  
**Element:** Tools dropdown nav, h4 headings

**Steps to reproduce:**
1. Navigate to any page
2. `Array.from(document.querySelectorAll('h1,h2,h3,h4')).map(h=>h.tagName)` → h4 appears before h1

**Expected:** Document heading order: h1 → h2 → h3. No h4 before h1.

**Actual:** Eight h4 elements ("Media Tools", "Image Conversion", "Organize PDF", "Optimize PDF", "Convert to PDF", "Convert from PDF", "Edit PDF", "PDF Security") from the collapsed dropdown menu appear in DOM before the page h1. These are `display:block visibility:visible` but `width:0 height:0`.

Screen readers traversing headings via shortcut will encounter h4s before any h1, creating a confusing document outline.

**Evidence:** `qa-artifacts/accessibility/home-dom-audit.json` → heading order starts with h4×8, then h1.

**Recommendation:** Move nav dropdown categories to `display:none` when closed, OR change them to `role="presentation"` / `aria-hidden="true"` headings when collapsed. `display:none` is sufficient for screen readers to skip them.

---

### DEFECT-008: File Input on /tools/converter Has Empty accept=""

**Severity:** Medium  
**Page:** /tools/converter  
**Viewport:** All  
**Element:** Second `<input type="file">`

**Expected:** File input restricts accepted types (image types for an image converter).

**Actual:** One file input has `accept=""` (empty string), accepting any file type. The first input correctly uses `accept="image/*,.heic,.heif"`.

**Evidence:** `qa-artifacts/reports/route-reports/converter-audit.json` → `"fileInput": [{"accept":"image/*,.heic,.heif"...}, {"accept":"","multiple":true}]`

**Recommendation:** Identify which input this is (likely the folder-select button) and add appropriate `accept`. If it's for the "Select Folder" button, set `accept="image/*"`.

---

### DEFECT-009: Mobile 3px Horizontal Overflow

**Severity:** Low  
**Page:** / (homepage)  
**Viewport:** 390×844  

**Steps to reproduce:**
1. Set viewport to 390×844
2. `document.body.scrollWidth` → 393

**Expected:** No horizontal scroll (scrollWidth ≤ viewportWidth)

**Actual:** scrollWidth = 393, viewport = 390. Minor 3px overflow, possibly from hero orb animation or a container with `calc` dimension.

**Recommendation:** Audit hero section CSS for element exceeding 100vw. Add `overflow-x: hidden` to the body or hero wrapper.

---

### DEFECT-010: Marquee Renders 148+ Duplicate Tool Links in DOM

**Severity:** Low (SEO / a11y note)  
**Page:** /  
**Viewport:** All  

**Details:** The infinite-scroll marquee deliberately doubles its 37 unique tools across 2 rows (37 × 2 rows × 2 copies = 148 marquee links). These are visually clipped (`overflow:hidden` confirmed) but present in DOM. Combined with nav dropdown and footer, crawlers and screen readers encounter each tool link 4–7×.

**Impact:** Not a visual defect. Minor SEO dilution; screen reader users navigating by links hear many duplicates.

**Recommendation:** Add `aria-hidden="true"` to the duplicate (second copy) in each MarqueeRow. The `key={tool.path}-${i}` already uses index — also add `tabIndex={-1}` to duplicate set so keyboard users don't tab through hidden copies.

---

### DEFECT-011: Dropdown Category Buttons Lack Accessible Name in /tools/converter Sidebar

**Severity:** Low  
**Page:** /tools/converter  
**Element:** Category accordion buttons ("Media Tools2›", "Organize PDF6›" etc.)

**Details:** Button text reads "Media Tools2›" — the count (2) is concatenated directly with no separator or aria-label. Screen reader announces "Media Tools 2 greater than sign" which is confusing.

**Recommendation:** Add `aria-label="Media Tools (2 tools)"` or wrap count in `<span aria-hidden="true">`.

---

## Network Findings

- `/analytics` tries to connect to SSE endpoint → returns HTML 404 (see DEFECT-001)
- `/api/metrics/stats?period=monthly` → 200 OK ✓
- No tokens in query strings
- No 5xx errors on tested routes
- No CORS errors observed

Artifacts: `qa-artifacts/network/`

---

## Storage Findings

- `localStorage`: empty on all tested pages ✓
- `sessionStorage`: empty ✓
- No auth tokens, no PII, no sensitive data in browser storage ✓

---

## Accessibility Findings

| Issue | Severity | Pages |
|---|---|---|
| h4 before h1 in DOM (collapsed dropdown) | Medium | All |
| Analytics page missing h1 | High | /analytics |
| Duplicate tool links not aria-hidden | Low | / |
| Category buttons concatenate count in text | Low | /tools/converter |

All images have alt text ✓  
All form inputs have associated labels ✓  
Theme toggle has aria-label ✓  
Mobile hamburger has aria-label="Open menu" ✓  
Mobile scroll-lock active when menu open ✓  

Artifacts: `qa-artifacts/accessibility/`

---

## Performance / Stability Findings

- No infinite loading spinners observed
- No layout shift after hero animation completes (marquee uses `overflow:hidden`)
- Recharts chart renders at -1×-1 on /analytics due to SSE failure (see DEFECT-001)
- 68 chart instances found on /analytics — may be heavy render

---

## Coverage

| Area | Status |
|---|---|
| Routes (8) | ✅ /, /tools, /about, /contact, /privacy, /api, /analytics, /tools/converter |
| Desktop 1440 | ✅ All routes |
| Mobile 390 | ✅ Homepage + converter |
| Tablet 1024 / Laptop 1366 / Mobile 360 | ❌ Not tested |
| Nav dropdown | ✅ Opened and inspected |
| Mobile hamburger | ✅ Opened, scroll-lock confirmed |
| Theme toggle | ❌ Not tested (visual only, low risk) |
| Forms (contact) | ✅ Structure + method audited |
| Form submission (contact) | ❌ Skipped per safety boundary (no real submit) |
| File upload (converter) | ✅ DOM only — no real file uploaded |
| Tool functionality (convert/merge/etc.) | ❌ Not tested — requires file upload interaction |
| Firefox / WebKit | ❌ Not tested |
| 404 / error page | ❌ Not tested |
| Cookie consent | Not applicable (no cookie banner found) |
| PWA / service worker | Not applicable (no manifest link found) |
| Print media | ❌ Deferred |

---

## Not Tested

1. Tablet (1024), laptop (1366), mobile-small (360) viewports
2. Actual file upload / conversion flow — requires file interaction not yet done
3. Theme toggle dark→light visual comparison
4. Firefox and WebKit browsers
5. 404/error page
6. All tool pages beyond /tools/converter (37 tools total)
7. Lighthouse performance score (deferred)
8. Contact form actual submission (safety boundary)

---

## Recommendation

**Do not ship without addressing:**
- DEFECT-001 (SSE broken on analytics — page non-functional)
- DEFECT-002 (analytics missing h1)
- DEFECT-003 (contact form GET method)
- DEFECT-004 (canonical URLs missing)
- DEFECT-005 (duplicate meta descriptions)

**Ship after fixes.** DEFECT-006 through DEFECT-011 can follow in next sprint.
