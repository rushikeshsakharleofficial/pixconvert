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
import ComingSoon from './components/ComingSoon';
import About from './components/About';
import Privacy from './components/Privacy';
import Contact from './components/Contact';

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
        {/* Convert from PDF tools */}
        <Route path="pdf-to-jpg" element={<PdfToJpg />} />
        <Route path="pdf-to-word" element={<PdfToWord />} />
        <Route path="pdf-to-powerpoint" element={<PdfToPowerpoint />} />
        <Route path="pdf-to-excel" element={<PdfToExcel />} />
        <Route path="pdf-to-pdf-a" element={<PdfToPdfA />} />
        
        <Route path="*" element={<ComingSoon />} />
      </Route>
      <Route path="/about"   element={<About />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
    <Footer />
  </BrowserRouter>
);

export default App;
