import { Link } from 'react-router-dom';
import { useRef, useState, useCallback, useEffect } from 'react';

import BoxLoader from './ui/box-loader';
import ToolMarquee from './ui/tool-marquee';

const TRUST = [
  'No Sign-up Required',
  'Zero Data Collection',
  'Browser-Based',
  'No File Size Limit',
  'Open Source Friendly',
];

const STEPS = [
  { n: '01', title: 'Pick a Tool', desc: 'Choose from our collection of PDF & image tools', icon: '🛠️' },
  { n: '02', title: 'Upload Files', desc: 'Drag & drop or click to select your files', icon: '📁' },
  { n: '03', title: 'Download', desc: 'Get your processed file instantly - no waiting', icon: '⬇️' },
];

const STATS = [
  { num: '40+', lbl: 'Tools available' },
  { num: '15+', lbl: 'File formats' },
  { num: '100%', lbl: 'Free forever' },
];

/* ── Drag-based How It Works Timeline ── */
function HowItWorksTimeline() {
  const [activeStep, setActiveStep] = useState(0);
  const trackRef = useRef(null);
  const isDragging = useRef(false);

  const getStepFromPosition = useCallback((clientX) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * (STEPS.length - 1));
  }, []);

  const handlePointerDown = useCallback((e) => {
    isDragging.current = true;
    trackRef.current?.setPointerCapture(e.pointerId);
    setActiveStep(getStepFromPosition(e.clientX));
  }, [getStepFromPosition]);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging.current) return;
    setActiveStep(getStepFromPosition(e.clientX));
  }, [getStepFromPosition]);

  const handlePointerUp = useCallback((e) => {
    isDragging.current = false;
    trackRef.current?.releasePointerCapture(e.pointerId);
  }, []);

  // Auto-advance every 3s when not dragging
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDragging.current) {
        setActiveStep((prev) => (prev + 1) % STEPS.length);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const progressPercent = (activeStep / (STEPS.length - 1)) * 100;

  return (
    <div className="hiw-timeline">
      {/* Drag track */}
      <div
        className="hiw-track"
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="slider"
        aria-label="Step selector"
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={activeStep + 1}
        aria-valuetext={STEPS[activeStep].title}
        tabIndex={0}
      >
        {/* Track background */}
        <div className="hiw-track-bg" />
        {/* Filled portion */}
        <div className="hiw-track-fill" style={{ width: `${progressPercent}%` }} />
        {/* Drag thumb */}
        <div
          className="hiw-thumb"
          style={{ left: `${progressPercent}%` }}
        />
        {/* Step dots */}
        {STEPS.map((step, i) => {
          const leftPct = (i / (STEPS.length - 1)) * 100;
          const state = i < activeStep ? 'completed' : i === activeStep ? 'active' : 'inactive';
          return (
            <div
              key={i}
              className={`hiw-dot hiw-dot--${state}`}
              style={{ left: `${leftPct}%` }}
            >
              <span className="hiw-dot-inner">
                {state === 'completed' ? '✓' : i + 1}
              </span>
            </div>
          );
        })}
      </div>

      {/* Labels row */}
      <div className="hiw-labels">
        {STEPS.map((step, i) => (
          <div
            key={i}
            className={`hiw-label ${i === activeStep ? 'hiw-label--active' : ''}`}
          >
            {step.title}
          </div>
        ))}
      </div>

      {/* Description panel */}
      <div className="hiw-panel" key={activeStep}>
        <span className="hiw-panel-icon">{STEPS[activeStep].icon}</span>
        <p className="hiw-panel-text">{STEPS[activeStep].desc}</p>
      </div>
    </div>
  );
}

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

      <div className="how-it-works fade-in delay-5">
        <h2>How It Works</h2>
        <p className="subtitle">Three steps. No account. Completely private.</p>
        <HowItWorksTimeline />
      </div>

      <div className="section-divider" />
    </div>
  </section>
);

export default Home;
