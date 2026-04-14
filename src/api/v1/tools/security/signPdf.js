import { Router } from 'express';
import { PDFDocument } from 'pdf-lib';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, readFileBuffer } from '../../utils/fileHelpers.js';
import { parseNumber } from '../../utils/validators.js';

const router = Router();

router.post('/', upload.array('files', 2), fileSizeError, fetchUrlFiles, async (req, res) => {
  try {
    if (req.files?.length < 2) {
      cleanupUploads(req);
      return res.status(400).json({ success: false, error: 'Provide 2 files: PDF first, signature image second' });
    }

    const pdfBytes = readFileBuffer(req.files[0].path);
    const sigBytes = readFileBuffer(req.files[1].path);

    const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    const sigName = req.files[1].originalname.toLowerCase();
    const sigImage = sigName.endsWith('.png')
      ? await doc.embedPng(sigBytes)
      : await doc.embedJpg(sigBytes);

    const pageIdx = parseNumber(req.query.page || req.body?.page, 1, doc.getPageCount(), doc.getPageCount()) - 1;
    const page = doc.getPage(pageIdx);
    const { width, height } = page.getSize();

    const sigWidth = parseNumber(req.query.width || req.body?.width, 10, width, 150);
    const sigHeight = parseNumber(req.query.height || req.body?.height, 10, height, 50);
    const x = parseNumber(req.query.x || req.body?.x, 0, width, width - sigWidth - 50);
    const y = parseNumber(req.query.y || req.body?.y, 0, height, 50);

    page.drawImage(sigImage, { x, y, width: sigWidth, height: sigHeight });

    const result = await doc.save();
    cleanupUploads(req);
    await sendResult(req, res, Buffer.from(result), 'signed.pdf', 'application/pdf');
  } catch (err) {
    cleanupUploads(req);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
