import { Router } from 'express';
import sharp from 'sharp';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult, sendZipResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, tempPath, cleanup } from '../../utils/fileHelpers.js';
import { runGhostscript } from '../../utils/binaryRunner.js';
import { parseNumber } from '../../utils/validators.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

const router = Router();

router.post('/', upload.array('files', 1), fileSizeError, fetchUrlFiles, async (req, res) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pixconv-pdf2jpg-'));
  try {
    if (!requireFiles(req, res, 1)) return;

    const dpi = parseNumber(req.query.dpi || req.body?.dpi, 72, 600, 150);
    const quality = parseNumber(req.query.quality || req.body?.quality, 1, 100, 90);

    // Use Ghostscript to render pages as PNG first
    const outPattern = path.join(tmpDir, 'page-%04d.png');
    await runGhostscript([
      '-sDEVICE=png16m',
      `-r${dpi}`,
      '-dNOPAUSE', '-dQUIET', '-dBATCH',
      `-sOutputFile=${outPattern}`,
      req.files[0].path,
    ]);

    const pngFiles = fs.readdirSync(tmpDir)
      .filter((f) => f.endsWith('.png'))
      .sort();

    if (pngFiles.length === 0) {
      cleanupUploads(req);
      return res.status(502).json({ success: false, error: 'Failed to render PDF pages' });
    }

    // Convert PNGs to JPGs
    const jpgFiles = [];
    for (const png of pngFiles) {
      const pngPath = path.join(tmpDir, png);
      const jpgBuffer = await sharp(pngPath).jpeg({ quality }).toBuffer();
      const name = png.replace('.png', '.jpg');
      jpgFiles.push({ data: jpgBuffer, name });
    }

    cleanupUploads(req);

    if (jpgFiles.length === 1) {
      await sendResult(req, res, jpgFiles[0].data, jpgFiles[0].name, 'image/jpeg');
    } else {
      await sendZipResult(req, res, jpgFiles, 'pdf-pages.zip');
    }

    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (err) {
    cleanupUploads(req);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    res.status(502).json({ success: false, error: err.message });
  }
});

export default router;
