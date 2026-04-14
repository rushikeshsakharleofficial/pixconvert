import { Router } from 'express';
import sharp from 'sharp';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult, sendZipResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, tempPath, cleanup } from '../../utils/fileHelpers.js';
import { runGhostscript } from '../../utils/binaryRunner.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

const router = Router();

router.post('/', upload.array('files', 2), fileSizeError, fetchUrlFiles, async (req, res) => {
  const tmpDir1 = fs.mkdtempSync(path.join(os.tmpdir(), 'pixconv-cmp1-'));
  const tmpDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'pixconv-cmp2-'));
  try {
    if (req.files?.length < 2) {
      cleanupUploads(req);
      return res.status(400).json({ success: false, error: 'Provide exactly 2 PDF files to compare' });
    }

    // Render both PDFs to images
    const dpi = 150;
    for (const [i, dir] of [[0, tmpDir1], [1, tmpDir2]]) {
      await runGhostscript([
        '-sDEVICE=png16m', `-r${dpi}`,
        '-dNOPAUSE', '-dQUIET', '-dBATCH',
        `-sOutputFile=${path.join(dir, 'page-%04d.png')}`,
        req.files[i].path,
      ]);
    }

    const pages1 = fs.readdirSync(tmpDir1).filter(f => f.endsWith('.png')).sort();
    const pages2 = fs.readdirSync(tmpDir2).filter(f => f.endsWith('.png')).sort();
    const maxPages = Math.max(pages1.length, pages2.length);

    const { default: pixelmatch } = await import('pixelmatch');
    const { PNG } = await import('pngjs');

    const diffFiles = [];
    let totalDiffPixels = 0;
    let totalPixels = 0;

    for (let i = 0; i < maxPages; i++) {
      const file1 = pages1[i] ? path.join(tmpDir1, pages1[i]) : null;
      const file2 = pages2[i] ? path.join(tmpDir2, pages2[i]) : null;

      if (!file1 || !file2) {
        // Page only in one document
        const src = file1 || file2;
        const buf = fs.readFileSync(src);
        diffFiles.push({ data: buf, name: `diff-page-${i + 1}.png` });
        continue;
      }

      // Normalize to same dimensions
      const meta1 = await sharp(file1).metadata();
      const meta2 = await sharp(file2).metadata();
      const w = Math.max(meta1.width, meta2.width);
      const h = Math.max(meta1.height, meta2.height);

      const buf1 = await sharp(file1).resize(w, h, { fit: 'contain', background: '#ffffff' }).raw().toBuffer();
      const buf2 = await sharp(file2).resize(w, h, { fit: 'contain', background: '#ffffff' }).raw().toBuffer();

      const diff = new PNG({ width: w, height: h });
      const numDiff = pixelmatch(buf1, buf2, diff.data, w, h, { threshold: 0.1 });
      totalDiffPixels += numDiff;
      totalPixels += w * h;

      const diffBuf = PNG.sync.write(diff);
      diffFiles.push({ data: diffBuf, name: `diff-page-${i + 1}.png` });
    }

    cleanupUploads(req);

    if (diffFiles.length === 1) {
      await sendResult(req, res, diffFiles[0].data, diffFiles[0].name, 'image/png');
    } else {
      await sendZipResult(req, res, diffFiles, 'comparison.zip');
    }

    fs.rmSync(tmpDir1, { recursive: true, force: true });
    fs.rmSync(tmpDir2, { recursive: true, force: true });
  } catch (err) {
    cleanupUploads(req);
    fs.rmSync(tmpDir1, { recursive: true, force: true });
    fs.rmSync(tmpDir2, { recursive: true, force: true });
    res.status(502).json({ success: false, error: err.message });
  }
});

export default router;
