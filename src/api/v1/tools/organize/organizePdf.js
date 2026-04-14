import { Router } from 'express';
import { PDFDocument } from 'pdf-lib';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, readFileBuffer } from '../../utils/fileHelpers.js';

const router = Router();

router.post('/', upload.array('files', 1), fileSizeError, fetchUrlFiles, async (req, res) => {
  try {
    if (!requireFiles(req, res, 1)) return;

    let order = req.query.order || req.body?.order;
    if (!order) {
      cleanupUploads(req);
      return res.status(400).json({ success: false, error: 'Missing required parameter: order (array of page indices, e.g. [2,0,1])' });
    }

    if (typeof order === 'string') {
      try { order = JSON.parse(order); } catch {
        cleanupUploads(req);
        return res.status(400).json({ success: false, error: 'Invalid order format. Expected JSON array of 0-based indices.' });
      }
    }

    if (!Array.isArray(order)) {
      cleanupUploads(req);
      return res.status(400).json({ success: false, error: 'order must be an array' });
    }

    const bytes = readFileBuffer(req.files[0].path);
    const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const total = src.getPageCount();

    for (const idx of order) {
      if (typeof idx !== 'number' || idx < 0 || idx >= total) {
        cleanupUploads(req);
        return res.status(400).json({ success: false, error: `Invalid page index: ${idx}. Total pages: ${total}` });
      }
    }

    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, order);
    copied.forEach((p) => out.addPage(p));

    const result = await out.save();
    cleanupUploads(req);
    await sendResult(req, res, Buffer.from(result), 'organized.pdf', 'application/pdf');
  } catch (err) {
    cleanupUploads(req);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
