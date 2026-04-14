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

    await runTesseract(req.files[0].path, outBase, lang, 'txt');

    const outPath = outBase + '.txt';
    if (!fs.existsSync(outPath)) {
      cleanupUploads(req);
      return res.status(502).json({ success: false, error: 'OCR produced no output' });
    }

    const text = fs.readFileSync(outPath, 'utf-8');
    // Convert to basic markdown
    const markdown = `# OCR Result\n\n${text.trim()}\n`;

    cleanupUploads(req);
    await sendResult(req, res, Buffer.from(markdown, 'utf-8'), 'ocr-result.md', 'text/markdown');
    cleanup(outPath);
  } catch (err) {
    cleanupUploads(req);
    cleanup(outBase + '.txt');
    res.status(502).json({ success: false, error: err.message });
  }
});

export default router;
