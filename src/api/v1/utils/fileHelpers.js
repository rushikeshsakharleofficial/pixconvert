import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

/**
 * Create a temporary file path for processing.
 */
export function tempPath(ext = '.pdf') {
  const name = `pixconv_${crypto.randomBytes(8).toString('hex')}${ext}`;
  return path.join(os.tmpdir(), name);
}

/**
 * Clean up temporary files. Accepts single path or array.
 */
export function cleanup(...paths) {
  for (const p of paths.flat()) {
    try {
      if (p && fs.existsSync(p)) fs.unlinkSync(p);
    } catch { /* skip */ }
  }
}

/**
 * Clean up uploaded files from req.files after processing.
 */
export function cleanupUploads(req) {
  if (!req.files) return;
  for (const f of req.files) {
    cleanup(f.path);
  }
}

/**
 * Require at least N files in request. Returns error response or null.
 */
export function requireFiles(req, res, min = 1) {
  const count = (req.files || []).length;
  if (count < min) {
    res.status(400).json({
      success: false,
      error: `At least ${min} file(s) required. Got ${count}.`,
    });
    return false;
  }
  return true;
}

/**
 * Require files to match specific mime types.
 */
export function requireMimeTypes(req, res, allowedTypes, label = 'file') {
  for (const f of req.files || []) {
    const ext = path.extname(f.originalname).toLowerCase();
    const mime = f.mimetype;
    const match = allowedTypes.some((t) =>
      t.startsWith('.') ? ext === t : mime === t || mime.startsWith(t)
    );
    if (!match) {
      res.status(415).json({
        success: false,
        error: `Unsupported ${label} type: ${f.originalname} (${mime}). Allowed: ${allowedTypes.join(', ')}`,
      });
      return false;
    }
  }
  return true;
}

/**
 * Read uploaded file as Buffer.
 */
export function readFileBuffer(filePath) {
  return fs.readFileSync(filePath);
}
