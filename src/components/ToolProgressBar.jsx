import { useEffect, useRef } from 'react';
import ProcessBoxLoader from './ui/process-box-loader';
import { trackToolUsage } from '../utils/trackUsage';

const ToolProgressBar = ({ active, label = 'Processing...', value, className = '', style: wrapStyle }) => {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (active && !trackedRef.current) {
      trackedRef.current = true;
      const toolSlug = window.location.pathname.split('/').pop() || 'unknown';
      trackToolUsage(toolSlug);
    } else if (!active) {
      trackedRef.current = false; // reset for next run
    }
  }, [active]);

  if (!active) return null;

  const indeterminate = value == null || Number.isNaN(Number(value));
  const pct = indeterminate ? 0 : Math.min(100, Math.max(0, Math.round(Number(value))));

  return (
    <div
      className={`tool-progress-wrap fade-in ${className}`.trim()}
      style={{ marginTop: '0.85rem', ...wrapStyle }}
    >
      <div className="tool-progress-loader">
        <ProcessBoxLoader />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem',
          color: 'var(--text3)',
          marginBottom: '0.35rem',
          gap: '0.5rem',
        }}
      >
        <span>{label}</span>
        {!indeterminate && <span style={{ fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>}
      </div>

      <div className="progress-bar" style={{ marginTop: 0 }}>
        <div
          className={`progress-fill${indeterminate ? ' animated' : ''}`}
          style={{ width: indeterminate ? '100%' : `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default ToolProgressBar;
