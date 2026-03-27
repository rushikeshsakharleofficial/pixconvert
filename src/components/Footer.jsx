import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="footer">
    <div className="footer-inner">
      {/* Brand */}
      <div className="footer-brand">
        <div className="brand-row">
          <svg viewBox="0 0 28 28" fill="none" style={{ width: 22, height: 22, flexShrink: 0 }}>
            <rect x="2" y="2" width="24" height="24" rx="6" stroke="#ef4444" strokeWidth="1.8"/>
            <path d="M8 20l4-6 3 4 2-3 3 5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="10" cy="10" r="2" fill="#ef4444"/>
          </svg>
          <span>PixConvert</span>
        </div>
        <p>Privacy-first file conversion.<br />Everything runs in your browser.<br />Zero uploads. Zero tracking.</p>
      </div>

      {/* PDF Tools */}
      <div className="footer-col">
        <h4>PDF Tools</h4>
        <Link to="/tools/pdf">Unlock PDF</Link>
        <Link to="/tools/pdf-lock">Protect PDF</Link>
        <Link to="/tools/pdf-to-jpg">PDF to JPG</Link>
        <Link to="/tools/pdf-to-word">PDF to Word</Link>
        <Link to="/tools/pdf-to-excel">PDF to Excel</Link>
        <Link to="/tools/pdf-to-powerpoint">PDF to PowerPoint</Link>
      </div>

      {/* Image Tools */}
      <div className="footer-col">
        <h4>Image Tools</h4>
        <Link to="/tools/converter">Universal Converter</Link>
        <Link to="/tools/gif">GIF Maker</Link>
        <Link to="/tools/jpg-to-png">JPG to PNG</Link>
        <Link to="/tools/heic-to-jpg">HEIC to JPG</Link>
        <Link to="/tools/webp-to-jpg">WebP to JPG</Link>
        <Link to="/tools/bmp-to-png">BMP to PNG</Link>
      </div>

      {/* Company */}
      <div className="footer-col">
        <h4>Company</h4>
        <Link to="/about">About</Link>
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/tools">All Tools</Link>
      </div>
    </div>

    <div className="footer-bottom">
      <p>© {new Date().getFullYear()} PixConvert. All rights reserved.</p>
      <div className="footer-status">
        <span className="dot" />
        <span>100% client-side — your files never leave your device</span>
      </div>
    </div>
  </footer>
);

export default Footer;
