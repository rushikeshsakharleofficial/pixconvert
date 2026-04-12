import React from 'react';
import { Link } from 'react-router-dom';

const Privacy = () => (
  <section className="py-20">
    <div className="container max-w-4xl">
      {/* Header Section */}
      <div className="text-center mb-16">
        <div className="text-xs font-bold text-primary/50 uppercase tracking-[0.2em] mb-2">Version 2.0</div>
        <h2 className="section-title fade-in">Privacy Policy</h2>
        <p className="section-subtitle fade-in delay-1">
          Last updated: April 2026. Your privacy is not a feature; it's our foundation.
        </p>
      </div>

      <div className="space-y-16">
        {/* TL;DR Section */}
        <div className="p-8 rounded-3xl bg-primary/5 border border-primary/10 fade-in delay-2 text-center">
          <h3 className="text-xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
            🙈 The PixConvert Promise
          </h3>
          <p className="text-lg text-foreground font-medium">
            We don't track you. We don't store your files. We don't even know who you are.
          </p>
        </div>

        {/* Detailed Points */}
        <div className="grid gap-12">
          {/* Files */}
          <div className="fade-in delay-3">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
              💾 Your Files
            </h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              When you use our PDF and image tools, your files are processed <span className="text-foreground font-semibold">locally in your browser memory.</span> They are never uploaded to our servers. Once you close the tab, the files are gone from memory. The only exception is the contact form, where data you explicitly provide is sent to us via email.
            </p>
          </div>

          {/* Data Collection */}
          <div className="fade-in delay-4">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
              👤 Personal Data
            </h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We do not require registration. We do not collect names, email addresses, or IP addresses for tracking purposes. We have zero interest in building a profile of our users.
            </p>
          </div>

          {/* Cookies */}
          <div className="fade-in delay-5">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
              🍪 Cookies & Tracking
            </h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              PixConvert is a cookie-free zone. We do not use persistent cookies, session cookies, or tracking pixels. We do not use third-party analytics services like Google Analytics.
            </p>
          </div>

          {/* Third Parties */}
          <div className="fade-in delay-6">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
              🌐 Third-Party Infrastructure
            </h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              To keep PixConvert running smoothly, we use standard infrastructure providers:
            </p>
            <ul className="mt-4 space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span><strong>Hosting:</strong> Our site is served through established CDNs which may log standard request data (like IP and user-agent) for security and delivery optimization.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span><strong>Assets:</strong> We load fonts from Google Fonts and certain libraries from Cloudflare CDN. These providers have their own privacy policies.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact */}
        <div className="pt-8 border-t border-border fade-in delay-7">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
            ✉️ Questions?
          </h3>
          <p className="text-muted-foreground text-lg leading-relaxed">
            If you have any questions about our privacy practices, please reach out to us through our{' '}
            <Link to="/contact" className="text-primary hover:underline font-semibold italic">
              contact form
            </Link>.
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default Privacy;
