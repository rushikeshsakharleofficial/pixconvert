import React from 'react';

const About = () => (
  <section className="py-20">
    <div className="container max-w-4xl">
      {/* Header Section */}
      <div className="text-center mb-16">
        <div className="text-xs font-bold text-primary/50 uppercase tracking-[0.2em] mb-2">Version 2.0</div>
        <h2 className="section-title fade-in">About PixConvert</h2>
        <p className="section-subtitle fade-in delay-1">
          The privacy-focused, 100% browser-based toolkit for all your file needs.
        </p>
      </div>

      {/* Mission Section */}
      <div className="space-y-12">
        <div className="fade-in delay-2">
          <h3 className="text-2xl font-heading font-bold mb-4 flex items-center gap-3">
            ⚡ Our Mission
          </h3>
          <p className="text-lg text-muted-foreground leading-relaxed">
            PixConvert was built with a single, uncompromising goal: to make file conversion and PDF manipulation 
            <span className="text-foreground font-semibold"> free, instant, and completely private.</span> We believe 
            you shouldn't have to sacrifice your data privacy just to resize an image or sign a document.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
          {[
            {
              icon: "🛡️",
              title: "Privacy First",
              desc: "Your files never leave your device. We use modern web technologies to process everything locally in your browser."
            },
            {
              icon: "💻",
              title: "Client-Side Power",
              desc: "By leveraging Canvas API, WebAssembly, and local processing, we eliminate the need for server-side uploads."
            },
            {
              icon: "🔐",
              title: "No Accounts",
              desc: "No sign-up, no email required, and no hidden subscriptions. Just open the tool and start working."
            },
            {
              icon: "📂",
              title: "Open Source",
              desc: "Built with transparency in mind. PixConvert is open-source friendly and relies on established, secure libraries."
            }
          ].map((item, i) => (
            <div key={i} className="flex flex-col gap-4 p-6 rounded-2xl border border-border bg-card/50 hover:bg-card transition-colors fade-in" style={{ animationDelay: `${0.3 + i*0.1}s` }}>
              <div className="text-3xl">{item.icon}</div>
              <h4 className="text-xl font-bold">{item.title}</h4>
              <p className="text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Technology Section */}
        <div className="fade-in delay-7 pt-8">
          <h3 className="text-2xl font-heading font-bold mb-6 flex items-center gap-3">
            📄 What's Under the Hood?
          </h3>
          <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground space-y-4">
            <p>
              PixConvert isn't just another wrapper for a server-side API. It's a sophisticated Progressive Web App 
              that utilizes the full potential of your computer's hardware through your browser:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-foreground">pdf-lib & pdfjs-dist:</strong> Robust PDF manipulation without server calls.</li>
              <li><strong className="text-foreground">Tesseract.js:</strong> Optical Character Recognition (OCR) running via WebAssembly on your CPU.</li>
              <li><strong className="text-foreground">Canvas API:</strong> High-performance image processing and format conversion.</li>
              <li><strong className="text-foreground">Playwright:</strong> Headless browser technology for accurate HTML-to-PDF rendering.</li>
            </ul>
          </div>
        </div>

        {/* Closing */}
        <div className="text-center pt-16 fade-in delay-9">
          <div className="inline-block p-1 rounded-full bg-primary/10 mb-4">
            <div className="px-4 py-1 rounded-full bg-primary text-white text-sm font-bold">
              100% Free Forever
            </div>
          </div>
          <p className="text-muted-foreground italic">
            "We didn't build PixConvert to collect data. We built it to solve a problem."
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default About;
