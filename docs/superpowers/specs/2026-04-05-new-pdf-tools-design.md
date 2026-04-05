# Design Spec: New PDF Tools (Sign, Redact, Compare)
_Date: 2026-04-05_

## 1. Goal
Implement three high-performance, privacy-first PDF tools:
- **Sign PDF:** Digital signature tool (Draw, Upload, Type).
- **Redact PDF:** Securely remove sensitive content via rasterization.
- **Compare PDF:** Visual pixel-diffing of two PDF documents.

---

## 2. Architecture & Tech Stack
- **PDF Manipulation:** `pdf-lib` (client-side).
- **PDF Rendering:** `pdfjs-dist` (for previews and rasterization).
- **Diffing:** `pixelmatch` (for Compare tool).
- **Canvas Processing:** Native Browser Canvas API.

---

## 3. Tool Details

### ✍️ Sign PDF
- **Mechanism:**
  1. Load PDF using `pdf-lib`.
  2. Overlay signature (Canvas drawing, Image upload, or Cursive font) onto a selected page.
  3. Allow user to drag/resize the signature on a preview.
  4. Flatten the signature into the PDF and download.
- **Key Files:** `src/components/SignPdf.jsx`.

### ⬛ Redact PDF
- **Mechanism:**
  1. Load PDF and convert pages to high-DPI images using `pdfjs-dist`.
  2. User draws black rectangles over sensitive areas on a canvas.
  3. Permanently "burn" the black boxes into the image data.
  4. Re-assemble images into a new, text-less PDF (Maximum Security).
- **Key Files:** `src/components/RedactPdf.jsx`.

### ⚖️ Compare PDF
- **Mechanism:**
  1. Load two PDF documents.
  2. Rasterize corresponding pages from both files to Canvas.
  3. Use `pixelmatch` to compare the image data and highlight differences in a "diff canvas".
  4. Show the original pages and the highlighted diff side-by-side.
- **Key Files:** `src/components/ComparePdf.jsx`.

---

## 4. Implementation Steps
1. Create the React components for each tool.
2. Update `App.jsx` to lazy-load and route to these new components.
3. Update `toolsData.js` to remove `comingSoon: true` and link to the new paths.
4. Add necessary utility helpers (e.g., `rasterizePdf`) if they don't exist.

---

## 5. Security & Privacy
- **Client-Side Only:** No data ever leaves the user's browser.
- **Redaction Security:** Rasterization ensures text metadata is completely gone.
