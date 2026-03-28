import { useState } from 'react';

const faqs = [
  { q: 'Is PixConvert really free?', a: 'Yes, 100% free. There are no premium tiers, no hidden fees, no watermarks. Every feature is available to everyone.' },
  { q: 'Are my images uploaded to any server?', a: 'No. All processing happens entirely in your browser using the Canvas API and JavaScript. Your files never leave your device.' },
  { q: 'What image formats are supported?', a: 'Our universal converter supports PNG, JPEG, WebP, BMP, AVIF, ICO, TIFF, HEIC (iPhone), and HEIF (Samsung). You can convert between any of these formats.' },
  { q: 'Is there a file size limit?', a: "All processing happens in your browser, so the main limitation is your device's available memory. Most files up to 50MB work fine." },
  { q: 'Can I use PixConvert on my phone?', a: "Absolutely! PixConvert is fully responsive and works on mobile browsers. The WhatsApp Sticker tool even includes a 'Share to WhatsApp' button on mobile devices." }
];

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [toast, setToast] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to send message over SMTP');
      setToast('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setToast(false), 3500);
    } catch (err) {
      setToast('error');
      setTimeout(() => setToast(false), 3500);
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));

  return (
    <section>
      <div className="container">
        <h2 className="section-title fade-in visible">Contact Us</h2>
        <p className="section-subtitle fade-in visible">Questions? Feedback? We'd love to hear from you</p>
        <div className="contact-grid fade-in visible">
          <div className="glass">
            <h3 style={{ fontFamily: 'var(--heading)', color: 'var(--white)', marginBottom: '1.25rem' }}>
              Send a Message
            </h3>
            <form onSubmit={handleSubmit}>
              {[
                { id: 'name',    label: 'Name',    type: 'text',  placeholder: 'Your name' },
                { id: 'email',   label: 'Email',   type: 'email', placeholder: 'you@example.com' },
                { id: 'subject', label: 'Subject', type: 'text',  placeholder: "What's this about?" },
              ].map(({ id, label, type, placeholder }) => (
                <div className="form-group" key={id}>
                  <label htmlFor={`contact-${id}`}>{label}</label>
                  <input id={`contact-${id}`} type={type} required
                    value={formData[id]} onChange={e => update(id, e.target.value)}
                    placeholder={placeholder} />
                </div>
              ))}
              <div className="form-group">
                <label htmlFor="contact-message">Message</label>
                <textarea id="contact-message" required value={formData.message}
                  onChange={e => update('message', e.target.value)} placeholder="Tell us more…" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Sending…' : '✉️ Send Message'}
              </button>
            </form>
          </div>
          <div>
            <div className="glass">
              <h3 style={{ fontFamily: 'var(--heading)', color: 'var(--white)', marginBottom: '1rem' }}>
                Frequently Asked Questions
              </h3>
              <div className="faq-list">
                {faqs.map((faq, i) => (
                  <div className="faq-item" key={i}>
                    <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      {faq.q}
                      <span className={`arrow${openFaq === i ? ' open' : ''}`}>▼</span>
                    </button>
                    <div className={`faq-a${openFaq === i ? ' open' : ''}`}>{faq.a}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {toast === 'success' && <div className="toast">✅ Message sent successfully!</div>}
      {toast === 'error' && <div className="toast" style={{ background: '#dc2626' }}>❌ Failed to send message. Please try again later.</div>}
    </section>
  );
};

export default Contact;
