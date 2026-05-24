# UI Visual QA Report — PixConvert

**Date:** 2026-05-24  
**Mode:** Playwright MCP (Mode 1) — Live browser  
**Product type:** SaaS Utility (PDF & image tools) — consumer-facing, dark-first editorial  
**Industry reference:** Linear (`design-md/linear.app/DESIGN.md`) — dark-first SaaS, single accent color, surface ladder  
**Viewports audited:** 1440×900, 390×844  
**Themes tested:** Dark ✅ · Light ✅  
**Pages tested:** `/` (home)  
**Baseline:** First run — baselines created  

---

## Phase 1 — Visual Regression Summary

First-run audit — no prior baselines exist. Baselines created from this run.

| Page | Viewport | Theme | Status |
|------|----------|-------|--------|
| `/` | desktop-1440 | dark | ✅ Baseline created |
| `/` | desktop-1440 | light | ✅ Baseline created |
| `/` | mobile-390 | dark | ✅ Baseline created |

**Notable Phase 1 observation:** Framer Motion `whileInView` sections (`.how-it-works`) freeze at `opacity: 0` in static full-page capture — sections below fold appear invisible in full-page screenshot but render correctly when scrolled into view. Not a visual defect; expected JS-animation behavior.

---

## Phase 2 — Design Quality Audit Summary

| # | Category | Findings | Critical | Major | Minor | Info |
|---|----------|----------|----------|-------|-------|------|
| 2.1 | Typography | 5 | 0 | 2 | 3 | 0 |
| 2.2 | Color & Contrast | 2 | 0 | 1 | 1 | 0 |
| 2.3 | Spacing grid | 2 | 0 | 1 | 1 | 0 |
| 2.4 | Component states | 1 | 0 | 1 | 0 | 0 |
| 2.5 | Animation & motion | 1 | 0 | 0 | 0 | 1 |
| 2.6 | Icon system | 0 | — | — | — | — |
| 2.7 | Image quality | 0 | — | — | — | — |
| 2.8 | Responsive / touch targets | 4 | 0 | 3 | 1 | 0 |
| 2.9 | Dark / light theme | 1 | 0 | 1 | 0 | 0 |
| 2.10 | Content consistency | 1 | 0 | 1 | 0 | 0 |
| **TOTAL** | | **17** | **0** | **10** | **5** | **2** |

---

## Phase 3 — Industry Benchmark Summary

**Reference:** Linear (https://raw.githubusercontent.com/voltagent/awesome-design-md/main/design-md/linear.app/DESIGN.md)

| Dimension | Linear reference | PixConvert | Gap |
|-----------|-----------------|------------|-----|
| Spacing base | 4px | 4px (inferred) | ✅ Match |
| Typography weights | 2 (400, 600) | 6 (400/500/600/700/800/900) | ⚠️ Over-proliferation |
| Display line-height | 1.05–1.15 | 1.0 on H1 ✅, 1.6 on H2 | ⚠️ H2 too loose |
| Body line-height | 1.50 | 1.75 | ⚠️ Too loose |
| Button shape | 8px radius (standard) | 999px pill all buttons | ℹ️ Different approach |
| Chromatic accent | 1 (lavender-blue) | 1 (#FF4F00 orange) | ✅ Match in principle |
| Dark mode approach | Surface ladder | Warm dark surface ladder | ✅ Similar approach |
| Minimum text size | ~12px body | 9.6px (pipe-detail-step) | ❌ Below minimum |
| Touch targets | 44px min | 28px nav-logo, 34px toggle | ❌ Multiple fails |
| Component states | Hover/press/focus defined | Hover missing on outline btn | ⚠️ Gap |

---

## All Defects

---

### VIS-DEFECT-1
**Category:** Content Consistency  
**Phase:** 2  
**Severity:** Major  
**Page:** `/`  
**Viewport:** all  
**Description:** Hero visual panel displays "37+ TOOLS AVAILABLE" while the hero stats row below shows "40+ TOOLS AVAILABLE" — two different numbers for the same metric on the same page.  
**Industry reference:** Linear maintains single source of truth for all metrics — never contradicts itself within the same page view.  
**Fix:** Update `Home.jsx` — `hero-ed-big-num` hardcodes `37` while `STATS` array has `{ num: 40 }`. Either drive the big number from the same data source or update the hardcoded value to match. Use `STATS[0].num` (40) for the visual panel stat.

---

### VIS-DEFECT-2
**Category:** Touch Targets (2.8)  
**Phase:** 2  
**Severity:** Major  
**Page:** `/`  
**Viewport:** mobile-390  
**Description:** `.nav-logo` link is 160×**28px** — 16px below the 44px minimum. Users with motor impairments cannot reliably tap the logo to navigate home.  
**Industry reference:** Linear nav logo area has `min-height: 44px` via flex centering within the nav bar. Google Mobile Usability requires 44px tap targets.  
**Fix:**
```css
.nav-logo {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
}
```

---

### VIS-DEFECT-3
**Category:** Touch Targets (2.8)  
**Phase:** 2  
**Severity:** Major  
**Page:** `/`  
**Viewport:** mobile-390  
**Description:** `.theme-toggle` button is 34×34px — 10px short in both dimensions. Icon-only button with no accessible padding.  
**Industry reference:** Linear's theme toggle is 44×44px with `padding: 10px` around a 24px icon.  
**Fix:**
```css
.theme-toggle {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

---

### VIS-DEFECT-4
**Category:** Touch Targets (2.8)  
**Phase:** 2  
**Severity:** Major  
**Page:** `/`  
**Viewport:** mobile-390  
**Description:** All footer nav links have height **36px** (not 44px). This affects ~15 links in the mobile footer. Also `.mobile-popular-pill` links are 37–38px and `.mobile-browse-all` is 36px.  
**Industry reference:** Linear footer links use `padding: 10px 0` minimum, hitting 44px tap height even on small type.  
**Fix:**
```css
/* Footer links */
footer a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
}
/* Mobile pills */
.mobile-popular-pill {
  min-height: 44px;
}
.mobile-browse-all {
  min-height: 44px;
}
```

---

### VIS-DEFECT-5
**Category:** Typography (2.1)  
**Phase:** 2  
**Severity:** Major  
**Page:** `/`  
**Viewport:** all  
**Description:** `.pipe-detail-step` label ("STEP 2 OF 3") renders at **9.6px** — well below the 12px minimum for legible body text and below the 11px threshold that triggers iOS font size adjustment. This is the smallest text on the site.  
**Industry reference:** Linear's smallest UI label (caption/overline) is 11px with 500 weight. No text drops below 11px.  
**Fix:** Increase `font-size` of `.pipe-detail-step` to minimum `11px`, recommended `12px`:
```css
.pipe-detail-step {
  font-size: 11px; /* was ~0.7rem clamp → resolves to 9.6px at some viewport */
}
```
Check the clamp/rem calculation — likely `0.6rem` or `clamp(…)` resolving too small.

---

### VIS-DEFECT-6
**Category:** Color & Contrast (2.2)  
**Phase:** 2  
**Severity:** Major  
**Page:** `/`  
**Viewport:** all (dark theme)  
**Description:** `.pipe-detail-step` orange text `#FF4F00` on dark panel bg `rgb(54,52,46)` = approx **3.6:1 contrast ratio**. WCAG AA requires 4.5:1 for normal text under 18pt/14pt-bold. At 9.6px this is a double failure (size + contrast).  
**Measured:** text `rgb(255,79,0)` on bg `rgb(54,52,46)` → luminance ratio ≈ 3.6:1 (need 4.5:1).  
**Industry reference:** Linear's accent color (#5e6ad2) achieves 4.7:1 on its dark surface-0 background.  
**Fix:** Either lighten the text to `#FF7A33` (≈ 4.6:1 on that bg) or use `var(--text)` cream color for the step label and reserve orange for emphasis only.

---

### VIS-DEFECT-7
**Category:** Spacing (2.3)  
**Phase:** 2  
**Severity:** Major  
**Page:** `/`  
**Viewport:** all  
**Description:** Gap between `.how-it-works` section bottom and `footer` top is **~200px** — a large empty dark/light strip with no visual purpose. The `.section-divider` line sits inside this gap but doesn't explain 200px of whitespace.  
**Industry reference:** Linear's section-to-footer transition uses 96px max (their `section` spacing token). 200px is 2× the intended section separation.  
**Fix:** Reduce `.container` padding-bottom or `.section-divider` margin to `64px` or `96px` (on 4pt/8pt grid).

---

### VIS-DEFECT-8
**Category:** Dark/Light Theme (2.9)  
**Phase:** 2  
**Severity:** Major  
**Page:** `/`  
**Viewport:** desktop-1440  
**Description:** `.btn-outline` ("How it works" CTA) has `background: rgb(255,255,255)` + `border: 2px solid rgb(32,21,21)` — a solid white-fill button with dark border. In **dark mode** this is intentionally legible (white pill on dark bg ✅). In **light mode** the white fill on `#FFFEFB` near-white page background makes the button nearly invisible — only the 2px dark border distinguishes it.  
**Observed computed:** `background: rgb(255,255,255)`, `backgroundColor` identical to page bg in light mode.  
**Industry reference:** Linear's secondary button uses `background: var(--color-surface-1)` — one step brighter than page bg in both themes, ensuring always-visible distinction.  
**Fix (light mode override):**
```css
[data-theme="light"] .btn-outline {
  background: var(--bg2); /* #F2F1ED — distinguishable from #FFFEFB page bg */
  border-color: var(--border);
}
```

---

### VIS-DEFECT-9
**Category:** Typography (2.1)  
**Phase:** 2  
**Severity:** Minor  
**Page:** `/`  
**Viewport:** all  
**Description:** Body paragraph line-height computed at **1.75** (29.4px on 16.8px). Linear's body spec is 1.50. PixConvert body runs 17% looser than reference — text columns appear low-density, costing vertical rhythm.  
**Fix:** Set `line-height: 1.6` on `.hero-ed-desc` and body text globally (`1.6` is the acceptable max for IBM Plex Sans at 16–17px).

---

### VIS-DEFECT-10
**Category:** Typography (2.1)  
**Phase:** 2  
**Severity:** Minor  
**Page:** `/`  
**Viewport:** all  
**Description:** `.how-it-works h2` line-height is **1.6** (66.56px on 41.6px). For a display headline at 40px+, Linear targets 1.10–1.15. A 1.6 line-height on a 2-line headline creates excessive vertical space between lines, reducing impact.  
**Fix:**
```css
.how-it-works h2 {
  line-height: 1.15; /* was 1.6 */
}
```

---

### VIS-DEFECT-11
**Category:** Typography (2.1)  
**Phase:** 2  
**Severity:** Minor  
**Page:** `/`  
**Viewport:** all  
**Description:** Site uses **6 font weights** (400, 500, 600, 700, 800, 900) across components. Trust items use 500, nav links 500/600, pipe title 700, H2 800, H1 900. Each weight downloads a separate font variant.  
**Industry reference:** Linear uses exactly 2 weights (400 body + 600 display). Vercel uses 400 + 700. More than 3 = page weight and visual inconsistency.  
**Fix:** Consolidate to 3 weights max: `400` (body/muted), `700` (labels/emphasis), `900` (display/headline). Drop 500, 600, 800.

---

### VIS-DEFECT-12
**Category:** Typography (2.1)  
**Phase:** 2  
**Severity:** Minor  
**Page:** `/`  
**Viewport:** all  
**Description:** `.trust-item` text renders at **11.84px** and `.hero-stat .lbl` at **10.88px** — both below the 12px body-text minimum for legibility on standard-density displays.  
**Industry reference:** Linear's smallest visible label is 11px (and only used for metadata). Body-adjacent trust signals should be ≥ 12px.  
**Fix:**
```css
.trust-item { font-size: 12px; } /* was clamp resolving to 11.84px */
.hero-stat .lbl { font-size: 11px; } /* was 10.88px — bump to 11px minimum */
```

---

### VIS-DEFECT-13
**Category:** Touch Targets (2.8)  
**Phase:** 2  
**Severity:** Minor  
**Page:** `/`  
**Viewport:** mobile-390  
**Description:** All `.tool-chip` links in the marquee are **43px tall** — 1px below the 44px Google/Apple minimum.  
**Fix:**
```css
.tool-chip {
  min-height: 44px; /* was padding resolving to 43px */
}
```

---

### VIS-DEFECT-14
**Category:** Spacing (2.3)  
**Phase:** 2  
**Severity:** Minor  
**Page:** `/`  
**Viewport:** all  
**Description:** Hero visual panel (`.hero-ed-loader-wrap`) is 184px tall and contains the BoxLoader 3D canvas. When `prefers-reduced-motion: reduce` is active, this area renders completely empty — 184px of blank space between "37+ TOOLS AVAILABLE" label and the 6 tool badges.  
**Industry reference:** Linear replaces animated hero elements with static product screenshots — always-present content regardless of motion preference.  
**Fix:** Add a static fallback inside the reduced-motion branch in `Home.jsx`:
```jsx
{reducedMotion ? (
  <div className="hero-ed-static-grid" aria-hidden="true">
    {/* Static mini tool grid or decorative grid pattern */}
  </div>
) : (
  <div className="hero-3d-scene hero-loader-scene">
    <BoxLoader />
  </div>
)}
```

---

### VIS-DEFECT-15
**Category:** Component States (2.4)  
**Phase:** 2  
**Severity:** Major  
**Page:** `/`  
**Viewport:** all  
**Description:** `.btn-outline` in dark mode is a white-fill pill. In dark theme, `dark:hover` state is undefined in CSS — hovering changes nothing visible (no background shift, no border color change, no scale). The outline button has no hover/focus state in dark mode.  
**Industry reference:** Linear's secondary button: hover shifts surface from surface-1 → surface-2 (one step brighter). Always produces visible hover feedback.  
**Fix:**
```css
.btn-outline:hover {
  background: var(--bg3); /* slightly off-white in dark, slightly grayer in light */
  border-color: var(--text);
}
.btn-outline:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

---

### VIS-DEFECT-16 (Info)
**Category:** Animation & Motion (2.5)  
**Phase:** 2  
**Severity:** Info  
**Page:** `/`  
**Viewport:** all  
**Description:** The BoxLoader 3D canvas is the only content in the hero right panel between the "37+" stat and the tool badges. When animations freeze for screenshots/testing, the area shows only a static low-poly pink shape. No static premium visual representation of the product exists.  
**Industry reference:** Vercel's hero uses a static product screenshot with a glow effect as base — animation is additive, not the only signal.  
**Fix:** Consider adding a decorative grid or static tool category pattern behind the BoxLoader so the panel has content depth even without animation.

---

### VIS-DEFECT-17 (Info)
**Category:** Spacing (2.3)  
**Phase:** 2  
**Severity:** Info  
**Page:** `/`  
**Viewport:** all  
**Description:** Buttons use `border-radius: 999px` (pill shape) while pipeline steps use `border-radius: 10px` and hero visual panel uses `border-radius: 12px`. Three distinct radius systems exist. Not wrong but inconsistent border-radius language.  
**Industry reference:** Linear uses 4 defined radii (4px/8px/12px/16px) — pill is reserved for toggle controls only, not page CTAs.  
**Fix (Info — low priority):** Decide on pill vs rounded CTA policy and document as a design token. Current pill CTA is a valid brand choice; just ensure it doesn't co-exist with inconsistent radii elsewhere.

---

## Priority Fix List

| Priority | Defect | Effort | Impact |
|----------|--------|--------|--------|
| **P1** | VIS-DEFECT-1: 37+ vs 40+ content inconsistency | Low (5 min) | Brand trust |
| **P1** | VIS-DEFECT-5: pipe-detail-step 9.6px text | Low (5 min) | Readability + a11y |
| **P1** | VIS-DEFECT-6: pipe-detail-step contrast 3.6:1 | Low (10 min) | WCAG AA |
| **P1** | VIS-DEFECT-2: nav-logo 28px touch target | Low (5 min) | Mobile usability |
| **P1** | VIS-DEFECT-3: theme-toggle 34px touch target | Low (5 min) | Mobile usability |
| **P2** | VIS-DEFECT-4: footer + pill links 36px touch targets | Low (15 min) | Mobile usability |
| **P2** | VIS-DEFECT-8: btn-outline invisible in light mode | Low (10 min) | Light theme CTA |
| **P2** | VIS-DEFECT-15: btn-outline no hover state dark mode | Low (10 min) | Interaction feedback |
| **P2** | VIS-DEFECT-7: 200px gap HIW → footer | Low (5 min) | Layout rhythm |
| **P3** | VIS-DEFECT-9: body line-height 1.75 | Low (5 min) | Typography |
| **P3** | VIS-DEFECT-10: h2 line-height 1.6 | Low (5 min) | Typography |
| **P3** | VIS-DEFECT-12: trust-item/stat-label text size | Low (10 min) | Readability |
| **P3** | VIS-DEFECT-13: tool-chip 43px (1px short) | Low (2 min) | Touch target |
| **P3** | VIS-DEFECT-11: 6 font weights | Medium (30 min) | Performance + clarity |
| **P4** | VIS-DEFECT-14: reduced-motion empty panel | Medium (45 min) | Reduced-motion UX |
| **Info** | VIS-DEFECT-16: BoxLoader no static fallback | Medium | Visual depth |
| **Info** | VIS-DEFECT-17: 3 radius systems | Low | Design system |

---

## Not Tested
- `/tools`, `/tools/merge-pdf`, `/about`, `/contact`, `/privacy` pages
- Tablet 1024px viewport
- Firefox / WebKit cross-browser rendering
- Print media
- Form validation states (contact page)
- Keyboard tab order full traversal
- Lighthouse Performance score (blocked by Vercel checkpoint)
- CLS measurement (Framer animations prevent stable measure)
- Component states: modal open/close, dropdown states, hamburger nav
