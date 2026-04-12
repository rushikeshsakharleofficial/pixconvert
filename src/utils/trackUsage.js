/**
 * Fire-and-forget tool usage tracker.
 * Sends a non-blocking POST to the metrics API.
 * @param {string} tool - tool slug, e.g. "merge-pdf"
 */
export function trackToolUsage(tool) {
  if (!tool) return;
  try {
    fetch('/api/metrics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool }),
    }).catch(() => {});
  } catch {
    // silent — metrics should never break UX
  }
}
