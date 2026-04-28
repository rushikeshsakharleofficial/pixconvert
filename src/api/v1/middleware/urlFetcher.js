import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { assertPublicHttpUrl, MAX_REDIRECTS, resolveRedirectUrl } from '../utils/networkGuard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, '../../../../', process.env.UPLOADS_DIR || 'uploads');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10) * 1024 * 1024;
const FETCH_TIMEOUT = parseInt(process.env.URL_FETCH_TIMEOUT_MS || '30000', 10);

/**
 * Middleware: if request has `urls` field (JSON body or form field),
 * download each URL to uploads dir and append to req.files array.
 */
export async function fetchUrlFiles(req, res, next) {
  try {
    // Collect URLs from body or form field
    let urls = [];
    if (req.body?.urls) {
      urls = Array.isArray(req.body.urls) ? req.body.urls : [req.body.urls];
    }
    // Also check multipart field "urls" (comma-separated or repeated)
    if (req.body?.url) {
      urls.push(req.body.url);
    }

    if (urls.length === 0) return next();

    if (!req.files) req.files = [];

    for (const url of urls) {
      if (typeof url !== 'string') {
        return res.status(400).json({ success: false, error: 'Invalid URL' });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      try {
        let currentUrl = url;
        let response;

        for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
          await assertPublicHttpUrl(currentUrl);
          response = await fetch(currentUrl, {
            signal: controller.signal,
            redirect: 'manual',
            headers: { 'User-Agent': 'PixConvert-API/1.0' },
          });

          if (![301, 302, 303, 307, 308].includes(response.status)) break;

          const location = response.headers.get('location');
          if (!location) break;
          if (redirectCount === MAX_REDIRECTS) {
            clearTimeout(timeout);
            return res.status(400).json({ success: false, error: 'Too many redirects' });
          }
          currentUrl = resolveRedirectUrl(currentUrl, location);
        }
        clearTimeout(timeout);

        if (!response.ok) {
          return res.status(400).json({ success: false, error: `Failed to fetch URL (${response.status})` });
        }

        // Check content-length before downloading
        const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
        if (contentLength > MAX_FILE_SIZE) {
          return res.status(413).json({ success: false, error: 'Remote file too large' });
        }

        // Extract filename from URL
        const urlPath = new URL(currentUrl).pathname;
        const originalname = path.basename(urlPath) || 'downloaded-file';
        const ts = Date.now();
        const safe = originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filename = `${ts}_url_${safe}`;
        const filepath = path.join(UPLOADS_DIR, filename);

        // Stream to disk with size guard
        const writeStream = fs.createWriteStream(filepath);
        let downloaded = 0;

        const body = response.body;
        if (!body) {
          return res.status(400).json({ success: false, error: 'Remote URL returned no body' });
        }

        const reader = body.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          downloaded += value.length;
          if (downloaded > MAX_FILE_SIZE) {
            writeStream.destroy();
            fs.unlinkSync(filepath);
            return res.status(413).json({ success: false, error: 'Remote file too large' });
          }
          writeStream.write(value);
        }
        writeStream.end();

        // Wait for write to finish
        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });

        // Detect mimetype from extension
        const ext = path.extname(originalname).toLowerCase();
        const mimeMap = {
          '.pdf': 'application/pdf',
          '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
          '.png': 'image/png', '.webp': 'image/webp',
          '.bmp': 'image/bmp', '.gif': 'image/gif',
          '.heic': 'image/heic', '.heif': 'image/heif',
          '.doc': 'application/msword',
          '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          '.xls': 'application/vnd.ms-excel',
          '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          '.ppt': 'application/vnd.ms-powerpoint',
          '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          '.html': 'text/html', '.htm': 'text/html',
          '.svg': 'image/svg+xml',
        };

        req.files.push({
          fieldname: 'files',
          originalname,
          filename,
          path: filepath,
          size: downloaded,
          mimetype: mimeMap[ext] || 'application/octet-stream',
        });
      } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
          return res.status(408).json({ success: false, error: 'URL fetch timed out' });
        }
        return res.status(err.statusCode || 400).json({ success: false, error: err.message || 'Failed to fetch URL' });
      }
    }

    next();
  } catch (err) {
    next(err);
  }
}
