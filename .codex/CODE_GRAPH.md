# Codex Code Graph

Use this file before broad file reads. It is a compact routing and dependency map for PixConvert.

For exact ownership while editing, read `.codex/FILE_OUTLINE_MAP.md` after this file.

## Entry Points
- `src/main.jsx`: mounts the React app and imports `src/index.css`.
- `src/App.jsx`: top-level router, page titles, lazy-loaded tool routes, navbar/footer shell.
- `server.js`: Express endpoints for `/api/contact`, `/api/upload`, and file admin routes.

## High-Value UI Surfaces
- `src/components/Home.jsx`: landing page hero, feature cards, trust strip, and the new PDF upload preview hero via `src/components/ui/demo.jsx`.
- `src/components/Tools.jsx`: tools index layout.
- `src/components/Navbar.jsx` / `src/components/Footer.jsx`: global chrome.

## New Upload UI
- `src/components/ui/demo.jsx`: home-page demo wrapper that renders PDF previews from an uploaded file.
- `src/components/ui/pdf-preview-page.jsx`: upload card and screenshot gallery UI.
- `src/components/ui/button.jsx`, `card.jsx`, `alert.jsx`: shadcn-style primitives adapted to this repo.
- `tailwind.config.js`, `postcss.config.js`, `components.json`, `tsconfig.json`: support files for Tailwind, shadcn-compatible structure, and TS/TSX support.

## PDF Tool Cluster
- Security/edit tools: `SignPdf.jsx`, `RedactPdf.jsx`, `ComparePdf.jsx`, `PdfUnlocker.jsx`, `PdfLocker.jsx`
- Organize tools: `MergePdf.jsx`, `SplitPdf.jsx`, `RemovePages.jsx`, `ExtractPages.jsx`, `OrganizePdf.jsx`
- Convert from PDF: `PdfToJpg.jsx`, `PdfToWord.jsx`, `PdfToPowerpoint.jsx`, `PdfToExcel.jsx`, `PdfToPdfA.jsx`
- Convert to PDF: `JpgToPdf.jsx`, `WordToPdf.jsx`, `PowerpointToPdf.jsx`, `ExcelToPdf.jsx`, `HtmlToPdf.jsx`

## Shared Helpers
- `src/utils/pdfRasterizer.js`: shared PDF.js page rasterization helper.
- `src/utils/formatSize.js`: file-size display helper used across many tools.
- `src/utils/fileHelpers.js`: image/file loading helpers used by converter flows.
- `src/utils/pdfPasswordCheck.js`: encrypted-PDF detection helper.
- `src/lib/utils.js`: `cn()` helper for class composition.

## Route Hotspots
- `/`: `Home.jsx`
- `/tools/*`: all main tool routes live under the nested router in `App.jsx`
- `/tools/sign-pdf`, `/tools/redact-pdf`, `/tools/compare-pdf`: latest launched tools
- `/about`, `/privacy`, `/contact`: static/support pages

## Token-Saving Workflow
1. Read this file first.
2. Read `.codex/FILE_OUTLINE_MAP.md` to identify the owning file.
3. Open `src/App.jsx` only if the route map or lazy imports matter.
4. Jump directly to the relevant component/helper pair instead of scanning `src/components/` broadly.
5. For PDF tasks, check `pdfRasterizer.js`, `formatSize.js`, and the nearest sibling PDF tool before exploring elsewhere.
