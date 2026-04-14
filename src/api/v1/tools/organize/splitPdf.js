import { Router } from 'express';
import { PDFDocument } from 'pdf-lib';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult, sendZipResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, readFileBuffer } from '../../utils/fileHelpers.js';
import { parsePages } from '../../utils/validators.js';

const router = Router();

router.post('/', upload.array('files', 1), fileSizeError, fetchUrlFiles, async (req, res) => {
  try {
    if (!requireFiles(req, res, 1)) return;

    const bytes = readFileBuffer(req.files[0].path);
    const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const totalPages = src.getPageCount();

    const pagesStr = req.query.pages || req.body?.pages;
    const indices = pagesStr ? parsePages(pagesStr, totalPages) : null;

    if (pagesStr && !indices) {
      cleanupUploads(req);
      return res.status(400).json({ success: false, error: `Invalid pages: ${pagesStr}. Total pages: ${totalPages}` });
    }

    if (indices) {
      // Extract specific pages into one PDF
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, indices);
      copied.forEach((p) => out.addPage(p));
      const result = await out.save();
      cleanupUploads(req);
      await sendResult(req, res, Buffer.from(result), 'split.pdf', 'application/pdf');
    } else {
      // Split into individual pages
      const files = [];
      for (let i = 0; i < totalPages; i++) {
        const out = await PDFDocument.create();
        const [page] = await out.copyPages(src, [i]);
        out.addPage(page);
        const data = await out.save();
        files.push({ data: Buffer.from(data), name: `page-${i + 1}.pdf` });
      }
      cleanupUploads(req);
      await sendZipResult(req, res, files, 'split-pages.zip');
    }
  } catch (err) {
    cleanupUploads(req);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
