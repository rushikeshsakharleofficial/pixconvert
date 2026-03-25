/* Home / Hero section */
const { Link } = ReactRouterDOM;

const Home = () => {
  return (
    <section className="hero">
      <div className="container fade-in">
        <h1>Convert Images Instantly.<br/><span className="accent">Free. Private.</span></h1>
        <p>All processing happens in your browser. No uploads, no servers, no tracking. Your images never leave your device.</p>
        <div className="hero-cta">
          <Link to="/tools" className="btn btn-primary">🚀 Start Converting</Link>
          <Link to="/about" className="btn btn-outline">Learn More</Link>
        </div>
      </div>

      <div className="container">
        <div className="features-grid">
          {[
            { icon: "🔄", title: "Universal Converter", desc: "Convert any image format to any other — PNG, JPG, WebP, BMP, AVIF, ICO and more.", link: "converter" },
            { icon: "🎞️", title: "GIF Maker", desc: "Upload 2–10 images and create animated GIFs with custom frame delays.", link: "gif" },
            { icon: "💬", title: "WhatsApp Sticker", desc: "Resize any image to 512×512 WebP under 100KB — ready for WhatsApp.", link: "sticker" },
            { icon: "🔒", title: "100% Private", desc: "Nothing is uploaded anywhere. All processing via Canvas API in your browser.", link: "tools" }
          ].map((f, i) => (
            <div className="glass feature-card fade-in" key={i}>
              <div className="icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <Link to="/tools" state={{ tab: f.link !== "tools" ? f.link : "converter" }} className="btn btn-outline btn-sm" style={{ marginTop: "1rem" }}>
                Try It →
              </Link>
            </div>
          ))}
        </div>

        <div className="trust-strip fade-in">
          {["No Sign-up Required", "No File Size Limit", "Works Offline", "Open Source Friendly", "Zero Data Collection"].map((t, i) => (
            <div className="trust-item" key={i}><span className="dot"/> {t}</div>
          ))}
        </div>

        <div className="how-it-works fade-in">
          <h2>How It Works</h2>
          <div className="steps">
            {[
              { n: "1", title: "Upload", desc: "Drag & drop or click to select your image files" },
              { n: "2", title: "Choose Format", desc: "Pick your desired output format and settings" },
              { n: "3", title: "Download", desc: "Get your converted files instantly — no waiting" }
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
};
window.Home = Home;
