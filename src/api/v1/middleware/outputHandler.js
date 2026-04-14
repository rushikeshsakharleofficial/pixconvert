import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOADS_DIR = path.resolve(__dirname, '../../../../', process.env.DOWNLOADS_DIR || 'downloads');

fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

const FILE_TTL_HOURS = parseInt(process.env.FILE_TTL_HOURS || '1', 10);

/**
 * Send processed result to client.
 * - Default: stream binary
 * - ?output=url: save to downloads dir and return URL
 *
 * @param {object} res - Express response
 * @param {object} req - Express request
 * @param {Buffer|string} data - Result buffer or file path
 * @param {string} filename - Suggested download filename
 * @param {string} contentType - MIME type
 */
// Strip CR, LF, and quotes from filename to prevent CRLF injection (CWE-93)
const sanitizeFilename = (name) => String(name).replace(/[\r\n"]/g, '');

export async function sendResult(req, res, data, filename, contentType) {
  const outputMode = req.query.output;

  if (outputMode === 'url') {
    const id = crypto.randomBytes(12).toString('hex');
    const ext = path.extname(filename);
    const savedName = `${id}${ext}`;
    const savedPath = path.join(DOWNLOADS_DIR, savedName);

    if (typeof data === 'string' && fs.existsSync(data)) {
      fs.copyFileSync(data, savedPath);
    } else if (Buffer.isBuffer(data) || data instanceof Uint8Array) {
      fs.writeFileSync(savedPath, data);
    } else {
      return res.status(500).json({ success: false, error: 'Internal: invalid result data' });
    }

    const size = fs.statSync(savedPath).size;
    const expiresAt = new Date(Date.now() + FILE_TTL_HOURS * 60 * 60 * 1000).toISOString();

    return res.json({
      success: true,
      url: `/downloads/${savedName}`,
      filename,
      size,
      expiresAt,
    });
  }

  // Default: binary stream
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename(filename)}"`);

  if (typeof data === 'string' && fs.existsSync(data)) {
    const stat = fs.statSync(data);
    res.setHeader('Content-Length', stat.size);
    fs.createReadStream(data).pipe(res);
  } else if (Buffer.isBuffer(data) || data instanceof Uint8Array) {
    res.setHeader('Content-Length', data.length);
    res.end(data);
  } else {
    res.status(500).json({ success: false, error: 'Internal: invalid result data' });
  }
}

/**
 * Send multi-file result as ZIP.
 */
export async function sendZipResult(req, res, files, zipFilename) {
  const archiver = (await import('archiver')).default;
  const outputMode = req.query.output;

  if (outputMode === 'url') {
    const id = crypto.randomBytes(12).toString('hex');
    const savedName = `${id}.zip`;
    const savedPath = path.join(DOWNLOADS_DIR, savedName);
    const output = fs.createWriteStream(savedPath);
    const archive = archiver('zip', { zlib: { level: 6 } });

    archive.pipe(output);
    for (const f of files) {
      if (Buffer.isBuffer(f.data)) {
        archive.append(f.data, { name: f.name });
      } else if (typeof f.data === 'string') {
        archive.file(f.data, { name: f.name });
      }
    }
    await archive.finalize();
    await new Promise((resolve) => output.on('close', resolve));

    const size = fs.statSync(savedPath).size;
    const expiresAt = new Date(Date.now() + FILE_TTL_HOURS * 60 * 60 * 1000).toISOString();

    return res.json({ success: true, url: `/downloads/${savedName}`, filename: zipFilename, size, expiresAt });
  }

  // Stream ZIP directly
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename(zipFilename)}"`);

  const archive = archiver('zip', { zlib: { level: 6 } });
  archive.pipe(res);
  for (const f of files) {
    if (Buffer.isBuffer(f.data)) {
      archive.append(f.data, { name: f.name });
    } else if (typeof f.data === 'string') {
      archive.file(f.data, { name: f.name });
    }
  }
  await archive.finalize();
}

// Cleanup downloads older than TTL
export function cleanupDownloads() {
  const now = Date.now();
  const ttlMs = FILE_TTL_HOURS * 60 * 60 * 1000;

  if (!fs.existsSync(DOWNLOADS_DIR)) return;

  for (const file of fs.readdirSync(DOWNLOADS_DIR)) {
    const filePath = path.join(DOWNLOADS_DIR, file);
    try {
      const { mtimeMs } = fs.statSync(filePath);
      if (now - mtimeMs > ttlMs) {
        fs.unlinkSync(filePath);
      }
    } catch { /* skip */ }
  }
}
