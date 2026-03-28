import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const PORT = process.env.PORT || 4000;

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
    const ts = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${ts}_${safe}`);
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
});

app.use('/api/', generalLimiter);

// Serve uploads folder statically
app.use('/uploads', express.static(UPLOADS_DIR));

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
    url: `/uploads/${f.filename}`,
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

// DELETE /api/files/:id — delete a specific file (with path traversal protection)
app.delete('/api/files/:id', (req, res) => {
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

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
