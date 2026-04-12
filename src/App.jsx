import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense, useRef } from 'react';
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

const PAGE_TITLES = {
  '/': 'PixConvert — Free Online PDF & Image Converter',
  '/tools': 'All Tools — PixConvert',
  '/about': 'About — PixConvert',
  '/privacy': 'Privacy Policy — PixConvert',
  '/contact': 'Contact Us — PixConvert',
  '/tools/converter': 'Universal Image Converter — PixConvert',
  '/tools/gif': 'GIF Maker — PixConvert',
  '/tools/pdf': 'Unlock PDF — PixConvert',
  '/tools/pdf-lock': 'Protect PDF — PixConvert',
  '/tools/pdf-to-jpg': 'PDF to JPG — PixConvert',
  '/tools/pdf-to-word': 'PDF to Word — PixConvert',
  '/tools/pdf-to-powerpoint': 'PDF to PowerPoint — PixConvert',
  '/tools/pdf-to-excel': 'PDF to Excel — PixConvert',
  '/tools/pdf-to-pdf-a': 'PDF to PDF/A — PixConvert',
  '/tools/merge-pdf': 'Merge PDF — PixConvert',
  '/tools/split-pdf': 'Split PDF — PixConvert',
  '/tools/remove-pages': 'Remove PDF Pages — PixConvert',
  '/tools/extract-pages': 'Extract PDF Pages — PixConvert',
  '/tools/organize-pdf': 'Organize PDF — PixConvert',
  '/tools/scan-to-pdf': 'Scan to PDF — PixConvert',
  '/tools/jpg-to-pdf': 'JPG to PDF — PixConvert',
  '/tools/word-to-pdf': 'Word to PDF — PixConvert',
  '/tools/powerpoint-to-pdf': 'PowerPoint to PDF — PixConvert',
  '/tools/excel-to-pdf': 'Excel to PDF — PixConvert',
  '/tools/html-to-pdf': 'HTML to PDF — PixConvert',
  '/tools/rotate-pdf': 'Rotate PDF — PixConvert',
  '/tools/add-page-numbers': 'Add Page Numbers to PDF — PixConvert',
  '/tools/add-watermark': 'Add Watermark to PDF — PixConvert',
  '/tools/crop-pdf': 'Crop PDF — PixConvert',
  '/tools/edit-pdf': 'Edit PDF — PixConvert',
  '/tools/jpg-to-png': 'JPG to PNG — PixConvert',
  '/tools/png-to-jpg': 'PNG to JPG — PixConvert',
  '/tools/webp-to-jpg': 'WebP to JPG — PixConvert',
  '/tools/heic-to-jpg': 'HEIC to JPG — PixConvert',
  '/tools/bmp-to-png': 'BMP to PNG — PixConvert',
  '/tools/photo-to-markdown': 'Photo to Markdown (OCR) — PixConvert',
  '/tools/ocr-pdf': 'OCR PDF — PixConvert',
  '/tools/sign-pdf': 'Sign PDF — PixConvert',
  '/tools/redact-pdf': 'Redact PDF — PixConvert',
  '/tools/compare-pdf': 'Compare PDF — PixConvert',
  '/analytics': 'Analytics — PixConvert',
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const observerRef = useRef(null);
  const timerRef = useRef(null);
  const observedElementsRef = useRef([]);

  // Effect for scroll-to-top and title changes on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = PAGE_TITLES[pathname] || 'PixConvert — Free Online PDF & Image Converter';
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

const App = () => (
  <BrowserRouter>
    <ScrollToTop />
    <Navbar />
    <ErrorBoundary>
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
          <Route path="/analytics" element={<LazyRoute><Analytics /></LazyRoute>} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
    <Footer />
  </BrowserRouter>
);

export default App;
