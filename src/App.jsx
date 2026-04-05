import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
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
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = PAGE_TITLES[pathname] || 'PixConvert — Free Online PDF & Image Converter';
  }, [pathname]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
    );
    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal:not(.in-view)').forEach(el => observer.observe(el));
    }, 80);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [pathname]);

  return null;
};

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

const App = () => (
  <BrowserRouter>
    <ScrollToTop />
    <Navbar />
    <ErrorBoundary>
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/"        element={<Home />} />
        <Route path="/tools"   element={<Tools />}>
          <Route path="converter" element={<UniversalConverter />} />
          <Route path="gif" element={<GifMaker />} />
          <Route path="pdf" element={<PdfUnlocker />} />
          <Route path="pdf-lock" element={<PdfLocker />} />

          {/* Image Conversion */}
          <Route path="jpg-to-png" element={<UniversalConverter defaultOutputFormat="image/png" />} />
          <Route path="png-to-jpg" element={<UniversalConverter defaultOutputFormat="image/jpeg" />} />
          <Route path="webp-to-jpg" element={<UniversalConverter defaultOutputFormat="image/jpeg" />} />
          <Route path="heic-to-jpg" element={<UniversalConverter defaultOutputFormat="image/jpeg" />} />
          <Route path="bmp-to-png" element={<UniversalConverter defaultOutputFormat="image/png" />} />
          <Route path="photo-to-markdown" element={<OcrTool type="image" />} />

          {/* Convert from PDF tools */}
          <Route path="pdf-to-jpg" element={<PdfToJpg />} />
          <Route path="pdf-to-word" element={<PdfToWord />} />
          <Route path="pdf-to-powerpoint" element={<PdfToPowerpoint />} />
          <Route path="pdf-to-excel" element={<PdfToExcel />} />
          <Route path="pdf-to-pdf-a" element={<PdfToPdfA />} />

          {/* Organize PDF */}
          <Route path="merge-pdf" element={<MergePdf />} />
          <Route path="split-pdf" element={<SplitPdf />} />
          <Route path="remove-pages" element={<RemovePages />} />
          <Route path="extract-pages" element={<ExtractPages />} />
          <Route path="organize-pdf" element={<OrganizePdf />} />
          <Route path="scan-to-pdf" element={<ScanToPdf />} />

          {/* Optimize PDF */}
          <Route path="compress-pdf" element={<ComingSoon />} />
          <Route path="repair-pdf" element={<ComingSoon />} />
          <Route path="ocr-pdf" element={<OcrTool type="pdf" />} />

          {/* Convert to PDF */}
          <Route path="jpg-to-pdf" element={<JpgToPdf />} />
          <Route path="word-to-pdf" element={<WordToPdf />} />
          <Route path="powerpoint-to-pdf" element={<PowerpointToPdf />} />
          <Route path="excel-to-pdf" element={<ExcelToPdf />} />
          <Route path="html-to-pdf" element={<HtmlToPdf />} />

          {/* Edit PDF */}
          <Route path="rotate-pdf" element={<RotatePdf />} />
          <Route path="add-page-numbers" element={<AddPageNumbers />} />
          <Route path="add-watermark" element={<AddWatermark />} />
          <Route path="crop-pdf" element={<CropPdf />} />
          <Route path="edit-pdf" element={<EditPdf />} />

          {/* PDF Security */}
          <Route path="sign-pdf" element={<ComingSoon />} />
          <Route path="redact-pdf" element={<ComingSoon />} />
          <Route path="compare-pdf" element={<ComingSoon />} />

          {/* PDF Intelligence */}
          <Route path="ai-summarizer" element={<ComingSoon />} />
          <Route path="translate-pdf" element={<ComingSoon />} />

          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/about"   element={<About />} />
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
