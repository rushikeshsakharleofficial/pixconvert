import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
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
import Contact from './components/Contact';
import Blog from './components/Blog';
import BlogPost from './components/BlogPost';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

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
