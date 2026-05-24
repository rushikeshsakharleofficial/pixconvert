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

import { BASE_URL, PAGE_META, PAGE_TITLES, NOINDEX_ROUTES } from './seo/page-meta.js';

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
    if (NOINDEX_ROUTES.has(pathname)) {
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
