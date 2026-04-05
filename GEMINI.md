# PixConvert — Gemini CLI Context

## Project Identity
**PixConvert** is a privacy-first, high-performance file conversion suite.
All conversion logic runs **client-side in the browser** whenever technically feasible.
The Express backend is a thin layer for uploads, cleanup, and contact form handling only.

---

## Tech Stack (Quick Reference)

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router 7 (SPA) |
| Backend | Express (Node.js), Multer, Nodemailer |
| File Processing | pdf-lib, pdfjs-dist, docx, pptxgenjs, xlsx (SheetJS) |
| Media / OCR | tesseract.js, gif.js, heic2any, html2canvas |
| Security | DOMPurify, express-rate-limit |

**Entry Points:** `src/App.jsx` (routing), `server.js` (Express), `src/utils/fileHelpers.js` (shared helpers)

**Run Commands:**
- Frontend dev: `npm run dev` → `http://localhost:5173`
- Backend: `npm run server` → `http://localhost:4000`
- Lint: `npm run lint`
- Build: `npm run build` → `dist/`

---

## Non-Negotiable Rules (Always Apply)

1. **Privacy first.** New conversion features MUST be implemented client-side. Do not move browser-capable logic to the server.
2. **Lazy-load all tools.** Every new route in `App.jsx` must use `React.lazy()` + `<Suspense fallback={<LoadingFallback />}>`.
3. **Reuse before creating.** Check `src/utils/fileHelpers.js` for `readFile`, `loadImg`, and other helpers before writing new utilities.
4. **Sanitize HTML output.** Any feature involving HTML-to-PDF or OCR output must pass content through `DOMPurify`.
5. **No CSS frameworks.** Style using the existing Vanilla CSS in `src/index.css`. Do not add Tailwind, Bootstrap, or similar unless explicitly asked.
6. **Do not touch upload storage logic** unless the task specifically involves file lifecycle/cleanup. Uploads auto-purge after 7 days via a 1-hour interval in `server.js`.

---

## Task-Gated Instructions

> Read the task type first. Apply only the section that matches.

### MODE A — Planning / Architecture
*Trigger: New feature design, tech decision, refactor strategy.*

- Think in phases: (1) Can this be browser-only? (2) What existing util can be extended? (3) What is the smallest new surface area?
- Produce a numbered plan with file paths affected before writing any code.
- Ask for confirmation before proceeding to implementation.

### MODE B — Implementation / Debugging
*Trigger: Writing or modifying code, fixing a bug, adding a component.*

- Scope changes to the minimum files needed. List them upfront.
- Follow the existing component pattern in `src/components/` — check 2–3 existing files before creating a new one.
- After any change to `server.js`, verify rate-limit and cleanup logic is untouched unless the task requires it.
- For bugs: state the root cause hypothesis before patching.

### MODE C — Review / Audit
*Trigger: Code review, security check, performance analysis, lint fix.*

- Focus review on: privacy leaks, missing sanitization, bundle-size regressions, and missing lazy-load wrappers.
- Report findings as: `[CRITICAL]`, `[WARNING]`, `[SUGGESTION]` — do not silently apply fixes.
- Do not refactor working code during a review pass unless explicitly asked.

---

## Model Selection

| Task | Model |
|---|---|
| Architecture, planning, multi-file reasoning | `gemini-2.5-pro` |
| Implementation, debugging, moderate complexity | `gemini-2.0-flash` |
| Lint, syntax check, single-file quick tasks | `gemini-2.0-flash-lite` |

**Default to `gemini-2.0-flash`** when the task type is ambiguous.

---

## Token Efficiency Guidelines

- **Scope context to the task.** Provide only the files directly relevant to the current change. Avoid full-codebase dumps.
- **Incremental over monolithic.** Break large feature requests into focused sub-tasks (one component or one util at a time).
- **Explicit over verbose.** Prefer short, direct prompts ("Review `MergePdf.jsx` for missing DOMPurify calls") over open-ended ones ("Review the whole project").
- **Compress on long sessions.** Use `/compress` when context grows long. Follow with: "Continue from the last confirmed state."

---

## Code Review Graph (Token-Saving Index)

> **Purpose:** Instead of reading the full codebase every session, Gemini maintains a compact dependency graph at `.gemini/CODE_GRAPH.md`. Each session reads the graph first, then opens only the files directly relevant to the task.

### Bootstrap Rule (First Run Only)
If `.gemini/CODE_GRAPH.md` does not exist, generate it immediately before doing anything else:

```
TASK: Bootstrap CODE_GRAPH.md
1. Scan src/components/, src/utils/, src/App.jsx, server.js
2. For each file record: name, path, exports, direct imports, and any library used from the tech stack
3. Write the result to .gemini/CODE_GRAPH.md using the schema below
4. Confirm: "Code graph bootstrapped. N nodes written."
```

Do NOT proceed with any user task until the graph exists.

### Graph Schema (`.gemini/CODE_GRAPH.md`)

```markdown
# PixConvert Code Graph
_Last updated: YYYY-MM-DD | Nodes: N_

## Routes (App.jsx lazy routes)
| Route Path | Component File | Status |
|---|---|---|
| /merge-pdf | src/components/MergePdf.jsx | stable |
| /convert | src/components/UniversalConverter.jsx | stable |

## Components
### MergePdf.jsx
- **Imports:** pdf-lib, src/utils/fileHelpers.js (readFile)
- **Exports:** default MergePdf
- **Uses server:** no
- **Last reviewed:** YYYY-MM-DD
- **Flags:** —

### UniversalConverter.jsx
- **Imports:** heic2any, html2canvas, src/utils/fileHelpers.js (readFile, loadImg)
- **Exports:** default UniversalConverter
- **Uses server:** no
- **Last reviewed:** YYYY-MM-DD
- **Flags:** —

## Utilities (src/utils/)
### fileHelpers.js
- **Exports:** readFile, loadImg
- **Used by:** MergePdf.jsx, UniversalConverter.jsx, [list all]

## Server Endpoints (server.js)
| Method | Path | Purpose |
|---|---|---|
| POST | /upload | Multer file intake |
| POST | /contact | Nodemailer email |
| DELETE | /cleanup | Manual purge trigger |

## Dependency Index (library → components)
| Library | Used In |
|---|---|
| pdf-lib | MergePdf.jsx, [others] |
| tesseract.js | [components] |
| DOMPurify | [components requiring sanitization] |
```

### Session Start Protocol (Every Session)

```
BEFORE any task:
1. Read .gemini/CODE_GRAPH.md                    ← small, fast
2. Identify nodes relevant to the current task
3. Read ONLY those files                         ← targeted, not full scan
4. Proceed with the task
```

This replaces full directory scans. Never run `find src/ -name "*.jsx"` or read all components unless the task explicitly requires it (e.g., a full audit).

### Update Protocol (After Every Structural Change)

After any task that adds, removes, or modifies a file's imports/exports, patch the affected nodes in `.gemini/CODE_GRAPH.md`:

```
AFTER task completion (if files changed):
1. Identify which graph nodes were affected
2. Update ONLY those nodes (imports, exports, flags, last-reviewed date)
3. Increment the node count if new files were added
4. Update the _Last updated_ timestamp
5. Do NOT rewrite the entire graph — patch in place
```

### Flag System

Use flags in the graph to mark files needing attention:

| Flag | Meaning |
|---|---|
| `NEEDS_REVIEW` | Modified but not yet reviewed |
| `MISSING_SANITIZE` | HTML/OCR output without DOMPurify confirmed |
| `NO_LAZY` | Route component not wrapped in React.lazy yet |
| `USES_SERVER` | Verify this shouldn't be browser-side |
| `STALE` | Graph entry not verified in 30+ days |

Set flags during implementation. Clear them during a MODE C review pass.

### Review Targeting with the Graph

For MODE C (Review/Audit), use the graph as a filter:

```
1. Read CODE_GRAPH.md
2. List all nodes where Flags ≠ "—"
3. Review flagged files only
4. Clear flags after confirming fixes
5. Update Last reviewed date
```

This reduces review token cost to flagged surface area only, not the full codebase.

---

## What NOT to Do

- Do NOT add server-side processing for tasks achievable in the browser.
- Do NOT introduce new npm dependencies without confirming they are not already covered by existing libraries in the stack.
- Do NOT wrap responses in Markdown code fences if raw output was requested.
- Do NOT silently rename, move, or delete existing files — always state the change and reason first.
- Do NOT generate placeholder/lorem content in production-facing components.