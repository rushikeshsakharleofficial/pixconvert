/* About Us section */
const About = () => (
  <section>
    <div className="container">
      <h2 className="section-title fade-in">About PixConvert</h2>
      <p className="section-subtitle fade-in">Why we built this — and what makes it different</p>
      <div className="glass content-card fade-in">
        <h3>🎯 Our Mission</h3>
        <p>PixConvert was built with one simple belief: <strong style={{ color: "var(--white)" }}>image conversion should be free, instant, and completely private.</strong> No sign-ups, no watermarks, no shady servers processing your photos.</p>

        <h3>🤔 Why We Built This</h3>
        <p>Every online converter we tried either uploaded our files to unknown servers, bombarded us with ads, or required payment for basic features. We thought — why not just do it all in the browser? Canvas API, FileReader, and modern JavaScript make it possible to convert images entirely on your device.</p>

        <h3>🔐 What Makes Us Different</h3>
        <div className="values-grid">
          {[
            { icon: "🖥️", title: "100% Client-Side", desc: "Every conversion happens in your browser using Canvas API. Zero server processing." },
            { icon: "🚫", title: "No Data Collection", desc: "We don't collect, store, or transmit any data. No cookies, no analytics, no tracking." },
            { icon: "⚡", title: "Instant Results", desc: "No upload/download wait times. Conversion is as fast as your device can process." },
            { icon: "🧰", title: "Multiple Tools", desc: "Universal converter, GIF maker, and WhatsApp sticker generator — all in one place." }
          ].map((v, i) => (
            <div className="glass" key={i} style={{ textAlign: "center", padding: "1.5rem 1rem" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: ".5rem" }}>{v.icon}</div>
              <h3 style={{ fontSize: "1rem", marginBottom: ".25rem" }}>{v.title}</h3>
              <p style={{ fontSize: ".85rem" }}>{v.desc}</p>
            </div>
          ))}
        </div>

        <h3 style={{ marginTop: "2rem" }}>🌍 Open & Transparent</h3>
        <p>PixConvert is a straightforward tool built with React, Canvas API, and gif.js. The entire application runs as static files — there's no backend, no database, no API calls. What you see is exactly what you get.</p>
      </div>
    </div>
  </section>
);
window.About = About;
