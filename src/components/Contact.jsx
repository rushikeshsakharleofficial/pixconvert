/* Contact Us section — form (UI only) + FAQ accordion */
const Contact = () => {
  const [formData, setFormData] = React.useState({ name: "", email: "", subject: "", message: "" });
  const [toast, setToast] = React.useState(false);
  const [openFaq, setOpenFaq] = React.useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setToast(true);
    setFormData({ name: "", email: "", subject: "", message: "" });
    setTimeout(() => setToast(false), 3500);
  };

  const faqs = [
    { q: "Is PixConvert really free?", a: "Yes, 100% free. There are no premium tiers, no hidden fees, no watermarks. Every feature is available to everyone." },
    { q: "Are my images uploaded to any server?", a: "No. All processing happens entirely in your browser using the Canvas API and JavaScript. Your files never leave your device." },
    { q: "What image formats are supported?", a: "Our universal converter supports PNG, JPEG, WebP, BMP, AVIF, ICO, TIFF, HEIC (iPhone), and HEIF (Samsung). You can convert between any of these formats." },
    { q: "Is there a file size limit?", a: "There's no server-side limit since nothing is uploaded. The only limitation is your browser's available memory. Most images up to 50MB work fine." },
    { q: "Can I use PixConvert on my phone?", a: "Absolutely! PixConvert is fully responsive and works on mobile browsers. The WhatsApp Sticker tool even includes a 'Share to WhatsApp' button on mobile devices." }
  ];

  const update = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));

  return (
    <section>
      <div className="container">
        <h2 className="section-title fade-in">Contact Us</h2>
        <p className="section-subtitle fade-in">Questions? Feedback? We'd love to hear from you</p>
        <div className="contact-grid fade-in">
          <div className="glass">
            <h3 style={{ fontFamily: "var(--heading)", color: "var(--white)", marginBottom: "1.25rem" }}>Send a Message</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="contact-name">Name</label>
                <input id="contact-name" type="text" required value={formData.name} onChange={e => update("name", e.target.value)} placeholder="Your name" />
              </div>
              <div className="form-group">
                <label htmlFor="contact-email">Email</label>
                <input id="contact-email" type="email" required value={formData.email} onChange={e => update("email", e.target.value)} placeholder="you@example.com" />
              </div>
              <div className="form-group">
                <label htmlFor="contact-subject">Subject</label>
                <input id="contact-subject" type="text" required value={formData.subject} onChange={e => update("subject", e.target.value)} placeholder="What's this about?" />
              </div>
              <div className="form-group">
                <label htmlFor="contact-message">Message</label>
                <textarea id="contact-message" required value={formData.message} onChange={e => update("message", e.target.value)} placeholder="Tell us more…" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>✉️ Send Message</button>
            </form>
          </div>
          <div>
            <div className="glass">
              <h3 style={{ fontFamily: "var(--heading)", color: "var(--white)", marginBottom: "1rem" }}>Frequently Asked Questions</h3>
              <div className="faq-list">
                {faqs.map((faq, i) => (
                  <div className="faq-item" key={i}>
                    <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      {faq.q}
                      <span className={`arrow${openFaq === i ? " open" : ""}`}>▼</span>
                    </button>
                    <div className={`faq-a${openFaq === i ? " open" : ""}`}>{faq.a}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {toast && <div className="toast">✅ Message sent successfully! (Demo only)</div>}
    </section>
  );
};
window.Contact = Contact;
