import { Router } from 'express';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, readFileBuffer } from '../../utils/fileHelpers.js';

const router = Router();

router.post('/', upload.array('files', 50), fileSizeError, fetchUrlFiles, async (req, res) => {
  try {
    if (!requireFiles(req, res, 1)) return;

    const doc = await PDFDocument.create();

    for (const file of req.files) {
      const imgBytes = readFileBuffer(file.path);
      // Convert to JPEG for embedding
      const jpgBuffer = await sharp(imgBytes).jpeg({ quality: 90 }).toBuffer();
      const metadata = await sharp(imgBytes).metadata();

      const img = await doc.embedJpg(jpgBuffer);
      const page = doc.addPage([metadata.width || 595, metadata.height || 842]);
      page.drawImage(img, {
        x: 0,
        y: 0,
        width: page.getWidth(),
        height: page.getHeight(),
      });
    }

    const result = await doc.save();
    cleanupUploads(req);
    await sendResult(req, res, Buffer.from(result), 'scanned.pdf', 'application/pdf');
  } catch (err) {
    cleanupUploads(req);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
