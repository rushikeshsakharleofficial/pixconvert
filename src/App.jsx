import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';

// Eagerly loaded (small, always needed)
import Home from './components/Home';
import Tools from './components/Tools';
import UniversalConverter from './components/UniversalConverter';
import GifMaker from './components/GifMaker';
import PdfUnlocker from './components/PdfUnlocker';
import PdfLocker from './components/PdfLocker';
import PdfToJpg from './components/PdfToJpg';
import PdfToWord from './components/PdfToWord';
import PdfToPowerpoint from './components/PdfToPowerpoint';
import PdfToExcel from './components/PdfToExcel';
import PdfToPdfA from './components/PdfToPdfA';
import OcrTool from './components/OcrTool';
import ComingSoon from './components/ComingSoon';
import About from './components/About';
import Privacy from './components/Privacy';
import ComingSoon from './components/ComingSoon';

// Lazy loaded (heavy tools — only loaded when navigated to)
const Tools = lazy(() => import('./components/Tools'));
const UniversalConverter = lazy(() => import('./components/UniversalConverter'));
const GifMaker = lazy(() => import('./components/GifMaker'));
const PdfUnlocker = lazy(() => import('./components/PdfUnlocker'));
const PdfLocker = lazy(() => import('./components/PdfLocker'));
const PdfToJpg = lazy(() => import('./components/PdfToJpg'));
const PdfToWord = lazy(() => import('./components/PdfToWord'));
const PdfToPowerpoint = lazy(() => import('./components/PdfToPowerpoint'));
const PdfToExcel = lazy(() => import('./components/PdfToExcel'));
const PdfToPdfA = lazy(() => import('./components/PdfToPdfA'));
const Contact = lazy(() => import('./components/Contact'));
const Blog = lazy(() => import('./components/Blog'));
const BlogPost = lazy(() => import('./components/BlogPost'));

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

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
        <Route path="merge-pdf" element={<ComingSoon />} />
        <Route path="split-pdf" element={<ComingSoon />} />
        <Route path="remove-pages" element={<ComingSoon />} />
        <Route path="extract-pages" element={<ComingSoon />} />
        <Route path="organize-pdf" element={<ComingSoon />} />
        <Route path="scan-to-pdf" element={<ComingSoon />} />

        {/* Optimize PDF */}
        <Route path="compress-pdf" element={<ComingSoon />} />
        <Route path="repair-pdf" element={<ComingSoon />} />
        <Route path="ocr-pdf" element={<OcrTool type="pdf" />} />

        {/* Convert to PDF */}
        <Route path="jpg-to-pdf" element={<ComingSoon />} />
        <Route path="word-to-pdf" element={<ComingSoon />} />
        <Route path="powerpoint-to-pdf" element={<ComingSoon />} />
        <Route path="excel-to-pdf" element={<ComingSoon />} />
        <Route path="html-to-pdf" element={<ComingSoon />} />

        {/* Edit PDF */}
        <Route path="rotate-pdf" element={<ComingSoon />} />
        <Route path="add-page-numbers" element={<ComingSoon />} />
        <Route path="add-watermark" element={<ComingSoon />} />
        <Route path="crop-pdf" element={<ComingSoon />} />
        <Route path="edit-pdf" element={<ComingSoon />} />

        {/* PDF Security */}
        <Route path="sign-pdf" element={<ComingSoon />} />
        <Route path="redact-pdf" element={<ComingSoon />} />
        <Route path="compare-pdf" element={<ComingSoon />} />

        {/* PDF Intelligence */}
        <Route path="ai-summarizer" element={<ComingSoon />} />
        <Route path="translate-pdf" element={<ComingSoon />} />

        <Route path="*" element={<ComingSoon />} />
      </Route>
      <Route path="/about"   element={<About />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/blog"    element={<Blog />} />
      <Route path="/blog/:id" element={<BlogPost />} />
    </Routes>
    <Footer />
  </BrowserRouter>
);

export default App;
