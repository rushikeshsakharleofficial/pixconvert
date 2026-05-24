# Deep UI QA Report — /api page

Target: https://fileconverter-three.vercel.app/api

Date: 2026-05-24

Environment: Production (Vercel)

Authentication: Unauthenticated

Tools used: Playwright MCP + source inspection

Viewports tested:
- Desktop 1440×900 (dark + light)
- Tablet 1024×768 (light)
- Mobile 390×844 (dark + light)

Themes tested: Dark ✅ · Light ✅

Destructive actions: None performed

---

## Summary

Overall status: **FAIL** — 2 High defects, 2 Medium defects, 4 Low defects

Pages tested: 1 (`/api`)  
Interactions tested: expand endpoint, search (valid + no-results), copy button, theme toggle  
Screenshots: 15 viewport + scroll + interaction captures

Defects:
- Critical: 0
- High: 2
- Medium: 2
- Low: 4

---

## Defects

---

### DEFECT-1: Code blocks have hardcoded dark background in light theme — unreadable text

Severity: **High**

Page: `/api`

Viewport: All (desktop 1440, tablet 1024, mobile 390)

Element: Quick Start code block wrappers (`div > pre > code`)

Steps to reproduce:
1. Navigate to `https://fileconverter-three.vercel.app/api`
2. Switch to **light mode** via the theme toggle (top-right)
3. Scroll to the "Quick Start" section

Expected: Code block background adapts to light theme (light grey, off-white, or similar)

Actual: Code block wrapper `backgroundColor: rgb(26, 26, 46)` — a near-black navy color — hardcoded regardless of theme. The code text uses `color: rgb(15, 15, 16)` (near-black) against this dark background, producing a contrast ratio of approximately **1.2:1** (WCAG requires 4.5:1 minimum for normal text, 3:1 for large text). Text is essentially invisible.

Evidence:
- Screenshot: `qa-artifacts/screenshots/api/desktop-1440/light-03-scroll-quickstart.png`
- Screenshot: `qa-artifacts/screenshots/api/tablet-1024/light-02-code-blocks.png`
- Screenshot: `qa-artifacts/screenshots/api/mobile-390/light-02-quickstart-code.png`
- JS: `codeWrapperBg: "rgb(26, 26, 46)"` confirmed at desktop, tablet, mobile in light mode

Likely cause: The code block wrapper uses a hardcoded `background-color: #1a1a2e` (or equivalent) instead of a CSS variable that respects the `[data-theme="light"]` context.

Recommendation:
```css
/* Replace hardcoded background with CSS variable */
.code-block-wrapper, .api-code-wrap {
  background-color: var(--code-bg, #1a1a2e);
}
[data-theme="light"] {
  --code-bg: #f1f1f4;
}
[data-theme="dark"] {
  --code-bg: #1a1a2e;
}
```

Retest steps: Switch to light mode → scroll to Quick Start → verify code blocks have light background and readable text.

---

### DEFECT-2: Horizontal scroll on mobile (390px) caused by off-screen nav menu positioning

Severity: **High**

Page: `/api`

Viewport: Mobile 390×844

Element: `.nav-links` UL + `.mobile-only` LI items

Steps to reproduce:
1. Open `https://fileconverter-three.vercel.app/api` at 390px wide
2. Do not open the nav menu
3. Scroll horizontally

Expected: No horizontal scroll. Off-screen nav menu does not add to `body.scrollWidth`.

Actual: `body.scrollWidth = 393` vs `window.innerWidth = 390` — 3px overflow. The `.nav-links` element is positioned at `right: 780` (double viewport) and mobile pill items extend to `right: 758`. Because these elements use `left`/positional offset rather than `transform: translateX(100%)`, they contribute to the scrollable document width.

Evidence:
- JS: `hasHScroll: true, bodyScrollWidth: 393, windowWidth: 390`
- JS overflowers: `nav-links right:780`, `mobile-popular-pill "✂️ Split PDF" right:758`
- Screenshot: `qa-artifacts/screenshots/api/mobile-390/dark-01-top.png`

Likely cause: Mobile nav slide-out uses `left: 100%` or `transform: translateX(390px)` but the body/html does not have `overflow-x: hidden` to prevent the document from expanding.

Recommendation:
```css
/* Option A — use transform instead of positional offset */
.nav-links { transform: translateX(100%); } /* not left: 100% */

/* Option B — clip body overflow on mobile */
@media (max-width: 768px) {
  body { overflow-x: hidden; }
}
```

Note: A previous fix (`overflow-x: clip` on html) addressed this at the html level but the body still shows scroll extent. Ensure `overflow-x: clip` or `hidden` is applied to both `html` AND `body`.

Retest steps: Open at 390px → inspect `document.body.scrollWidth` → should be ≤ 390.

---

### DEFECT-3: Search input missing accessible label — screen readers cannot identify the field

Severity: **Medium**

Page: `/api`

Viewport: All

Element: `input[placeholder="Search endpoints..."]`

Steps to reproduce:
1. Navigate to `/api`
2. Scroll to "All Endpoints" section
3. Inspect search input with screen reader or accessibility audit

Expected: Input has `aria-label`, `aria-labelledby`, or an associated `<label>` element describing its purpose.

Actual:
```json
{ "id": "", "ariaLabel": null, "ariaLabelledBy": null, "hasLabelElement": false }
```
Only a `placeholder` attribute is present. Placeholder text is not announced as a label by screen readers and disappears when the user types.

Evidence: JS audit on search input properties.

Recommendation:
```jsx
<label htmlFor="endpoint-search" className="sr-only">Search API endpoints</label>
<input
  id="endpoint-search"
  aria-label="Search API endpoints"
  placeholder="Search endpoints... (e.g. merge, compress, jpg)"
  ...
/>
```

Retest steps: `document.querySelector('input').getAttribute('aria-label')` should return non-null.

---

### DEFECT-4: Endpoint accordion buttons missing aria-expanded — screen readers cannot determine expanded state

Severity: **Medium**

Page: `/api`

Viewport: All

Element: Individual endpoint row buttons (e.g. `POST /api/v1/merge-pdf Merge multiple PDFs into one +`)

Steps to reproduce:
1. Navigate to `/api`
2. Scroll to "All Endpoints"
3. Click any endpoint button (e.g. `/api/v1/merge-pdf`)
4. Inspect the button's `aria-expanded` attribute

Expected: Button has `aria-expanded="false"` when collapsed, `aria-expanded="true"` when expanded, and `aria-controls` pointing to the content panel.

Actual: `aria-expanded: null` — the attribute is absent. The `+`/`−` visual indicator changes but the state is not communicated to assistive technology. (Category-level buttons like "Organize PDF6›" correctly have `aria-expanded`, but individual endpoint buttons do not.)

Evidence:
- JS: `mergeBtnAriaExpanded: null` after expand
- JS: `endpointContainers` only shows category buttons with `aria-expanded`, not individual endpoint buttons

Recommendation:
```jsx
<button
  aria-expanded={isOpen}
  aria-controls={`endpoint-${id}`}
  onClick={toggle}
>
  <span>POST</span> /api/v1/merge-pdf ...
  <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
</button>
<div id={`endpoint-${id}`} hidden={!isOpen}>
  {/* expanded content */}
</div>
```

Retest steps: Click endpoint → `button.getAttribute('aria-expanded')` should return `"true"`.

---

### DEFECT-5: Category accordion buttons have aria-expanded but no aria-controls

Severity: **Low**

Page: `/api`

Viewport: All

Element: Category sidebar buttons (e.g. "Organize PDF6›", "Media Tools2›")

Expected: `aria-controls="<panel-id>"` pointing to the managed region.

Actual: `ariaControls: null`. Screen readers announce the expanded state but cannot programmatically identify the controlled element.

Recommendation: Add `aria-controls="category-{name}"` and `id="category-{name}"` on the corresponding panel.

---

### DEFECT-6: Search results not announced to screen readers — no aria-live region

Severity: **Low**

Page: `/api`

Viewport: All

Element: Endpoint search results area

Steps: Type in search box → filter applies → screen reader does not announce result count.

Expected: `aria-live="polite"` region announces "3 endpoints match 'compress'" or similar.

Actual: `hasLiveRegion: false` — no `aria-live`, `role="status"`, or `role="alert"` present.

Recommendation:
```jsx
<p aria-live="polite" className="sr-only">
  {filteredCount === 0 ? `No endpoints match "${query}"` : `${filteredCount} endpoint${filteredCount > 1 ? 's' : ''} found`}
</p>
```

---

### DEFECT-7: Copy button provides no visual success feedback

Severity: **Low**

Page: `/api`

Viewport: All

Element: "Copy" buttons in Quick Start and Error Responses code blocks

Steps: Click any "Copy code" button

Expected: Button text or icon changes to "Copied!" (or similar) for ~2s to confirm clipboard write succeeded.

Actual: Button text remains "Copy" with no visual state change. User receives no confirmation that the copy succeeded.

Recommendation:
```jsx
const [copied, setCopied] = useState(false);
const handleCopy = () => {
  navigator.clipboard.writeText(code);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};
// Button label: {copied ? 'Copied!' : 'Copy'}
// aria-label: {copied ? 'Code copied to clipboard' : 'Copy code'}
```

---

### DEFECT-8: Code blocks use JetBrains Mono — inconsistent with IBM Plex Mono design system

Severity: **Low**

Page: `/api`

Viewport: All

Element: `<code>` elements in Quick Start + Error Responses

Expected: Code blocks use `IBM Plex Mono` (the established mono font from the redesign: `--mono: 'IBM Plex Mono', monospace`).

Actual: `fontFamily: "JetBrains Mono", "Fira Code", monospace` — neither IBM Plex Mono nor is it loaded from Google Fonts alongside the site's font stack.

Evidence: JS `codeStyle.fontFamily: "\"JetBrains Mono\", \"Fira Code\", monospace"`.

Recommendation: Apply `font-family: var(--mono)` to code blocks in the API page CSS.

---

## Network findings

- 0 API errors (no XHR/fetch requests — page is fully static)
- No token leaks in URLs
- No secrets in page source
- Static assets only (JS bundle, CSS, fonts, favicon)

---

## Storage findings

- `localStorage: {}` on cold load — correct (no pre-set data)
- `localStorage: { 'pixconvert-theme': 'light' }` after theme toggle — correct ✅
- No sensitive data in storage

---

## Accessibility findings summary

| Finding | Severity |
|---------|----------|
| Search input — no aria-label | Medium |
| Endpoint accordion — no aria-expanded | Medium |
| Category accordion — no aria-controls | Low |
| Search results — no aria-live region | Low |
| Heading order: H2 in footer not preceded by H1 in footer landmark | Informational |

Heading order in main content: H1 → H2 → H3 → H2 → H3 → H2 → H3 → H2 ✅ (correct)

---

## SEO findings

| Check | Result |
|-------|--------|
| `<title>` | "API Documentation — PixConvert" ✅ |
| `meta description` | Present, 84 chars ✅ |
| Canonical | `https://fileconverter-three.vercel.app/api` ✅ |
| `og:title` | Present ✅ |
| `og:description` | Present ✅ |
| `og:image` | Present ✅ |
| `twitter:card` | `summary_large_image` ✅ |
| `robots` meta | Absent (defaults to index) ✅ |
| Single `<h1>` | ✅ "PixConvert API" |
| No placeholder links (`href="#"`) | ✅ |
| No unsafe `target="_blank"` | ✅ |
| No duplicate IDs | ✅ |

---

## Performance / stability

- No console errors or warnings ✅
- No network errors ✅
- Expand/collapse works correctly ✅
- Search filters correctly (valid + no-results state) ✅
- Theme toggle persists to localStorage ✅
- Theme toggle label updates correctly ✅
- No infinite loading states ✅
- Response times: all static, instant ✅

---

## Theme comparison

| Element | Dark | Light | Pass? |
|---------|------|-------|-------|
| Page background | Dark navy | Off-white `#fffefb` | ✅ |
| Foreground text | Light | Near-black `rgb(15,15,16)` | ✅ |
| H1 color | Light | `rgb(15,15,16)` | ✅ |
| Stat numbers (35, 50MB…) | Orange `#FF4F00` | Orange `#FF4F00` | ✅ |
| Endpoint buttons | Adapts | Adapts | ✅ |
| Code block wrapper | Dark `#1a1a2e` | **Dark `#1a1a2e` — NOT ADAPTED** | ❌ DEFECT-1 |
| Footer section color | `#BE3600` | `#BE3600` | ✅ |
| Theme toggle label | "Switch to light mode" | "Switch to dark mode" | ✅ |

---

## Responsive summary

| Viewport | H-Scroll | Nav | Code blocks | Endpoint search |
|----------|----------|-----|-------------|----------------|
| 1440×900 | None ✅ | Full nav ✅ | Readable (dark) / broken (light) ❌ | Works ✅ |
| 1024×768 | None ✅ | Full nav ✅ | Broken (light) ❌ | Works ✅ |
| 390×844 | 3px ❌ | Hamburger ✅ | Broken (light) ❌ | Works ✅ |

---

## Not tested

- Firefox / WebKit cross-browser (Chromium only)
- Keyboard tab-order traversal (full end-to-end)
- Clipboard API write success (headless browser blocks clipboard)
- Reduced motion preference
- 360×640 small mobile viewport
- Print media
- Offline / service worker (no PWA manifest detected)
- Authenticated state (no auth on this site)
- Back/forward navigation state persistence

---

## Recommendation

**Do not ship light theme as-is.** DEFECT-1 (code blocks unreadable in light mode) is a High-severity regression that makes the page's primary content unusable in light mode. DEFECT-2 (mobile horizontal scroll) is also High.

**Fix DEFECT-1 and DEFECT-2 before next production deploy.** Medium accessibility defects (DEFECT-3, DEFECT-4) should be addressed in the next iteration.

---

## Fix plan

| Priority | Defect | File | Change |
|----------|--------|------|--------|
| 🔴 1 | Code block light theme | `src/index.css` or API page CSS | Replace `background: #1a1a2e` with `var(--code-bg)`; add light/dark value |
| 🔴 2 | Mobile H-scroll | `src/index.css` | Add `overflow-x: hidden` to `body` or use `transform` on nav drawer |
| 🟡 3 | Search aria-label | `src/components/ApiDocs.jsx` (or equivalent) | Add `aria-label="Search API endpoints"` + `id` + `<label>` |
| 🟡 4 | Endpoint aria-expanded | API accordion component | Add `aria-expanded={open}` + `aria-controls` to each endpoint button |
| 🟢 5 | Copy feedback | Copy button component | Change text to "Copied!" for 2s |
| 🟢 6 | IBM Plex Mono for code | `src/index.css` | `code { font-family: var(--mono); }` |
| 🟢 7 | Category aria-controls | Category button component | Add `aria-controls="category-{id}"` |
| 🟢 8 | aria-live for search | Search results container | Add `role="status"` with result count |
