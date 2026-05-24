import { Link } from 'react-router-dom';
import { useRef, useState, useEffect, Fragment } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

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
  { n: '01', title: 'Pick a Tool', desc: 'Choose from 40+ PDF & image tools', icon: '🛠️' },
  { n: '02', title: 'Upload Files', desc: 'Drag & drop or click to select your files', icon: '📁' },
  { n: '03', title: 'Download', desc: 'Get your processed file instantly — no waiting', icon: '⬇️' },
];

const STATS = [
  { num: 40, suffix: '+', lbl: 'Tools available' },
  { num: 15, suffix: '+', lbl: 'File formats' },
  { num: 100, suffix: '%', lbl: 'Free forever' },
];

/* ── Animated stat counter ── */
function Counter({ target, suffix }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        observer.disconnect();
        const totalFrames = 50;
        let frame = 0;
        const timer = setInterval(() => {
          frame++;
          const t = frame / totalFrames;
          const eased = 1 - Math.pow(1 - t, 3);
          setCount(Math.round(eased * target));
          if (frame >= totalFrames) {
            setCount(target);
            clearInterval(timer);
          }
        }, 20);
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ── Pipeline How It Works ── */
function PipelineHIW() {
  const [activeStep, setActiveStep] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const t = setInterval(() => {
      setActiveStep(p => (p + 1) % STEPS.length);
    }, 2600);
    return () => clearInterval(t);
  }, [reducedMotion]);

  return (
    <div className="pipeline-wrap">
      <div className="pipeline" role="group" aria-label="How it works steps">
        {STEPS.map((step, i) => (
          <Fragment key={i}>
            <button
              type="button"
              className={[
                'pipe-step',
                i === activeStep ? 'pipe-step--active' : '',
                i < activeStep ? 'pipe-step--done' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => setActiveStep(i)}
              aria-pressed={i === activeStep}
            >
              <span className="pipe-step-num" aria-hidden="true">{step.n}</span>
              <span className="pipe-step-icon" aria-hidden="true">{step.icon}</span>
              <span className="pipe-step-title">{step.title}</span>
            </button>

            {i < STEPS.length - 1 && (
              <div
                className={[
                  'pipe-conn',
                  i < activeStep  ? 'pipe-conn--filled' : '',
                  i === activeStep ? 'pipe-conn--active' : '',
                ].filter(Boolean).join(' ')}
                aria-hidden="true"
              >
                <div className="pipe-conn-track">
                  <div className="pipe-conn-bar" />
                  {!reducedMotion && <div className="pipe-conn-dot" />}
                </div>
              </div>
            )}
          </Fragment>
        ))}
      </div>

      <motion.div
        key={activeStep}
        className="pipe-detail"
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        <span className="pipe-detail-icon" aria-hidden="true">{STEPS[activeStep].icon}</span>
        <div>
          <div className="pipe-detail-step">Step {activeStep + 1} of {STEPS.length}</div>
          <div className="pipe-detail-title">{STEPS[activeStep].title}</div>
          <div className="pipe-detail-desc">{STEPS[activeStep].desc}</div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Framer motion variants ── */
const heroContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.2, 0.8, 0.2, 1] } },
};
const fadeRight = {
  hidden: { opacity: 0, x: 18 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: [0.2, 0.8, 0.2, 1], delay: 0.12 } },
};

/* ── Home Page ── */
const Home = () => {
  const reducedMotion = useReducedMotion();
  const marqueeRef = useRef(null);

  useEffect(() => {
    if (marqueeRef.current) marqueeRef.current.setAttribute('inert', '');
  }, []);

  return (
    <section className="hero hero--editorial">
      <div className="container">

        {/* ── Hero grid ── */}
        <motion.div
          className="hero-ed-grid fade-in"
          variants={reducedMotion ? undefined : heroContainer}
          initial={reducedMotion ? undefined : 'hidden'}
          animate={reducedMotion ? undefined : 'visible'}
        >
          {/* LEFT: content */}
          <div className="hero-ed-content">
            <motion.div className="hero-eyebrow" variants={reducedMotion ? undefined : fadeUp}>
              <span className="hero-eyebrow-diamond" aria-hidden="true">◆</span>
              100% free &amp; private — no account needed
            </motion.div>

            <motion.h1 className="hero-ed-headline" variants={reducedMotion ? undefined : fadeUp}>
              Every tool<br />
              you need for<br />
              <em className="hero-ed-em">PDFs &amp; Images</em>
            </motion.h1>

            <motion.p className="hero-ed-desc" variants={reducedMotion ? undefined : fadeUp}>
              Convert, compress, merge, protect and unlock files right in your browser.
              Nothing is uploaded to any server — ever.
            </motion.p>

            <motion.div className="hero-cta hero-cta--left" variants={reducedMotion ? undefined : fadeUp}>
              <Link to="/tools" className="btn btn-primary">
                Explore All Tools <span aria-hidden="true">→</span>
              </Link>
              <Link to="/about" className="btn btn-outline">
                How it works
              </Link>
            </motion.div>

            <motion.div
              className="hero-stats hero-stats--left"
              variants={reducedMotion ? undefined : fadeUp}
            >
              {STATS.map((s, i) => (
                <div className="hero-stat hero-stat--left" key={i}>
                  <div className="num">
                    {reducedMotion
                      ? `${s.num}${s.suffix}`
                      : <Counter target={s.num} suffix={s.suffix} />
                    }
                  </div>
                  <div className="lbl">{s.lbl}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT: visual panel */}
          <motion.div
            className="hero-ed-visual"
            variants={reducedMotion ? undefined : fadeRight}
            aria-hidden="true"
          >
            <div className="hero-ed-big-stat">
              <span className="hero-ed-big-num">37<span className="hero-ed-big-plus">+</span></span>
              <span className="hero-ed-big-lbl">tools available</span>
            </div>

            <div className="hero-ed-loader-wrap">
              {!reducedMotion && (
                <div className="hero-3d-scene hero-loader-scene">
                  <BoxLoader />
                </div>
              )}
            </div>

            <div className="hero-ed-badges">
              {[
                { icon: '🔄', name: 'Converter' },
                { icon: '📁', name: 'Merge PDF' },
                { icon: '✂️', name: 'Split PDF' },
                { icon: '✏️', name: 'Edit PDF' },
                { icon: '🔓', name: 'Unlock PDF' },
                { icon: '🖼️', name: 'PDF → JPG' },
              ].map((t) => (
                <motion.span
                  key={t.name}
                  className="hero-ed-badge"
                  whileHover={reducedMotion ? undefined : { scale: 1.07, y: -2 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                >
                  <span>{t.icon}</span> {t.name}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* ── Tool marquee ── */}
        <div className="section-divider" />

        {/* ── Trust strip ── */}
        <div className="trust-strip">
          {TRUST.map((t, i) => (
            <motion.div
              className="trust-item"
              key={i}
              initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
              whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.38, delay: i * 0.06 }}
            >
              <span className="dot" aria-hidden="true" />
              {t}
            </motion.div>
          ))}
        </div>

        {/* ── Tool marquee — just above pipeline ── */}
        <div ref={marqueeRef} aria-hidden="true">
          <ToolMarquee />
        </div>

        {/* ── How It Works ── */}
        <motion.div
          className="how-it-works"
          initial={reducedMotion ? undefined : { opacity: 0, y: 28 }}
          whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <h2>How It Works</h2>
          <p className="subtitle">Three steps. No account. Completely private.</p>
          <PipelineHIW />
        </motion.div>

        <div className="section-divider" />
      </div>
    </section>
  );
};

export default Home;
