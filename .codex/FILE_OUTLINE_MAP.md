# File Outline Map

Use this before editing. It is narrower than `CODE_GRAPH.md` and is meant to answer: "which exact file owns this change?"

## App Shell
- `src/App.jsx`: route table, lazy imports, document title handling.
- `src/main.jsx`: React mount only.
- `src/index.css`: global theme tokens, shared layout, navbar, hero, upload, and progress-loader styling.

## Global Chrome
- `src/components/Navbar.jsx`: header structure, desktop menubar hookup, mobile drawer.
- `src/components/Footer.jsx`: footer branding and support links.
- `src/components/ui/app-menu-bar.jsx`: desktop header menu content and route grouping.
- `src/components/ui/menubar.jsx`: shared Radix menubar primitive wrappers.

## Landing Page
- `src/components/Home.jsx`: hero loader block, homepage headline, feature cards, trust strip.
- `src/components/ui/box-loader.jsx`: floating hero 3D loader.

## Shared Upload / Progress
- `src/components/DropZone.jsx`: shared upload card used by tool flows.
- `src/components/ui/prism-flux-loader.jsx`: upload animation inside `DropZone`.
- `src/components/ToolProgressBar.jsx`: shared processing-state container for tools.
- `src/components/ui/process-box-loader.jsx`: processing animation used by `ToolProgressBar`.

## Tool Routing and Catalog
- `src/components/Tools.jsx`: tool index page and individual tool page shell.
- `src/data/toolsData.js`: tool categories, names, icons, routes, and descriptions.

## PDF Security Tools
- `src/components/SignPdf.jsx`: sign flow, signature placement, signed export.
- `src/components/RedactPdf.jsx`: preview rendering, box drawing, redacted export.
- `src/components/ComparePdf.jsx`: dual upload, page diffing, compare results.
- `src/utils/pdfRasterizer.js`: shared raster preview helper used by security/edit flows.

## Conversion / Utility Hotspots
- `src/components/UniversalConverter.jsx`: image conversion workflow.
- `src/components/GifMaker.jsx`: GIF build flow.
- `src/components/PdfToWord.jsx`, `PdfToExcel.jsx`, `PdfToPowerpoint.jsx`: PDF extraction flows.
- `src/utils/formatSize.js`: shared size formatting.
- `src/lib/utils.js`: shared `cn()` helper for UI primitives.

## Token-Saving Rule
1. Read `FILE_OUTLINE_MAP.md` first.
2. Open only the owning file plus one nearest shared dependency.
3. Avoid broad scans of `src/components/` unless the owner file is unclear.
