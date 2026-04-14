import { Router } from 'express';
import { PDFDocument } from 'pdf-lib';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, readFileBuffer } from '../../utils/fileHelpers.js';
import { parseNumber } from '../../utils/validators.js';

const router = Router();

router.post('/', upload.array('files', 1), fileSizeError, fetchUrlFiles, async (req, res) => {
  try {
    if (!requireFiles(req, res, 1)) return;

    const top = parseNumber(req.query.top || req.body?.top, 0, 1000, 0);
    const right = parseNumber(req.query.right || req.body?.right, 0, 1000, 0);
    const bottom = parseNumber(req.query.bottom || req.body?.bottom, 0, 1000, 0);
    const left = parseNumber(req.query.left || req.body?.left, 0, 1000, 0);

    if (top === 0 && right === 0 && bottom === 0 && left === 0) {
      cleanupUploads(req);
      return res.status(400).json({ success: false, error: 'Provide at least one margin: top, right, bottom, left (in points)' });
    }

    const bytes = readFileBuffer(req.files[0].path);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

    for (const page of doc.getPages()) {
      const { width, height } = page.getSize();
      page.setCropBox(left, bottom, width - left - right, height - top - bottom);
    }

    const result = await doc.save();
    cleanupUploads(req);
    await sendResult(req, res, Buffer.from(result), 'cropped.pdf', 'application/pdf');
  } catch (err) {
    cleanupUploads(req);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
