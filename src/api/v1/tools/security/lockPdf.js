import { Router } from 'express';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, tempPath, cleanup } from '../../utils/fileHelpers.js';
import { runGhostscript } from '../../utils/binaryRunner.js';
import fs from 'fs';

const router = Router();

router.post('/', upload.array('files', 1), fileSizeError, fetchUrlFiles, async (req, res) => {
  const outPath = tempPath('.pdf');
  const psInitPath = tempPath('.ps');
  try {
    if (!requireFiles(req, res, 1)) return;

    const password = req.query.password || req.body?.password;
    if (!password) {
      cleanupUploads(req);
      return res.status(400).json({ success: false, error: 'Missing required parameter: password' });
    }

    if (typeof password !== 'string' || password.length > 128) {
      cleanupUploads(req);
      return res.status(400).json({ success: false, error: 'Password must be a string up to 128 characters' });
    }

    // Write password to a temp PostScript init file so it never appears in CLI args (process table)
    const escapedPw = password.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    fs.writeFileSync(psInitPath, `<</OwnerPassword (${escapedPw}) /UserPassword (${escapedPw}) /EncryptionR 3 /KeyLength 128>> setdistillerparams\n`);

    await runGhostscript([
      '-sDEVICE=pdfwrite',
      '-dNOPAUSE', '-dQUIET', '-dBATCH',
      `-sOutputFile=${outPath}`,
      psInitPath,
      req.files[0].path,
    ]);

    cleanupUploads(req);
    cleanup(psInitPath);
    await sendResult(req, res, outPath, 'locked.pdf', 'application/pdf');
    cleanup(outPath);
  } catch (err) {
    cleanupUploads(req);
    cleanup(outPath, psInitPath);
    res.status(502).json({ success: false, error: err.message });
  }
});

export default router;
