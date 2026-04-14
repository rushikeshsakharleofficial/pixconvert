import { Router } from 'express';
import { PDFDocument } from 'pdf-lib';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, readFileBuffer } from '../../utils/fileHelpers.js';
import { parsePages } from '../../utils/validators.js';

const router = Router();

router.post('/', upload.array('files', 1), fileSizeError, fetchUrlFiles, async (req, res) => {
  try {
    if (!requireFiles(req, res, 1)) return;

    const pagesStr = req.query.pages || req.body?.pages;
    if (!pagesStr) {
      cleanupUploads(req);
      return res.status(400).json({ success: false, error: 'Missing required parameter: pages (e.g. "1-3,5")' });
    }

    const bytes = readFileBuffer(req.files[0].path);
    const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const indices = parsePages(pagesStr, src.getPageCount());

    if (!indices) {
      cleanupUploads(req);
      return res.status(400).json({ success: false, error: `Invalid pages: ${pagesStr}` });
    }

    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, indices);
    copied.forEach((p) => out.addPage(p));

    const result = await out.save();
    cleanupUploads(req);
    await sendResult(req, res, Buffer.from(result), 'extracted.pdf', 'application/pdf');
  } catch (err) {
    cleanupUploads(req);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
