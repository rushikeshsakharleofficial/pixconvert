import { Router } from 'express';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, tempPath, cleanup } from '../../utils/fileHelpers.js';
import { runGhostscript } from '../../utils/binaryRunner.js';
import { parseQuality } from '../../utils/validators.js';

const router = Router();

const QUALITY_MAP = {
  low: '/screen',       // ~72 dpi
  medium: '/ebook',     // ~150 dpi
  high: '/printer',     // ~300 dpi
};

router.post('/', upload.array('files', 1), fileSizeError, fetchUrlFiles, async (req, res) => {
  const outPath = tempPath('.pdf');
  try {
    if (!requireFiles(req, res, 1)) return;

    const quality = parseQuality(req.query.quality || req.body?.quality);
    const setting = QUALITY_MAP[quality];

    await runGhostscript([
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      `-dPDFSETTINGS=${setting}`,
      '-dNOPAUSE', '-dQUIET', '-dBATCH',
      `-sOutputFile=${outPath}`,
      req.files[0].path,
    ]);

    cleanupUploads(req);
    await sendResult(req, res, outPath, 'compressed.pdf', 'application/pdf');
    cleanup(outPath);
  } catch (err) {
    cleanupUploads(req);
    cleanup(outPath);
    res.status(502).json({ success: false, error: err.message });
  }
});

export default router;
