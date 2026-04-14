import { Router } from 'express';
import { PDFDocument } from 'pdf-lib';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, readFileBuffer, tempPath, cleanup } from '../../utils/fileHelpers.js';
import { runGhostscript } from '../../utils/binaryRunner.js';
import fs from 'fs';

const router = Router();

router.post('/', upload.array('files', 1), fileSizeError, fetchUrlFiles, async (req, res) => {
  const outPath = tempPath('.pdf');
  try {
    if (!requireFiles(req, res, 1)) return;

    const password = req.query.password || req.body?.password;
    if (!password) {
      cleanupUploads(req);
      return res.status(400).json({ success: false, error: 'Missing required parameter: password' });
    }

    // Use Ghostscript to encrypt — pdf-lib doesn't support encryption natively
    await runGhostscript([
      '-sDEVICE=pdfwrite',
      '-dNOPAUSE', '-dQUIET', '-dBATCH',
      `-sOwnerPassword=${password}`,
      `-sUserPassword=${password}`,
      '-dEncryptionR=3',
      '-dKeyLength=128',
      `-sOutputFile=${outPath}`,
      req.files[0].path,
    ]);

    cleanupUploads(req);
    await sendResult(req, res, outPath, 'locked.pdf', 'application/pdf');
    cleanup(outPath);
  } catch (err) {
    cleanupUploads(req);
    cleanup(outPath);
    res.status(502).json({ success: false, error: err.message });
  }
});

export default router;
