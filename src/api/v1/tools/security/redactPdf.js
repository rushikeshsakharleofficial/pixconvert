import { Router } from 'express';
import { PDFDocument, rgb } from 'pdf-lib';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, readFileBuffer } from '../../utils/fileHelpers.js';

const router = Router();

router.post('/', upload.array('files', 1), fileSizeError, fetchUrlFiles, async (req, res) => {
  try {
    if (!requireFiles(req, res, 1)) return;

    let regions = req.body?.regions;
    if (typeof regions === 'string') {
      try { regions = JSON.parse(regions); } catch {
        cleanupUploads(req);
        return res.status(400).json({ success: false, error: 'Invalid regions JSON' });
      }
    }

    if (!Array.isArray(regions) || regions.length === 0) {
      cleanupUploads(req);
      return res.status(400).json({ success: false, error: 'Provide regions array: [{page, x, y, w, h}]' });
    }

    const bytes = readFileBuffer(req.files[0].path);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = doc.getPages();

    for (const region of regions) {
      const pageIdx = (region.page || 1) - 1;
      if (pageIdx < 0 || pageIdx >= pages.length) continue;

      const page = pages[pageIdx];
      const { height: pageHeight } = page.getSize();

      page.drawRectangle({
        x: region.x,
        y: pageHeight - region.y - region.h,
        width: region.w,
        height: region.h,
        color: rgb(0, 0, 0),
      });
    }

    const result = await doc.save();
    cleanupUploads(req);
    await sendResult(req, res, Buffer.from(result), 'redacted.pdf', 'application/pdf');
  } catch (err) {
    cleanupUploads(req);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
