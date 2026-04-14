import { Router } from 'express';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, readFileBuffer } from '../../utils/fileHelpers.js';
import { parseNumber } from '../../utils/validators.js';

const router = Router();

router.post('/', upload.array('files', 50), fileSizeError, fetchUrlFiles, async (req, res) => {
  try {
    if (!requireFiles(req, res, 1)) return;

    const landscape = req.query.orientation === 'landscape' || req.body?.orientation === 'landscape';
    const margin = parseNumber(req.query.margin || req.body?.margin, 0, 200, 0);

    const doc = await PDFDocument.create();

    for (const file of req.files) {
      const imgBytes = readFileBuffer(file.path);
      const meta = await sharp(imgBytes).metadata();
      const jpgBuffer = await sharp(imgBytes).jpeg({ quality: 92 }).toBuffer();

      const img = await doc.embedJpg(jpgBuffer);
      const imgW = meta.width || 595;
      const imgH = meta.height || 842;

      const pageW = landscape ? Math.max(imgW, imgH) : 595;
      const pageH = landscape ? Math.min(imgW, imgH) : 842;

      const page = doc.addPage([pageW + margin * 2, pageH + margin * 2]);

      // Scale image to fit within page
      const scale = Math.min(
        (pageW) / imgW,
        (pageH) / imgH,
      );
      const drawW = imgW * scale;
      const drawH = imgH * scale;

      page.drawImage(img, {
        x: margin + (pageW - drawW) / 2,
        y: margin + (pageH - drawH) / 2,
        width: drawW,
        height: drawH,
      });
    }

    const result = await doc.save();
    cleanupUploads(req);
    await sendResult(req, res, Buffer.from(result), 'images.pdf', 'application/pdf');
  } catch (err) {
    cleanupUploads(req);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
