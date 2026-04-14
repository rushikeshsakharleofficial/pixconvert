import { Router } from 'express';
import fs from 'fs';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, tempPath, cleanup } from '../../utils/fileHelpers.js';
import { runTesseract } from '../../utils/binaryRunner.js';

const router = Router();

router.post('/', upload.array('files', 1), fileSizeError, fetchUrlFiles, async (req, res) => {
  const outBase = tempPath('').replace(/\.[^.]+$/, '');
  try {
    if (!requireFiles(req, res, 1)) return;

    const lang = req.query.lang || req.body?.lang || 'eng';
    const format = req.query.format || req.body?.format || 'pdf';

    await runTesseract(req.files[0].path, outBase, lang, format);

    const outExt = format === 'pdf' ? '.pdf' : '.txt';
    const outPath = outBase + outExt;

    if (!fs.existsSync(outPath)) {
      cleanupUploads(req);
      return res.status(502).json({ success: false, error: 'OCR produced no output' });
    }

    const contentType = format === 'pdf' ? 'application/pdf' : 'text/plain';
    const filename = format === 'pdf' ? 'ocr-result.pdf' : 'ocr-result.txt';

    cleanupUploads(req);
    await sendResult(req, res, outPath, filename, contentType);
    cleanup(outPath);
  } catch (err) {
    cleanupUploads(req);
    cleanup(outBase + '.pdf', outBase + '.txt');
    res.status(502).json({ success: false, error: err.message });
  }
});

export default router;
