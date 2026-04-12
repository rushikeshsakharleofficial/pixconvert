import { useState, useEffect, useRef, useCallback } from 'react';

const PERIODS = [
  { key: 'daily', label: 'Day' },
  { key: 'weekly', label: 'Week' },
  { key: 'monthly', label: 'Month' },
  { key: 'yearly', label: 'Year' },
];

// Friendly tool names
const TOOL_LABELS = {
  'converter': 'Universal Converter',
  'gif': 'GIF Maker',
  'merge-pdf': 'Merge PDF',
  'split-pdf': 'Split PDF',
  'pdf': 'Unlock PDF',
  'pdf-lock': 'Protect PDF',
  'pdf-to-jpg': 'PDF to JPG',
  'pdf-to-word': 'PDF to Word',
  'pdf-to-powerpoint': 'PDF to PowerPoint',
  'pdf-to-excel': 'PDF to Excel',
  'pdf-to-pdf-a': 'PDF to PDF/A',
  'jpg-to-pdf': 'JPG to PDF',
  'word-to-pdf': 'Word to PDF',
  'powerpoint-to-pdf': 'PowerPoint to PDF',
  'excel-to-pdf': 'Excel to PDF',
  'html-to-pdf': 'HTML to PDF',
  'rotate-pdf': 'Rotate PDF',
  'add-page-numbers': 'Add Page Numbers',
  'add-watermark': 'Add Watermark',
  'crop-pdf': 'Crop PDF',
  'edit-pdf': 'Edit PDF',
  'sign-pdf': 'Sign PDF',
  'redact-pdf': 'Redact PDF',
  'compare-pdf': 'Compare PDF',
  'remove-pages': 'Remove Pages',
  'extract-pages': 'Extract Pages',
  'organize-pdf': 'Organize PDF',
  'scan-to-pdf': 'Scan to PDF',
  'jpg-to-png': 'JPG to PNG',
  'png-to-jpg': 'PNG to JPG',
  'webp-to-jpg': 'WebP to JPG',
  'heic-to-jpg': 'HEIC to JPG',
  'bmp-to-png': 'BMP to PNG',
  'photo-to-markdown': 'Photo to Markdown',
  'ocr-pdf': 'OCR PDF',
  'compress-pdf': 'Compress PDF',
  'repair-pdf': 'Repair PDF',
};

const toolLabel = (slug) => TOOL_LABELS[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// ─── SVG Bar Chart ───
const BarChart = ({ buckets }) => {
  const max = Math.max(...buckets.map(b => b.count), 1);
  const w = 720, h = 260, pad = { top: 20, right: 12, bottom: 52, left: 44 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;
  const barW = Math.max(4, chartW / buckets.length - 4);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Y-axis ticks
  const yTicks = [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="analytics-chart-svg">
      {/* Grid lines */}
      {yTicks.map((t, i) => {
        const y = pad.top + chartH - (t / max) * chartH;
        return (
          <g key={i}>
            <line x1={pad.left} x2={w - pad.right} y1={y} y2={y}
              stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />
            <text x={pad.left - 8} y={y + 4} textAnchor="end"
              className="chart-axis-text">{t}</text>
          </g>
        );
      })}

      {/* Bars */}
      {buckets.map((b, i) => {
        const x = pad.left + (i / buckets.length) * chartW + 2;
        const barH = (b.count / max) * chartH;
        const y = pad.top + chartH - barH;
        const isHovered = hoveredIdx === i;
        return (
          <g key={i}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <rect x={x} y={y} width={barW} height={barH}
              rx={2} fill={isHovered ? 'var(--primary)' : 'rgba(255,79,0,0.65)'}
              style={{ transition: 'fill 0.15s, height 0.3s, y 0.3s' }}
            />
            {/* Hover tooltip */}
            {isHovered && b.count > 0 && (
              <g>
                <rect x={x + barW / 2 - 20} y={y - 26} width={40} height={20}
                  rx={4} fill="var(--bg)" stroke="var(--border)" strokeWidth={0.5} />
                <text x={x + barW / 2} y={y - 12} textAnchor="middle"
                  className="chart-tooltip-text">{b.count}</text>
              </g>
            )}
            {/* X-axis label */}
            {(buckets.length <= 12 || i % Math.ceil(buckets.length / 12) === 0) && (
              <text x={x + barW / 2} y={h - pad.bottom + 16}
                textAnchor="middle" className="chart-axis-text"
                transform={`rotate(-35, ${x + barW / 2}, ${h - pad.bottom + 16})`}>
                {b.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ─── Top Tools List ───
const TopToolsList = ({ tools }) => {
  if (!tools.length) {
    return <p className="analytics-empty">No usage data yet. Process some files to see stats!</p>;
  }
  const maxCount = tools[0]?.count || 1;

  return (
    <div className="top-tools-list">
      {tools.map((t, i) => (
        <div key={t.tool} className="top-tool-row">
          <span className="top-tool-rank">#{i + 1}</span>
          <span className="top-tool-name">{toolLabel(t.tool)}</span>
          <div className="top-tool-bar-wrap">
            <div className="top-tool-bar"
              style={{ width: `${(t.count / maxCount) * 100}%` }} />
          </div>
          <span className="top-tool-count">{t.count.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Analytics Page ───
const Analytics = () => {
  const [period, setPeriod] = useState('monthly');
  const [stats, setStats] = useState(null);
  const [liveTotal, setLiveTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const esRef = useRef(null);

  const fetchStats = useCallback(async (p) => {
    try {
      const res = await fetch(`/api/metrics/stats?period=${p}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setLiveTotal(data.totalAllTime);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchStats(period);
  }, [period, fetchStats]);

  // SSE for live updates
  useEffect(() => {
    let es;
    try {
      es = new EventSource('/api/metrics/stream');
      esRef.current = es;

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (typeof data.totalAllTime === 'number') {
            setLiveTotal(data.totalAllTime);
          }
          if (data.type === 'new_event') {
            // Refetch stats on new events to update the chart
            fetchStats(period);
          }
        } catch (err) {
          console.error('SSE Error:', err);
        }
      };

      es.onerror = () => {
        // Auto-reconnect is built into EventSource
      };
    } catch {
      // SSE not supported or server not running
    }

    return () => {
      if (es) es.close();
    };
  }, [period, fetchStats]);

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div>
          <h1 className="analytics-title">Analytics</h1>
          <p className="analytics-subtitle">Real-time file processing metrics</p>
        </div>
        <div className="analytics-live-badge">
          <span className="live-dot" />
          <span className="live-count">{liveTotal.toLocaleString()}</span>
          <span className="live-label">files processed</span>
        </div>
      </div>

      {/* Period toggle */}
      <div className="analytics-periods">
        {PERIODS.map(p => (
          <button
            key={p.key}
            className={`period-btn${period === p.key ? ' active' : ''}`}
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chart section */}
      <div className="analytics-card analytics-chart-card">
        <h2 className="analytics-card-title">
          Files Processed
          <span className="analytics-card-badge">
            {stats?.total?.toLocaleString() || 0} this {period === 'daily' ? 'day' : period === 'weekly' ? 'week' : period === 'monthly' ? 'month' : 'year'}
          </span>
        </h2>
        {loading ? (
          <div className="analytics-loading">Loading chart…</div>
        ) : stats?.buckets?.length ? (
          <BarChart buckets={stats.buckets} />
        ) : (
          <p className="analytics-empty">No data for this period.</p>
        )}
      </div>

      {/* Top tools */}
      <div className="analytics-card">
        <h2 className="analytics-card-title">Top Tools</h2>
        {loading ? (
          <div className="analytics-loading">Loading…</div>
        ) : (
          <TopToolsList tools={stats?.topTools || []} />
        )}
      </div>
    </div>
  );
};

export default Analytics;
