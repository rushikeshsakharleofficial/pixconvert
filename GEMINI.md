# GEMINI.md

## Project Overview
**PixConvert** is a high-performance, privacy-first file conversion suite. It leverages modern web technologies to perform complex file transformations directly in the browser, ensuring sensitive documents remain local whenever possible.

### Main Technologies
- **Frontend:** React 19, Vite, React Router 7 (SPA).
- **Backend:** Express (Node.js) for file uploads, administrative functions, and contact form handling.
- **File Manipulation:** `pdf-lib`, `pdfjs-dist`, `docx`, `pptxgenjs`, `xlsx` (SheetJS).
- **Media & Intelligence:** `tesseract.js` (OCR), `gif.js`, `heic2any`, `html2canvas`.

---

## Building and Running

### Frontend (Vite)
- **Development:** `npm run dev` (Starts Vite server at `http://localhost:5173`).
- **Production Build:** `npm run build` (Outputs to `dist/`).
- **Preview Build:** `npm run preview`.
- **Linting:** `npm run lint`.

### Backend (Express)
- **Start Server:** `npm run server` (Starts Express at `http://localhost:4000`).
- **Environment Variables:** Requires `.env` with configurations for `SMTP_HOST`, `ADMIN_EMAIL`, etc. (See `.env.example`).

---

## Architecture and Design

### Hybrid Processing
- **Browser-Side (Preferred):** Most tools (PDF to Word, Image Conversion, GIF Maker) are implemented entirely in JavaScript to maximize privacy and speed.
- **Server-Side (Secondary):** The Express backend handles tasks like static file serving, temporary file storage for uploads, and email communication via Nodemailer.

### Core Structure
- `src/components/`: Contains individual tool implementations (e.g., `MergePdf.jsx`, `UniversalConverter.jsx`).
- `src/utils/`: Shared logic for file reading, PDF manipulation, and format conversions.
- `src/App.jsx`: Main routing logic with **React Lazy** loading for all heavy conversion modules.
- `server.js`: Express entry point with rate limiting and automated file cleanup (7-day retention).

---

## Development Conventions

### 1. Privacy First
- Always attempt to implement new conversion features client-side. Only use the backend for features requiring server-side compute or persistence.

### 2. Performance & Code Splitting
- New tools must be added as lazy-loaded routes in `App.jsx` to keep the initial bundle small.
- Use the `Suspense` component with `LoadingFallback` for consistent UX.

### 3. Styling
- Adhere to the established **Vanilla CSS** patterns found in `src/index.css`. Avoid adding heavy CSS frameworks unless explicitly requested.

### 4. Security & Cleanup
- The server implements `express-rate-limit` and `multer` for secure file handling.
- All uploads are stored in the `uploads/` directory and are automatically pruned by a 1-hour interval timer if they exceed 7 days in age.

### 5. Utilities
- Reuse existing helpers in `src/utils/fileHelpers.js` for common tasks like `readFile` or `loadImg`.
- Use `DOMPurify` for any HTML-to-PDF or OCR-related tasks to prevent XSS.
