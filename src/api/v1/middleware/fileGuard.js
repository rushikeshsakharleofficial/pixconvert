import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, '../../../../', process.env.UPLOADS_DIR || 'uploads');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10) * 1024 * 1024;
const MAX_FILES = parseInt(process.env.MAX_FILES_PER_UPLOAD || '50', 10);

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif', '.heic', '.heif',
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.html', '.htm',
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error('Unsupported file type'));
    }
    cb(null, true);
  },
});

// Middleware to check file size limit and return friendly error
export function fileSizeError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: `File too large. Max ${process.env.MAX_FILE_SIZE_MB || 50}MB allowed.`,
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: `Too many files. Max ${MAX_FILES} files per request.`,
      });
    }
    return res.status(400).json({ success: false, error: err.message });
  }
  next(err);
}
