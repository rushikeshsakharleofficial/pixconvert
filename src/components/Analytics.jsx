import { useState, useEffect, useCallback, useMemo } from 'react';
import { GlowingLineChart } from './ui/glowing-line-chart.jsx';
import { DonutChart } from './ui/donut-chart.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getLocalUsageStats } from '../utils/trackUsage';

const PERIODS = [
  { key: 'daily', label: 'Day' },
  { key: 'weekly', label: 'Week' },
  { key: 'monthly', label: 'Month' },
  { key: 'yearly', label: 'Year' },
];

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

const TopToolsDonut = ({ tools }) => {
  const [hoveredSegment, setHoveredSegment] = useState(null);

  if (!tools.length) {
    return <p className="analytics-empty">No usage data yet. Process some files to see stats!</p>;
  }

  const total = tools.reduce((sum, t) => sum + t.count, 0);

  const donutData = tools.map((t, i) => ({
    value: t.count,
    label: toolLabel(t.tool),
    color: `hsl(${(i * 137.5) % 360}, 70%, 55%)`,
    slug: t.tool
  }));

  const activeSegment = hoveredSegment;
  const displayValue = activeSegment?.value ?? total;
  const displayLabel = activeSegment?.label ?? "Total Uses";
  const displayPercentage = activeSegment ? (activeSegment.value / total) * 100 : 100;

  return (
    <div className="flex flex-col md:flex-row items-center justify-around gap-8 py-4">
      <div className="relative flex items-center justify-center">
        <DonutChart
          data={donutData}
          size={240}
          strokeWidth={28}
          onSegmentHover={setHoveredSegment}
          centerContent={
            <AnimatePresence mode="wait">
              <motion.div
                key={displayLabel}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center text-center p-2"
              >
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">
                  {displayLabel}
                </p>
                <p className="text-3xl font-black text-foreground tabular-nums">
                  {displayValue}
                </p>
                {activeSegment && (
                  <p className="text-sm font-bold text-primary mt-1">
                    {displayPercentage.toFixed(1)}%
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          }
        />
      </div>

      <div className="flex flex-col gap-2 min-w-[200px] flex-1">
        {donutData.slice(0, 6).map((segment) => (
          <div
            key={segment.slug}
            className={cn(
              "flex items-center justify-between p-2 rounded-lg transition-all border border-transparent",
              activeSegment?.label === segment.label ? "bg-white/5 border-white/10" : "opacity-80"
            )}
            onMouseEnter={() => setHoveredSegment(segment)}
            onMouseLeave={() => setHoveredSegment(null)}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: segment.color, boxShadow: `0 0 10px ${segment.color}44` }}
              />
              <span className="text-xs font-semibold truncate max-w-[140px]">{segment.label}</span>
            </div>
            <span className="text-xs font-mono font-bold">{segment.value}</span>
          </div>
        ))}
        {donutData.length > 6 && (
          <p className="text-[10px] text-muted-foreground text-center mt-2 italic">
            + {donutData.length - 6} more tools
          </p>
        )}
      </div>
    </div>
  );
};

const Analytics = () => {
  const [period, setPeriod] = useState('monthly');
  const [stats, setStats] = useState(null);
  const [liveTotal, setLiveTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('api');

  const fetchStats = useCallback(async (p) => {
    try {
      const res = await fetch(`/api/metrics/stats?period=${p}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error('Metrics API returned non-JSON response');
        }
        const data = await res.json();
        setStats(data);
        setLiveTotal(data.totalAllTime);
        setDataSource('api');
        return;
      }
    } catch {
      // Static deployments may not have the Express metrics API.
    }

    try {
      const localStats = getLocalUsageStats(p);
      setStats(localStats);
      setLiveTotal(localStats.totalAllTime);
      setDataSource('local');
    } catch {
      const emptyStats = getLocalUsageStats(p);
      setStats(emptyStats);
      setLiveTotal(emptyStats.totalAllTime);
      setDataSource('local');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchStats(period);
  }, [period, fetchStats]);

  // Poll for live updates every 30 seconds (SSE not supported on static deployment)
  useEffect(() => {
    const id = setInterval(() => fetchStats(period), 30_000);
    return () => clearInterval(id);
  }, [period, fetchStats]);

  useEffect(() => {
    const onLocalMetrics = () => fetchStats(period);
    window.addEventListener('pixconvert:metrics-updated', onLocalMetrics);
    window.addEventListener('storage', onLocalMetrics);
    return () => {
      window.removeEventListener('pixconvert:metrics-updated', onLocalMetrics);
      window.removeEventListener('storage', onLocalMetrics);
    };
  }, [period, fetchStats]);

  // Adapt backend buckets to Recharts format
  const chartData = useMemo(() => {
    if (!stats?.buckets) return [];
    return stats.buckets.map(b => ({
      label: b.label,
      ...b.tools
    }));
  }, [stats]);

  // Generate chart config dynamically from tools present in data
  const chartConfig = useMemo(() => {
    if (!stats?.buckets) return {};
    const toolSet = new Set();
    stats.buckets.forEach(b => {
      if (b.tools) Object.keys(b.tools).forEach(t => toolSet.add(t));
    });
    
    const config = {};
    Array.from(toolSet).forEach((tool, i) => {
      config[tool] = {
        label: toolLabel(tool),
        color: `hsl(${(i * 137.5) % 360}, 70%, 50%)`,
      };
    });
    return config;
  }, [stats]);


  return (
    <section>
      <div className="container">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
          <div>
            <h1 className="section-title fade-in visible">Analytics</h1>
            <p className="section-subtitle fade-in visible" style={{ textAlign: 'left', margin: 0 }}>Real-time file processing metrics</p>
          </div>
          <div className="analytics-live-badge">
            <span className="live-dot" />
            <span className="live-count">{liveTotal.toLocaleString()}</span>
            <span className="live-label">{dataSource === 'local' ? 'files processed here' : 'files processed'}</span>
          </div>
        </div>

        <div className="fade-in visible" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="glass" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div className="analytics-periods" style={{ alignSelf: 'flex-start' }}>
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
              <span className="analytics-card-badge">
                {stats?.total?.toLocaleString() || 0} this {period === 'daily' ? 'day' : period === 'weekly' ? 'week' : period === 'monthly' ? 'month' : 'year'}
              </span>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {loading ? (
                <div className="analytics-loading">Loading chart…</div>
              ) : chartData.length ? (
                <GlowingLineChart 
                  data={chartData} 
                  config={chartConfig} 
                  title="Files Processed"
                  description={`Usage trends per ${period}`}
                  trending="Live"
                />
              ) : (
                <p className="analytics-empty">No data for this period.</p>
              )}
            </div>
          </div>

          <div className="glass" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontFamily: 'var(--heading)', color: 'var(--text)', marginBottom: '1.5rem', fontSize: '1.35rem', fontWeight: '800' }}>
              Top Tools
            </h3>
            <div style={{ flex: 1 }}>
              {loading ? (
                <div className="analytics-loading">Loading…</div>
              ) : (
                <TopToolsDonut tools={stats?.topTools || []} />
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Analytics;
