import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: '🔄', title: 'Universal Converter', desc: 'Convert between PNG, JPG, WebP, AVIF, HEIC and more — fully in-browser.', link: '/tools/converter' },
  { icon: '🎞️', title: 'GIF Maker',           desc: 'Turn any sequence of images into a smooth, looping animated GIF.',        link: '/tools/gif' },
  { icon: '🔓', title: 'Unlock PDF',           desc: 'Remove password protection from any PDF file instantly.',                  link: '/tools/pdf' },
  { icon: '🔐', title: 'Protect PDF',          desc: 'Add strong password encryption to your PDF documents.',                   link: '/tools/pdf-lock' },
  { icon: '🖼️', title: 'PDF to JPG',           desc: 'Export every PDF page as a high-quality JPG image.',                     link: '/tools/pdf-to-jpg' },
  { icon: '📝', title: 'PDF to Word',          desc: 'Extract text from PDFs into editable .docx documents.',                  link: '/tools/pdf-to-word' },
];

const TRUST = ['No Sign-up Required', 'Zero Data Collection', 'Browser-Based', 'No File Size Limit', 'Open Source Friendly'];

const STEPS = [
  { n: '01', title: 'Pick a Tool',   desc: 'Choose from our collection of PDF & image tools' },
  { n: '02', title: 'Upload Files',  desc: 'Drag & drop or click to select your files' },
  { n: '03', title: 'Download',      desc: 'Get your processed file instantly — no waiting' },
];

const Home = () => (
  <section className="hero">
    <div className="container fade-in">
      <div className="hero-eyebrow">✦ 100% free &amp; private — no account needed</div>
      <h1>
        Every tool you need for<br />
        <span className="accent">PDFs &amp; Images</span>
      </h1>
      <p className="hero-desc">
        Convert, compress, merge, protect and unlock files right in your browser.
        Nothing is uploaded to any server — ever.
      </p>
      <div className="hero-cta">
        <Link to="/tools" className="btn btn-primary">Explore All Tools →</Link>
        <Link to="/about" className="btn btn-outline">How it works</Link>
      </div>

      <div className="features-grid">
        {FEATURES.map((f, i) => (
          <Link to={f.link} className="feature-card" key={i} style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </Link>
        ))}
      </div>

      <div className="trust-strip fade-in delay-3">
        {TRUST.map((t, i) => (
          <div className="trust-item" key={i}><span className="dot" />{t}</div>
        ))}
      </div>

      <div className="how-it-works fade-in delay-4">
        <h2>How It Works</h2>
        <p className="subtitle">Three steps. No account. Completely private.</p>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div className="step" key={i}>
              <div className="step-num">{s.n}</div>
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
