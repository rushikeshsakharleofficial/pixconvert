import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense, useRef } from 'react';
import { AnimatePresence, useReducedMotion, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';

// Eagerly loaded (small, always needed)
import Home from './components/Home';
import OcrTool from './components/OcrTool';
import ComingSoon from './components/ComingSoon';
import About from './components/About';
import Privacy from './components/Privacy';
import NotFound from './components/NotFound';

// Lazy loaded (heavy tools — only loaded when navigated to)
const Tools = lazy(() => import('./components/Tools'));
const UniversalConverter = lazy(() => import('./components/UniversalConverter'));
const RotatePdf = lazy(() => import('./components/RotatePdf'));
const AddPageNumbers = lazy(() => import('./components/AddPageNumbers'));
const AddWatermark = lazy(() => import('./components/AddWatermark'));
const CropPdf = lazy(() => import('./components/CropPdf'));
const EditPdf = lazy(() => import('./components/EditPdf'));
const GifMaker = lazy(() => import('./components/GifMaker'));
const PdfUnlocker = lazy(() => import('./components/PdfUnlocker'));
const PdfLocker = lazy(() => import('./components/PdfLocker'));
const PdfToJpg = lazy(() => import('./components/PdfToJpg'));
const PdfToWord = lazy(() => import('./components/PdfToWord'));
const PdfToPowerpoint = lazy(() => import('./components/PdfToPowerpoint'));
const PdfToExcel = lazy(() => import('./components/PdfToExcel'));
const PdfToPdfA = lazy(() => import('./components/PdfToPdfA'));
const MergePdf = lazy(() => import('./components/MergePdf'));
const SplitPdf = lazy(() => import('./components/SplitPdf'));
const RemovePages = lazy(() => import('./components/RemovePages'));
const ExtractPages = lazy(() => import('./components/ExtractPages'));
const OrganizePdf = lazy(() => import('./components/OrganizePdf'));
const ScanToPdf = lazy(() => import('./components/ScanToPdf'));
const JpgToPdf = lazy(() => import('./components/JpgToPdf'));
const WordToPdf = lazy(() => import('./components/WordToPdf'));
const PowerpointToPdf = lazy(() => import('./components/PowerpointToPdf'));
const ExcelToPdf = lazy(() => import('./components/ExcelToPdf'));
const HtmlToPdf = lazy(() => import('./components/HtmlToPdf'));
const Contact = lazy(() => import('./components/Contact'));
const SignPdf = lazy(() => import('./components/SignPdf'));
const RedactPdf = lazy(() => import('./components/RedactPdf'));
const ComparePdf = lazy(() => import('./components/ComparePdf'));
const Analytics = lazy(() => import('./components/Analytics'));
const ApiDocs = lazy(() => import('./components/ApiDocs'));

const BASE_URL = 'https://fileconverter-three.vercel.app';

const PAGE_META = {
  '/': 'PixConvert — Free online PDF & image converter. Convert, merge, split, compress PDFs and images privately in your browser. No uploads, no sign-up.',
  '/tools': 'Browse 40+ free PDF and image tools. Merge, split, compress, convert, rotate, watermark — everything runs in your browser, nothing uploaded.',
  '/about': 'Learn about PixConvert — why we built a 100% client-side, privacy-first file converter with no accounts and no uploads.',
  '/privacy': 'PixConvert Privacy Policy — your files never leave your browser. No data collection, no tracking, no uploads to any server.',
  '/contact': 'Have a question? Contact the PixConvert team — we respond within 24 hours. Feedback and bug reports welcome.',
  '/api': 'PixConvert API Documentation — integrate PDF and image conversion into your apps. Full REST API reference with examples.',
  '/analytics': 'PixConvert usage analytics — real-time metrics on which tools are used most.',
  '/tools/converter': 'Convert images between PNG, JPEG, WebP, AVIF, BMP, TIFF, HEIC and more — free, instant, 100% in your browser. No upload, no account.',
  '/tools/gif': 'Create animated GIFs from images or video frames — free GIF maker running entirely in your browser. No upload required.',
  '/tools/merge-pdf': 'Merge multiple PDF files into one — free, instant, no upload required. Drag, reorder, and combine PDFs in seconds.',
  '/tools/split-pdf': 'Split a PDF into separate pages or custom page ranges — free, private, runs entirely in your browser. No upload.',
  '/tools/pdf': 'Remove PDF password protection instantly — free online PDF unlocker. No file upload, 100% private, works in your browser.',
  '/tools/pdf-lock': 'Add password protection to any PDF — free online PDF locker. Set owner and user passwords, 100% private, no upload.',
  '/tools/compress-pdf': 'Compress PDF file size without losing quality — free online PDF compressor. Reduce PDF size instantly, no upload required.',
  '/tools/pdf-to-jpg': 'Convert PDF pages to high-quality JPG images — free, fast, no signup. Extract every page as a separate JPG instantly.',
  '/tools/pdf-to-word': 'Convert PDF to editable Word document (DOCX) — free online PDF to Word converter. No upload, instant results.',
  '/tools/pdf-to-powerpoint': 'Convert PDF to editable PowerPoint (PPTX) — free online PDF to PowerPoint converter. No upload, instant results.',
  '/tools/pdf-to-excel': 'Convert PDF to Excel spreadsheet (XLSX) — free online PDF to Excel converter. Extract tables from PDFs instantly.',
  '/tools/pdf-to-pdf-a': 'Convert PDF to PDF/A archival format — free online converter. Ensure long-term digital preservation, no upload required.',
  '/tools/remove-pages': 'Remove unwanted pages from any PDF — free online tool. Select pages to delete, instant result, no upload required.',
  '/tools/extract-pages': 'Extract specific pages from a PDF — free online tool. Select any page range and save as a new PDF, no upload.',
  '/tools/organize-pdf': 'Reorder, rotate, and organize PDF pages — free online PDF organizer. Drag and drop to rearrange, no upload required.',
  '/tools/scan-to-pdf': 'Convert scanned images and photos to a PDF — free scan to PDF tool. Works in your browser, no upload required.',
  '/tools/jpg-to-pdf': 'Combine JPG images into a single PDF — free online JPG to PDF converter. Add multiple images, control order, no upload.',
  '/tools/word-to-pdf': 'Convert Word documents (DOCX) to PDF — free online Word to PDF converter. Preserve formatting, no upload required.',
  '/tools/powerpoint-to-pdf': 'Convert PowerPoint presentations (PPTX) to PDF — free online tool. Preserve slides and formatting, no upload required.',
  '/tools/excel-to-pdf': 'Convert Excel spreadsheets (XLSX) to PDF — free online Excel to PDF converter. No upload, instant results.',
  '/tools/html-to-pdf': 'Convert HTML pages to PDF — free online HTML to PDF converter. Paste HTML or a URL, get a PDF instantly.',
  '/tools/rotate-pdf': 'Rotate PDF pages by 90°, 180°, or 270° — free online PDF rotation tool. Rotate all or individual pages, no upload.',
  '/tools/add-page-numbers': 'Add page numbers to any PDF — free online tool. Customize position, font, and format. No upload required.',
  '/tools/add-watermark': 'Add a text or image watermark to any PDF — free online PDF watermark tool. Customize opacity and position, no upload.',
  '/tools/crop-pdf': 'Crop and trim PDF pages — free online PDF cropper. Remove margins, resize pages, works in your browser, no upload.',
  '/tools/edit-pdf': 'Edit PDF files online free — add text, images, and annotations. Runs entirely in your browser, nothing uploaded.',
  '/tools/jpg-to-png': 'Convert JPG to PNG free online — lossless, instant, no upload required. Preserve transparency when converting to PNG.',
  '/tools/png-to-jpg': 'Convert PNG to JPG free online — fast and easy, no upload required. Reduce file size by converting PNG to JPEG.',
  '/tools/webp-to-jpg': 'Convert WebP images to JPG free online — instant, no upload required. Download compatible JPEGs from any WebP file.',
  '/tools/heic-to-jpg': 'Convert HEIC photos to JPG free online — no upload required. Open iPhone HEIC images anywhere by converting to JPEG.',
  '/tools/bmp-to-png': 'Convert BMP images to PNG free online — lossless conversion, no upload required. Reduce BMP file size with PNG.',
  '/tools/photo-to-markdown': 'Extract text from photos with OCR and convert to Markdown — free, runs in your browser, no upload required.',
  '/tools/ocr-pdf': 'Extract text from scanned PDFs with OCR — free online PDF OCR tool. Runs in your browser, no upload required.',
  '/tools/sign-pdf': 'Sign PDF files online free — draw, type, or upload your signature. 100% private, no upload, runs in your browser.',
  '/tools/redact-pdf': 'Redact sensitive text and images from PDFs — free online PDF redaction tool. Permanent removal, no upload required.',
  '/tools/compare-pdf': 'Compare two PDF files side-by-side and highlight differences — free online PDF diff viewer, no upload required.',
};

const PAGE_TITLES = {
  '/': 'PixConvert — Free Online PDF & Image Converter',
  '/tools': 'All PDF & Image Tools — Free, No Upload | PixConvert',
  '/about': 'About PixConvert — Free Browser-Based File Converter',
  '/privacy': 'PixConvert Privacy Policy — No Data, No Uploads',
  '/contact': 'Contact PixConvert — Free PDF & Image Converter Help',
  '/api': 'PixConvert API Docs — PDF & Image Conversion REST API',
  '/tools/converter': 'Free Image Converter Online — PNG, WebP, AVIF | PixConvert',
  '/tools/gif': 'Free GIF Maker Online — Create Animated GIFs | PixConvert',
  '/tools/pdf': 'Unlock PDF Online Free — Remove PDF Password | PixConvert',
  '/tools/pdf-lock': 'Protect PDF with Password Free Online | PixConvert',
  '/tools/pdf-to-jpg': 'Convert PDF to JPG Free Online — High Quality | PixConvert',
  '/tools/pdf-to-word': 'Convert PDF to Word (DOCX) Free Online | PixConvert',
  '/tools/pdf-to-powerpoint': 'Convert PDF to PowerPoint Free Online | PixConvert',
  '/tools/pdf-to-excel': 'Convert PDF to Excel (XLSX) Free Online | PixConvert',
  '/tools/pdf-to-pdf-a': 'Convert PDF to PDF/A Format Free Online | PixConvert',
  '/tools/merge-pdf': 'Merge PDF Files Free Online — No Upload | PixConvert',
  '/tools/split-pdf': 'Split PDF Online Free — Extract Pages Instantly | PixConvert',
  '/tools/remove-pages': 'Remove Pages from PDF Free Online — No Upload | PixConvert',
  '/tools/extract-pages': 'Extract PDF Pages Free Online — No Upload | PixConvert',
  '/tools/organize-pdf': 'Organize & Reorder PDF Pages Free Online | PixConvert',
  '/tools/scan-to-pdf': 'Scan to PDF Free — Camera & Image to PDF | PixConvert',
  '/tools/jpg-to-pdf': 'Convert JPG to PDF Free Online — No Upload | PixConvert',
  '/tools/word-to-pdf': 'Convert Word to PDF Free Online — DOCX to PDF | PixConvert',
  '/tools/powerpoint-to-pdf': 'Convert PowerPoint to PDF Free Online | PixConvert',
  '/tools/excel-to-pdf': 'Convert Excel to PDF Free Online — XLSX to PDF | PixConvert',
  '/tools/html-to-pdf': 'Convert HTML to PDF Free Online — No Upload | PixConvert',
  '/tools/rotate-pdf': 'Rotate PDF Pages Free Online — 90°, 180° | PixConvert',
  '/tools/add-page-numbers': 'Add Page Numbers to Any PDF Free Online | PixConvert',
  '/tools/add-watermark': 'Add Watermark to PDF Online Free — Text & Image | PixConvert',
  '/tools/crop-pdf': 'Crop PDF Pages Free Online — Trim & Resize | PixConvert',
  '/tools/edit-pdf': 'Edit PDF Online Free — Add Text & Annotations | PixConvert',
  '/tools/jpg-to-png': 'Convert JPG to PNG Free Online — Lossless | PixConvert',
  '/tools/png-to-jpg': 'Convert PNG to JPG Free Online — Fast & Easy | PixConvert',
  '/tools/webp-to-jpg': 'Convert WebP to JPG Free Online — Instant | PixConvert',
  '/tools/heic-to-jpg': 'Convert HEIC to JPG Free Online — Fast & Easy | PixConvert',
  '/tools/bmp-to-png': 'Convert BMP to PNG Free Online — Lossless | PixConvert',
  '/tools/photo-to-markdown': 'OCR: Convert Photo to Markdown Free Online | PixConvert',
  '/tools/ocr-pdf': 'PDF OCR Free Online — Extract Text from PDF | PixConvert',
  '/tools/sign-pdf': 'Sign PDF Online Free — Add Signature to PDF | PixConvert',
  '/tools/redact-pdf': 'Redact PDF Online Free — Remove Sensitive Text | PixConvert',
  '/tools/compare-pdf': 'Compare PDF Files Free Online — Diff Viewer | PixConvert',
  '/tools/compress-pdf': 'Compress PDF Online Free — Reduce File Size | PixConvert',
  '/analytics': 'Analytics — PixConvert',
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const observerRef = useRef(null);
  const timerRef = useRef(null);
  const observedElementsRef = useRef([]);

  // Effect for scroll-to-top, title, canonical, and meta updates on route change
  useEffect(() => {
    window.scrollTo(0, 0);

    const title = PAGE_TITLES[pathname] || 'PixConvert — Free Online PDF & Image Converter';
    document.title = title;

    const desc = PAGE_META[pathname] || PAGE_META['/'];
    const canonicalHref = `${BASE_URL}${pathname}`;

    // meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);

    // og:title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);

    // og:description
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', desc);

    // og:url — create if missing
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', canonicalHref);

    // noindex for internal/thin pages
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (pathname === '/analytics') {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, follow');
    } else if (robotsMeta) {
      robotsMeta.setAttribute('content', 'index, follow');
    }

    // twitter:title / twitter:description
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', title);
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', desc);

    // canonical link — create if missing
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalHref);
  }, [pathname]);

  // Effect for reveal animations - runs once on mount
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observerRef.current?.unobserve(entry.target);
          // Remove from tracked elements
          observedElementsRef.current = observedElementsRef.current.filter(el => el !== entry.target);
        }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
    );

    timerRef.current = setTimeout(() => {
      document.querySelectorAll('.reveal:not(.in-view)').forEach(el => {
        if (observerRef.current) {
          observerRef.current.observe(el);
          observedElementsRef.current.push(el);
        }
      });
    }, 80);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      // Unobserve all tracked elements before disconnecting
      observedElementsRef.current.forEach(el => observerRef.current?.unobserve(el));
      observerRef.current?.disconnect();
      observedElementsRef.current = [];
    };
  }, []);

  return null;
};

// Spinner component defined outside App to prevent recreation on render
const Spinner = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
    style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
    <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"
      strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round" />
  </svg>
);

const LoadingFallback = () => (
  <div style={{
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    minHeight: '40vh', color: 'var(--text3)', fontSize: '0.875rem', gap: '0.5rem',
  }}>
    <Spinner /> Loading…
  </div>
);

// Wrapper component that combines ErrorBoundary with lazy-loaded components
const LazyRoute = ({ children }) => (
  <ErrorBoundary>{children}</ErrorBoundary>
);

const AppRoutes = () => {
  const location = useLocation();
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reducedMotion ? false : { opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tools" element={<Tools />}>
              <Route path="converter" element={<LazyRoute><UniversalConverter /></LazyRoute>} />
              <Route path="gif" element={<LazyRoute><GifMaker /></LazyRoute>} />
              <Route path="pdf" element={<LazyRoute><PdfUnlocker /></LazyRoute>} />
              <Route path="pdf-lock" element={<LazyRoute><PdfLocker /></LazyRoute>} />

              {/* Image Conversion */}
              <Route path="jpg-to-png" element={<LazyRoute><UniversalConverter defaultOutputFormat="image/png" /></LazyRoute>} />
              <Route path="png-to-jpg" element={<LazyRoute><UniversalConverter defaultOutputFormat="image/jpeg" /></LazyRoute>} />
              <Route path="webp-to-jpg" element={<LazyRoute><UniversalConverter defaultOutputFormat="image/jpeg" /></LazyRoute>} />
              <Route path="heic-to-jpg" element={<LazyRoute><UniversalConverter defaultOutputFormat="image/jpeg" /></LazyRoute>} />
              <Route path="bmp-to-png" element={<LazyRoute><UniversalConverter defaultOutputFormat="image/png" /></LazyRoute>} />
              <Route path="photo-to-markdown" element={<LazyRoute><OcrTool type="image" /></LazyRoute>} />

              {/* Convert from PDF tools */}
              <Route path="pdf-to-jpg" element={<LazyRoute><PdfToJpg /></LazyRoute>} />
              <Route path="pdf-to-word" element={<LazyRoute><PdfToWord /></LazyRoute>} />
              <Route path="pdf-to-powerpoint" element={<LazyRoute><PdfToPowerpoint /></LazyRoute>} />
              <Route path="pdf-to-excel" element={<LazyRoute><PdfToExcel /></LazyRoute>} />
              <Route path="pdf-to-pdf-a" element={<LazyRoute><PdfToPdfA /></LazyRoute>} />

              {/* Organize PDF */}
              <Route path="merge-pdf" element={<LazyRoute><MergePdf /></LazyRoute>} />
              <Route path="split-pdf" element={<LazyRoute><SplitPdf /></LazyRoute>} />
              <Route path="remove-pages" element={<LazyRoute><RemovePages /></LazyRoute>} />
              <Route path="extract-pages" element={<LazyRoute><ExtractPages /></LazyRoute>} />
              <Route path="organize-pdf" element={<LazyRoute><OrganizePdf /></LazyRoute>} />
              <Route path="scan-to-pdf" element={<LazyRoute><ScanToPdf /></LazyRoute>} />

              {/* Optimize PDF */}
              <Route path="compress-pdf" element={<LazyRoute><ComingSoon /></LazyRoute>} />
              <Route path="repair-pdf" element={<LazyRoute><ComingSoon /></LazyRoute>} />
              <Route path="ocr-pdf" element={<LazyRoute><OcrTool type="pdf" /></LazyRoute>} />

              {/* Convert to PDF */}
              <Route path="jpg-to-pdf" element={<LazyRoute><JpgToPdf /></LazyRoute>} />
              <Route path="word-to-pdf" element={<LazyRoute><WordToPdf /></LazyRoute>} />
              <Route path="powerpoint-to-pdf" element={<LazyRoute><PowerpointToPdf /></LazyRoute>} />
              <Route path="excel-to-pdf" element={<LazyRoute><ExcelToPdf /></LazyRoute>} />
              <Route path="html-to-pdf" element={<LazyRoute><HtmlToPdf /></LazyRoute>} />

              {/* Edit PDF */}
              <Route path="rotate-pdf" element={<LazyRoute><RotatePdf /></LazyRoute>} />
              <Route path="add-page-numbers" element={<LazyRoute><AddPageNumbers /></LazyRoute>} />
              <Route path="add-watermark" element={<LazyRoute><AddWatermark /></LazyRoute>} />
              <Route path="crop-pdf" element={<LazyRoute><CropPdf /></LazyRoute>} />
              <Route path="edit-pdf" element={<LazyRoute><EditPdf /></LazyRoute>} />

              {/* PDF Security */}
              <Route path="sign-pdf" element={<LazyRoute><SignPdf /></LazyRoute>} />
              <Route path="redact-pdf" element={<LazyRoute><RedactPdf /></LazyRoute>} />
              <Route path="compare-pdf" element={<LazyRoute><ComparePdf /></LazyRoute>} />

              {/* PDF Intelligence */}
              <Route path="ai-summarizer" element={<LazyRoute><ComingSoon /></LazyRoute>} />
              <Route path="translate-pdf" element={<LazyRoute><ComingSoon /></LazyRoute>} />

              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="/api" element={<LazyRoute><ApiDocs /></LazyRoute>} />
            <Route path="/analytics" element={<LazyRoute><Analytics /></LazyRoute>} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
};

const App = () => (
  <BrowserRouter>
    <ScrollToTop />
    <Navbar />
    <main className="app-content">
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </main>
    <Footer />
  </BrowserRouter>
);

export default App;
