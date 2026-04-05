import { Link } from 'react-router-dom';
import { useRef, useCallback } from 'react';

import BoxLoader from './ui/box-loader';

const FEATURES = [
  { icon: '🔄', title: 'Universal Converter', desc: 'Convert between PNG, JPG, WebP, AVIF, HEIC and more - fully in-browser.', link: '/tools/converter' },
  { icon: '🎞️', title: 'GIF Maker', desc: 'Turn any sequence of images into a smooth, looping animated GIF.', link: '/tools/gif' },
  { icon: '🔓', title: 'Unlock PDF', desc: 'Remove password protection from any PDF file instantly.', link: '/tools/pdf' },
  { icon: '🔐', title: 'Protect PDF', desc: 'Add strong password encryption to your PDF documents.', link: '/tools/pdf-lock' },
  { icon: '🖼️', title: 'PDF to JPG', desc: 'Export every PDF page as a high-quality JPG image.', link: '/tools/pdf-to-jpg' },
  { icon: '📝', title: 'PDF to Word', desc: 'Extract text from PDFs into editable .docx documents.', link: '/tools/pdf-to-word' },
  { icon: '✍️', title: 'Sign PDF', desc: 'Sign yourself or request electronic signatures from others.', link: '/tools/sign-pdf' },
  { icon: '⬛', title: 'Redact PDF', desc: 'Permanently remove sensitive content from your PDF documents.', link: '/tools/redact-pdf' },
  { icon: '⚖️', title: 'Compare PDF', desc: 'Compare two PDF documents side by side and find the differences.', link: '/tools/compare-pdf' },
  { icon: '📁', title: 'Merge PDF', desc: 'Combine PDFs in the order you want with an easy in-browser merger.', link: '/tools/merge-pdf' },
];

const TRUST = [
  'No Sign-up Required',
  'Zero Data Collection',
  'Browser-Based',
  'No File Size Limit',
  'Open Source Friendly',
];

const STEPS = [
  { n: '01', title: 'Pick a Tool', desc: 'Choose from our collection of PDF & image tools' },
  { n: '02', title: 'Upload Files', desc: 'Drag & drop or click to select your files' },
  { n: '03', title: 'Download', desc: 'Get your processed file instantly - no waiting' },
];

const STATS = [
  { num: '40+', lbl: 'Tools available' },
  { num: '15+', lbl: 'File formats' },
  { num: '100%', lbl: 'Free forever' },
];

const TiltCard = ({ children, className, to, style }) => {
  const ref = useRef(null);
  const rafRef = useRef(null);

  const handleMove = useCallback((e) => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) {
        rafRef.current = null;
        return;
      }
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(600px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale3d(1.03,1.03,1.03)`;
      rafRef.current = null;
    });
  }, []);

  const handleLeave = useCallback(() => {
    const el = ref.current;
    if (el) el.style.transform = '';
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  return (
    <Link
      to={to}
      className={className}
      ref={ref}
      style={{ ...style, transformStyle: 'preserve-3d', transition: 'transform 0.2s ease-out' }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </Link>
  );
};

const Home = () => (
  <section className="hero" style={{ position: 'relative', overflow: 'hidden' }}>
    <div className="hero-orb hero-orb-1" aria-hidden="true" />
    <div className="hero-orb hero-orb-2" aria-hidden="true" />
    <div className="hero-orb hero-orb-3" aria-hidden="true" />

    <div className="container fade-in">
      <div className="hero-3d-scene hero-loader-scene" aria-hidden="true">
        <BoxLoader />
      </div>

      <div className="hero-eyebrow">✦ 100% free &amp; private - no account needed</div>

      <h1>
        Every tool you need for
        <br />
        <span className="accent">PDFs &amp; Images</span>
      </h1>

      <p className="hero-desc">
        Convert, compress, merge, protect and unlock files right in your browser.
        Nothing is uploaded to any server - ever.
      </p>

      <div className="hero-cta">
        <Link to="/tools" className="btn btn-primary">Explore All Tools →</Link>
        <Link to="/about" className="btn btn-outline">How it works</Link>
      </div>

      <div className="hero-stats fade-in delay-2">
        {STATS.map((s, i) => (
          <div className="hero-stat" key={i}>
            <div className="num">{s.num}</div>
            <div className="lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      <div className="features-grid" style={{ marginTop: '3.5rem' }}>
        {FEATURES.map((f, i) => (
          <TiltCard to={f.link} className="feature-card" key={i}>
            <div className="icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
            <span className="feature-card-arrow" aria-hidden="true">→</span>
          </TiltCard>
        ))}
      </div>

      <div className="section-divider" />

      <div className="trust-strip fade-in delay-4">
        {TRUST.map((t, i) => (
          <div className="trust-item" key={i}>
            <span className="dot" />
            {t}
          </div>
        ))}
      </div>

      <div className="how-it-works fade-in delay-5">
        <h2>How It Works</h2>
        <p className="subtitle">Three steps. No account. Completely private.</p>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div className="step step-3d" key={i}>
              <div className="step-num-3d">
                <div className="step-num-inner">
                  <div className="step-num-front">{s.n}</div>
                  <div className="step-num-back">✓</div>
                </div>
              </div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default Home;
