import PQueue from 'p-queue';

// Max concurrent heavy processes (Ghostscript, LibreOffice, Playwright, Tesseract)
const CONCURRENCY = parseInt(process.env.JOB_CONCURRENCY || '4', 10);

// Per-queue timeouts (ms) — processes that take longer are killed
const JOB_TIMEOUT = parseInt(process.env.JOB_TIMEOUT_MS || '120000', 10); // 2 minutes

export const processingQueue = new PQueue({ concurrency: CONCURRENCY, timeout: JOB_TIMEOUT });

/**
 * Enqueue a heavy processing function.
 * Throws if queue is full (size > 2× concurrency) to avoid backlog pile-up.
 */
export async function enqueue(fn) {
  const maxQueueSize = CONCURRENCY * 2;
  if (processingQueue.size >= maxQueueSize) {
    const err = new Error('Server busy — too many concurrent jobs. Try again shortly.');
    err.statusCode = 503;
    throw err;
  }
  return processingQueue.add(fn);
}
