import { Router } from 'express';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { PDFDocument } from 'pdf-lib';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, readFileBuffer } from '../../utils/fileHelpers.js';
import { runLibreOffice, runGhostscript } from '../../utils/binaryRunner.js';

const router = Router();

const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'avif', 'tiff'];
const OFFICE_FORMATS = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'];

router.post('/', upload.array('files', 1), fileSizeError, fetchUrlFiles, async (req, res) => {
  try {
    if (!requireFiles(req, res, 1)) return;

    const targetFormat = (req.query.to || req.body?.to || '').toLowerCase();
    if (!targetFormat) {
      cleanupUploads(req);
      return res.status(400).json({ success: false, error: 'Missing required parameter: to (target format)' });
    }

    const file = req.files[0];
    const srcExt = path.extname(file.originalname).toLowerCase().replace('.', '');
    const originalName = path.parse(file.originalname).name;

    // Image → Image
    if (IMAGE_FORMATS.includes(srcExt) && IMAGE_FORMATS.includes(targetFormat)) {
      const imgBytes = readFileBuffer(file.path);
      const fmt = targetFormat === 'jpg' ? 'jpeg' : targetFormat;
      const result = await sharp(imgBytes).toFormat(fmt, { quality: 90 }).toBuffer();
      cleanupUploads(req);
      const mime = `image/${fmt === 'jpeg' ? 'jpeg' : targetFormat}`;
      await sendResult(req, res, result, `${originalName}.${targetFormat}`, mime);
      return;
    }

    // Image → PDF
    if (IMAGE_FORMATS.includes(srcExt) && targetFormat === 'pdf') {
      const imgBytes = readFileBuffer(file.path);
      const jpgBuffer = await sharp(imgBytes).jpeg({ quality: 92 }).toBuffer();
      const meta = await sharp(imgBytes).metadata();
      const doc = await PDFDocument.create();
      const img = await doc.embedJpg(jpgBuffer);
      const page = doc.addPage([meta.width || 595, meta.height || 842]);
      page.drawImage(img, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
      const result = await doc.save();
      cleanupUploads(req);
      await sendResult(req, res, Buffer.from(result), `${originalName}.pdf`, 'application/pdf');
      return;
    }

    // Office → PDF or PDF → Office via LibreOffice
    if (OFFICE_FORMATS.includes(srcExt) || OFFICE_FORMATS.includes(targetFormat)) {
      const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pixconv-conv-'));
      try {
        await runLibreOffice(file.path, outDir, targetFormat);
        const outFiles = fs.readdirSync(outDir);
        const match = outFiles.find((f) => f.endsWith(`.${targetFormat}`));
        if (!match) {
          cleanupUploads(req);
          return res.status(502).json({ success: false, error: `Conversion to ${targetFormat} produced no output` });
        }
        const outPath = path.join(outDir, match);
        cleanupUploads(req);
        await sendResult(req, res, outPath, `${originalName}.${targetFormat}`, 'application/octet-stream');
        fs.rmSync(outDir, { recursive: true, force: true });
      } catch (err) {
        fs.rmSync(outDir, { recursive: true, force: true });
        throw err;
      }
      return;
    }

    cleanupUploads(req);
    res.status(415).json({ success: false, error: `Unsupported conversion: ${srcExt} → ${targetFormat}` });
  } catch (err) {
    cleanupUploads(req);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
