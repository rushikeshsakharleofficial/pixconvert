import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import nodemailer from 'nodemailer';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import v1Router from './src/api/v1/index.js';
import { cleanupDownloads } from './src/api/v1/middleware/outputHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, process.env.UPLOADS_DIR || 'uploads');
const DIST_DIR = path.resolve(__dirname, 'dist');
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const API_PORT = parseInt(process.env.API_PORT || process.env.PORT || 3000, 10);
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || 8080, 10);
const METRICS_FILE = path.resolve(__dirname, process.env.METRICS_FILE || path.join('data', 'metrics.json'));
const TWO_YEARS_MS = 2 * 365.25 * 24 * 60 * 60 * 1000;
const MAX_METRICS_EVENTS = parseInt(process.env.MAX_METRICS_EVENTS || '100000', 10);
const MAX_METRICS_COUNT = parseInt(process.env.MAX_METRICS_COUNT || '10', 10);

// --- Metrics: in-memory cache + JSON persistence ---
let metricsEvents = [];
const sseClients = new Set();

const loadMetrics = () => {
  try {
    if (fs.existsSync(METRICS_FILE)) {
      const raw = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf-8'));
      metricsEvents = Array.isArray(raw.events) ? raw.events : [];
    }
  } catch (err) {
    console.error('[metrics] Failed to load:', err.message);
    metricsEvents = [];
  }
};

const saveMetrics = () => {
  try {
    if (metricsEvents.length > MAX_METRICS_EVENTS) {
      metricsEvents = metricsEvents.slice(metricsEvents.length - MAX_METRICS_EVENTS);
    }
    fs.mkdirSync(path.dirname(METRICS_FILE), { recursive: true });
    fs.writeFileSync(METRICS_FILE, JSON.stringify({ events: metricsEvents }));
  } catch (err) {
    console.error('[metrics] Failed to save:', err.message);
  }
};

const purgeOldMetrics = () => {
  const cutoff = Date.now() - TWO_YEARS_MS;
  const before = metricsEvents.length;
  metricsEvents = metricsEvents.filter(e => e.ts >= cutoff);
  if (metricsEvents.length < before) {
    console.log(`[metrics] Purged ${before - metricsEvents.length} events older than 2 years`);
    saveMetrics();
  }
};

const broadcastSSE = (data) => {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try { res.write(msg); } catch { sseClients.delete(res); }
  }
};

const aggregateStats = (period) => {
  const now = Date.now();
  const ranges = {
    daily:   24 * 60 * 60 * 1000,
    weekly:  7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000,
    yearly:  365 * 24 * 60 * 60 * 1000,
  };
  const range = ranges[period] || ranges.monthly;
  const cutoff = now - range;
  const filtered = metricsEvents.filter(e => e.ts >= cutoff);

  // Time-bucketed counts for chart
  let bucketMs, bucketCount;
  if (period === 'daily') { bucketMs = 60 * 60 * 1000; bucketCount = 24; }        // hourly buckets
  else if (period === 'weekly') { bucketMs = 24 * 60 * 60 * 1000; bucketCount = 7; } // daily buckets
  else if (period === 'monthly') { bucketMs = 24 * 60 * 60 * 1000; bucketCount = 30; }
  else { bucketMs = 30 * 24 * 60 * 60 * 1000; bucketCount = 12; }                  // monthly buckets

  const buckets = Array.from({ length: bucketCount }, (_, i) => {
    // We want the last bucket to end exactly at "now"
    const start = now - (bucketCount - i) * bucketMs;
    const end = start + bucketMs;
    const bucketEvents = filtered.filter(e => e.ts >= start && (i === bucketCount - 1 ? e.ts <= end : e.ts < end));
    
    // Per-tool breakdown
    const tools = {};
    bucketEvents.forEach(e => {
      tools[e.tool] = (tools[e.tool] || 0) + 1;
    });

    return {
      label: new Date(start).toLocaleDateString('en-US', period === 'daily'
        ? { hour: '2-digit' }
        : period === 'yearly'
          ? { month: 'short' }
          : { month: 'short', day: 'numeric' }),
      count: bucketEvents.length,
      tools,
    };
  });

  // Top tools
  const toolCounts = {};
  filtered.forEach(e => { toolCounts[e.tool] = (toolCounts[e.tool] || 0) + 1; });
  const topTools = Object.entries(toolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tool, count]) => ({ tool, count }));

  return { period, total: filtered.length, totalAllTime: metricsEvents.length, buckets, topTools };
};

// Load metrics on startup and schedule purge
loadMetrics();
purgeOldMetrics();
setInterval(purgeOldMetrics, 24 * 60 * 60 * 1000); // daily purge check

// Allowed origins for CORS (comma-separated in env, fallback to localhost for dev)
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:4000'];

// Ensure uploads dir exists
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// --- Cleanup: delete files older than 7 days ---
const cleanupOldFiles = () => {
  const now = Date.now();
  fs.readdirSync(UPLOADS_DIR).forEach(file => {
    if (file === '.gitkeep') return;
    const filePath = path.join(UPLOADS_DIR, file);
    try {
      const { mtimeMs } = fs.statSync(filePath);
      if (now - mtimeMs > MAX_AGE_MS) {
        fs.unlinkSync(filePath);
        console.log(`[cleanup] Deleted expired file: ${file}`);
      }
    } catch (err) {
      console.error(`[cleanup] Failed to process ${file}:`, err.message);
    }
  });
};

// Run cleanup on startup and every hour
cleanupOldFiles();
setInterval(cleanupOldFiles, 60 * 60 * 1000);

// --- Multer config ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`);
  },
});

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10) * 1024 * 1024;
const MAX_FILES_PER_UPLOAD = parseInt(process.env.MAX_FILES_PER_UPLOAD || '50', 10);

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const app = express();
app.set('trust proxy', process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : 1);

// CORS — restrict to allowed origins
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));

app.use(express.json({ limit: '10kb' }));

app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: 'Request body too large' });
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ success: false, error: 'Invalid JSON body' });
  }
  next(err);
});

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Rate limiting
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many uploads. Please try again later.' },
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many contact submissions. Please try again later.' },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests. Please slow down.' },
  skip: (req) => {
    // Skip rate limiting for documentation and metrics as they are frontend-support calls
    const path = req.originalUrl.split('?')[0];
    return path === '/api/docs' || path.startsWith('/api/metrics');
  }
});

// --- API docs page ---
app.get('/api/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'api-docs.html'));
});

app.use('/api/', generalLimiter);

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
}

// --- Path traversal protection helper ---
const safePath = (filename) => {
  const filePath = path.join(UPLOADS_DIR, path.basename(filename));
  if (!filePath.startsWith(UPLOADS_DIR)) return null;
  return filePath;
};

// POST /api/upload — accept one or more images
app.post('/api/upload', uploadLimiter, upload.array('files', MAX_FILES_PER_UPLOAD), (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded' });
  const saved = req.files.map(f => ({
    id: f.filename,
    name: f.originalname,
    size: f.size,
    expiresAt: new Date(Date.now() + MAX_AGE_MS).toISOString(),
  }));
  res.json({ files: saved });
});

// GET /api/files — list uploaded files (restricted to admin use only)
// WARNING: This endpoint lists ALL uploads. In production, add authentication
// middleware or remove this endpoint entirely if not needed.
app.get('/api/files', (req, res) => {
  const apiKey = req.headers['x-admin-key'];
  if (!process.env.ADMIN_API_KEY || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ error: 'Forbidden — admin key required' });
  }
  const now = Date.now();
  const files = fs.readdirSync(UPLOADS_DIR)
    .filter(f => f !== '.gitkeep')
    .map(f => {
      const { mtimeMs, size } = fs.statSync(path.join(UPLOADS_DIR, f));
      const expiresAt = new Date(mtimeMs + MAX_AGE_MS);
      const msLeft = expiresAt - now;
      const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
      const name = f.replace(/^\d+_/, '');
      return { id: f, name, size, url: `/uploads/${f}`, expiresAt: expiresAt.toISOString(), daysLeft };
    })
    .sort((a, b) => b.id.localeCompare(a.id));
  res.json({ files });
});

// DELETE /api/files/:id — delete a specific file (admin only)
app.delete('/api/files/:id', (req, res) => {
  const apiKey = req.headers['x-admin-key'];
  if (!process.env.ADMIN_API_KEY || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ error: 'Forbidden — admin key required' });
  }
  const filePath = safePath(req.params.id);
  if (!filePath) return res.status(403).json({ error: 'Forbidden' });
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  fs.unlinkSync(filePath);
  res.json({ ok: true });
});

// POST /api/contact — Handle Contact Us form
app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing required fields' });

  // Input length limits to prevent abuse
  if (typeof name !== 'string' || name.length > 100) return res.status(400).json({ error: 'Name too long (max 100 chars)' });
  if (typeof email !== 'string' || email.length > 254) return res.status(400).json({ error: 'Email too long' });
  if (subject && (typeof subject !== 'string' || subject.length > 200)) return res.status(400).json({ error: 'Subject too long (max 200 chars)' });
  if (typeof message !== 'string' || message.length > 5000) return res.status(400).json({ error: 'Message too long (max 5000 chars)' });

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });

  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
  const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
  const SMTP_USER = process.env.SMTP_USER || '';
  const SMTP_PASS = process.env.SMTP_PASS || '';
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@pixconvert.com';

  if (!SMTP_HOST || !ADMIN_EMAIL) {
    console.error('SMTP_HOST or ADMIN_EMAIL not configured in environment variables');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    const transportConfig = {
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
    };

    if (SMTP_USER) {
      transportConfig.auth = {
        user: SMTP_USER,
        pass: SMTP_PASS,
      };
    }

    const transporter = nodemailer.createTransport(transportConfig);

    await transporter.sendMail({
      from: `"PixConvert Contact" <${FROM_EMAIL}>`,
      replyTo: `"${name.replace(/[<>"]/g, '')}" <${email}>`,
      to: ADMIN_EMAIL,
      subject: `Contact Form: ${(subject || 'Feedback').replace(/[<>]/g, '')}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    res.json({ ok: true });
  } catch (error) {
    console.error('SMTP Error:', error.message);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// --- Metrics API ---
// POST /api/metrics/track — record tool usage event(s)
app.post('/api/metrics/track', (req, res) => {
  const { tool, count = 1 } = req.body;
  if (!tool || typeof tool !== 'string' || tool.length > 80 || !/^[a-zA-Z0-9 _.-]+$/.test(tool)) {
    return res.status(400).json({ error: 'Invalid tool name' });
  }
  
  const num = Math.max(1, Math.min(MAX_METRICS_COUNT, Number(count) || 1));
  const now = Date.now();
  
  for (let i = 0; i < num; i++) {
    metricsEvents.push({ tool: tool.toLowerCase().trim(), ts: now });
  }
  
  saveMetrics();
  broadcastSSE({ 
    type: 'new_event', 
    tool: tool.toLowerCase().trim(),
    count: num,
    totalAllTime: metricsEvents.length 
  });
  res.json({ ok: true });
});

// GET /api/metrics/stats — aggregated stats for charts
app.get('/api/metrics/stats', (req, res) => {
  const period = ['daily', 'weekly', 'monthly', 'yearly'].includes(req.query.period)
    ? req.query.period : 'monthly';
  res.json(aggregateStats(period));
});

// GET /api/metrics/stream — SSE for live updates
app.get('/api/metrics/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(`data: ${JSON.stringify({ type: 'connected', totalAllTime: metricsEvents.length })}\n\n`);
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

// --- API v1 routes ---
app.use('/api/v1', v1Router);

// Serve downloads folder (for ?output=url mode)
const DOWNLOADS_DIR = path.resolve(__dirname, process.env.DOWNLOADS_DIR || 'downloads');
fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
app.use('/downloads', express.static(DOWNLOADS_DIR, {
  dotfiles: 'deny',
  etag: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'attachment');
  },
}));

// Cleanup downloads on schedule
cleanupDownloads();
setInterval(cleanupDownloads, 10 * 60 * 1000); // every 10 minutes

if (fs.existsSync(DIST_DIR)) {
  app.get(/^(?!\/api\/|\/uploads\/|\/downloads\/).*/, (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(API_PORT, () => console.log(`API server running at http://localhost:${API_PORT}`));
if (FRONTEND_PORT !== API_PORT) {
  app.listen(FRONTEND_PORT, () => console.log(`Frontend running at http://localhost:${FRONTEND_PORT}`));
}
