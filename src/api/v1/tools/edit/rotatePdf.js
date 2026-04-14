import { Router } from 'express';
import { PDFDocument, degrees } from 'pdf-lib';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, readFileBuffer } from '../../utils/fileHelpers.js';
import { parseAngle, parsePages } from '../../utils/validators.js';

const router = Router();

router.post('/', upload.array('files', 1), fileSizeError, fetchUrlFiles, async (req, res) => {
  try {
    if (!requireFiles(req, res, 1)) return;

    const angle = parseAngle(req.query.angle || req.body?.angle);
    if (!angle) {
      cleanupUploads(req);
      return res.status(400).json({ success: false, error: 'Invalid angle. Must be 90, 180, or 270.' });
    }

    const bytes = readFileBuffer(req.files[0].path);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const totalPages = doc.getPageCount();

    const pagesStr = req.query.pages || req.body?.pages;
    const indices = pagesStr ? parsePages(pagesStr, totalPages) : doc.getPageIndices();

    if (pagesStr && !indices) {
      cleanupUploads(req);
      return res.status(400).json({ success: false, error: `Invalid pages: ${pagesStr}` });
    }

    for (const i of indices) {
      const page = doc.getPage(i);
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + angle) % 360));
    }

    const result = await doc.save();
    cleanupUploads(req);
    await sendResult(req, res, Buffer.from(result), 'rotated.pdf', 'application/pdf');
  } catch (err) {
    cleanupUploads(req);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
