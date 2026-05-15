import { Router } from 'express';
import fs from 'fs';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, tempPath, cleanup } from '../../utils/fileHelpers.js';
import { runTesseract } from '../../utils/binaryRunner.js';

const router = Router();

// Common Tesseract language codes — expand as needed
const ALLOWED_LANGS = new Set([
  'eng', 'deu', 'fra', 'spa', 'ita', 'por', 'nld', 'rus', 'pol', 'tur',
  'chi_sim', 'chi_tra', 'jpn', 'kor', 'ara', 'hin', 'ben', 'vie', 'tha',
  'swe', 'nor', 'dan', 'fin', 'ces', 'slk', 'hun', 'ron', 'bul', 'hrv',
  'ukr', 'cat', 'heb', 'ind', 'msa', 'srp', 'lit', 'lav', 'est', 'slv',
  'ell', 'afr', 'isl',
]);

const ALLOWED_FORMATS = new Set(['pdf', 'txt']);

router.post('/', upload.array('files', 1), fileSizeError, fetchUrlFiles, async (req, res) => {
  const outBase = tempPath('').replace(/\.[^.]+$/, '');
  try {
    if (!requireFiles(req, res, 1)) return;

    const rawLang = req.query.lang || req.body?.lang || 'eng';
    const lang = String(rawLang).toLowerCase().trim();
    if (!ALLOWED_LANGS.has(lang)) {
      cleanupUploads(req);
      return res.status(400).json({ success: false, error: `Unsupported language: ${lang}. Supported: ${[...ALLOWED_LANGS].join(', ')}` });
    }

    const rawFormat = req.query.format || req.body?.format || 'pdf';
    const format = String(rawFormat).toLowerCase().trim();
    if (!ALLOWED_FORMATS.has(format)) {
      cleanupUploads(req);
      return res.status(400).json({ success: false, error: 'Format must be "pdf" or "txt"' });
    }

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
