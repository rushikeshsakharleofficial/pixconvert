import { Link } from 'react-router-dom';
import { useRef, useCallback } from 'react';

import BoxLoader from './ui/box-loader';
import ToolMarquee from './ui/tool-marquee';
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from './ui/stepper';

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

      <ToolMarquee />

      <div className="section-divider" />

      <div className="trust-strip fade-in delay-4">
        {TRUST.map((t, i) => (
          <div className="trust-item" key={i}>
            <span className="dot" />
            {t}
          </div>
        ))}
      </div>

      <div className="how-it-works fade-in delay-5 py-20">
        <h2 className="text-center">How It Works</h2>
        <p className="subtitle text-center mb-12">Three steps. No account. Completely private.</p>
        
        <div className="max-w-3xl mx-auto px-4">
          <Stepper
            defaultValue={1}
            indicators={{
              completed: <span className="text-[10px]">✓</span>,
            }}
            className="space-y-12"
          >
            <StepperNav className="justify-between">
              {STEPS.map((step, index) => (
                <StepperItem key={index} step={index + 1} className="relative">
                  <StepperTrigger className="flex flex-col md:flex-row items-center gap-3">
                    <StepperIndicator className="size-10 text-base" />
                    <div className="flex flex-col items-center md:items-start">
                      <StepperTitle className="text-lg">{step.title}</StepperTitle>
                    </div>
                  </StepperTrigger>
                  {STEPS.length > index + 1 && (
                    <StepperSeparator className="hidden md:block mx-4" />
                  )}
                </StepperItem>
              ))}
            </StepperNav>

            <StepperPanel className="bg-card/50 border border-border p-8 rounded-[2rem] text-center min-h-[120px] flex items-center justify-center">
              {STEPS.map((step, index) => (
                <StepperContent key={index} value={index + 1}>
                  <p className="text-xl text-muted-foreground font-medium max-w-lg mx-auto">
                    {step.desc}
                  </p>
                </StepperContent>
              ))}
            </StepperPanel>
          </Stepper>
        </div>
      </div>

      <div className="section-divider" />
    </div>
  </section>
);

export default Home;
