import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { fileTypeFromBuffer } from 'file-type';

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

const _multer = multer({
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

// Wrap multer so every .array() / .single() call automatically appends magic byte validation.
// Express accepts arrays of middleware handlers and flattens them — no route changes needed.
export const upload = {
  array: (field, maxCount) => [_multer.array(field, maxCount), validateMagicBytes],
  single: (field) => [_multer.single(field), validateMagicBytes],
  fields: (fields) => [_multer.fields(fields), validateMagicBytes],
};

// Extensions to skip magic byte check (plain text — no reliable magic bytes)
const SKIP_MAGIC_EXTS = new Set(['.html', '.htm']);

// Allowed MIME types per extension (file-type detection)
const EXT_ALLOWED_MIMES = {
  '.pdf':  ['application/pdf'],
  '.jpg':  ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png':  ['image/png'],
  '.webp': ['image/webp'],
  '.bmp':  ['image/bmp'],
  '.gif':  ['image/gif'],
  '.heic': ['image/heic', 'image/heif'],
  '.heif': ['image/heic', 'image/heif'],
  '.doc':  ['application/msword', 'application/x-cfb'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'],
  '.xls':  ['application/vnd.ms-excel', 'application/x-cfb'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip'],
  '.ppt':  ['application/vnd.ms-powerpoint', 'application/x-cfb'],
  '.pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip'],
};

/**
 * Post-upload middleware: validates magic bytes of each uploaded file match its extension.
 * Rejects files where the detected MIME type doesn't match the declared extension.
 */
export async function validateMagicBytes(req, res, next) {
  if (!req.files?.length) return next();

  for (const file of req.files) {
    const ext = path.extname(file.originalname).toLowerCase();

    if (SKIP_MAGIC_EXTS.has(ext)) continue;

    const allowed = EXT_ALLOWED_MIMES[ext];
    if (!allowed) continue; // unknown ext already blocked by fileFilter

    try {
      // Read first 4100 bytes — enough for all supported types
      const fd = fs.openSync(file.path, 'r');
      const buf = Buffer.alloc(4100);
      const bytesRead = fs.readSync(fd, buf, 0, 4100, 0);
      fs.closeSync(fd);

      const detected = await fileTypeFromBuffer(buf.subarray(0, bytesRead));

      if (!detected || !allowed.includes(detected.mime)) {
        // Clean up all uploaded files before rejecting
        for (const f of req.files) {
          try { fs.unlinkSync(f.path); } catch { /* ignore */ }
        }
        return res.status(415).json({
          success: false,
          error: `File content does not match declared type for "${file.originalname}". Expected ${ext}, detected ${detected?.mime || 'unknown'}.`,
        });
      }
    } catch (err) {
      console.error('[magic-bytes] check failed:', err.message);
      // On unexpected error, fail safe — reject the file
      for (const f of req.files) {
        try { fs.unlinkSync(f.path); } catch { /* ignore */ }
      }
      return res.status(415).json({ success: false, error: 'File type validation failed' });
    }
  }

  next();
}

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
