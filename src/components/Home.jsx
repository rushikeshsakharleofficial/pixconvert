import { Link } from 'react-router-dom';

const Home = () => (
  <section className="hero">
    <div className="container fade-in">
      <h1>Every tool you need to work with <span className="accent">PDFs & Images</span></h1>
      <p className="hero-desc">
        Merge, split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks.
        <br/>All <strong>100% FREE</strong>, private, and processed right in your browser.
      </p>
      <div className="hero-cta">
        <Link to="/about" className="btn btn-outline">Learn More</Link>
        <Link to="/tools" className="btn btn-primary">Explore All Tools 🚀</Link>
      </div>
    </div>

    <div className="container">
      <div className="features-grid">
        {[
          { icon: '📁', title: 'Merge PDF', desc: 'Combine multiple PDFs into one single document.', link: '/tools/merge-pdf' },
          { icon: '✂️', title: 'Split PDF', desc: 'Separate pages into independent PDF files.', link: '/tools/split-pdf' },
          { icon: '🗜️', title: 'Compress PDF', desc: 'Reduce file size while keeping quality.', link: '/tools/compress-pdf' },
          { icon: '🔄', title: 'Convert Files', desc: 'Convert images between PNG, JPG, WebP and more.', link: '/tools/converter' },
          { icon: '🔓', title: 'Unlock PDF', desc: 'Remove passwords from protected PDFs.', link: '/tools/pdf' },
          { icon: '🔐', title: 'Protect PDF', desc: 'Add password encryption to your PDFs.', link: '/tools/pdf-lock' },
        ].map((f, i) => (
          <Link to={f.link} className={`glass feature-card fade-in`} style={{ animationDelay: `${(i % 3) * 0.1 + 0.2}s`, textDecoration: 'none' }} key={i}>
            <div className="icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </Link>
        ))}
      </div>

      <div className="fade-in delay-3" style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link to="/tools" className="btn btn-outline">View All Tools →</Link>
      </div>

      <div className="trust-strip fade-in delay-4">
        {['No Sign-up Required', 'No File Size Limit', 'Browser-Based', 'Open Source Friendly', 'Zero Data Collection'].map((t, i) => (
          <div className="trust-item" key={i}><span className="dot"/> {t}</div>
        ))}
      </div>

      <div className="how-it-works fade-in delay-4">
        <h2>How It Works</h2>
        <div className="steps">
          {[
            { n: '1', title: 'Select Tool', desc: 'Choose from our collection of PDF & image tools' },
            { n: '2', title: 'Upload Files', desc: 'Drag & drop or click to select your files' },
            { n: '3', title: 'Download', desc: 'Get your processed files instantly — no waiting' }
          ].map((s, i) => (
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
