import { Router } from 'express';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, tempPath, cleanup } from '../../utils/fileHelpers.js';
import { runGhostscript } from '../../utils/binaryRunner.js';

const router = Router();

router.post('/', upload.array('files', 1), fileSizeError, fetchUrlFiles, async (req, res) => {
  const outPath = tempPath('.pdf');
  try {
    if (!requireFiles(req, res, 1)) return;

    await runGhostscript([
      '-sDEVICE=pdfwrite',
      '-dNOPAUSE', '-dQUIET', '-dBATCH',
      `-sOutputFile=${outPath}`,
      req.files[0].path,
    ]);

    cleanupUploads(req);
    await sendResult(req, res, outPath, 'repaired.pdf', 'application/pdf');
    cleanup(outPath);
  } catch (err) {
    cleanupUploads(req);
    cleanup(outPath);
    res.status(502).json({ success: false, error: err.message });
  }
});

export default router;
