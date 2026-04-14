import { Router } from 'express';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, readFileBuffer } from '../../utils/fileHelpers.js';
import { parseNumber } from '../../utils/validators.js';

const router = Router();

router.post('/', upload.array('files', 2), fileSizeError, fetchUrlFiles, async (req, res) => {
  try {
    if (!requireFiles(req, res, 1)) return;

    const text = req.query.text || req.body?.text;
    const opacity = parseNumber(req.query.opacity || req.body?.opacity, 0.01, 1, 0.3);
    const rotation = parseNumber(req.query.rotation || req.body?.rotation, -360, 360, -45);
    const fontSize = parseNumber(req.query.fontSize || req.body?.fontSize, 8, 200, 48);

    const pdfFile = req.files[0];
    const imageFile = req.files.length > 1 ? req.files[1] : null;

    if (!text && !imageFile) {
      cleanupUploads(req);
      return res.status(400).json({ success: false, error: 'Provide text or image file for watermark' });
    }

    const bytes = readFileBuffer(pdfFile.path);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = doc.getPages();

    if (text) {
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      for (const page of pages) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        page.drawText(text, {
          x: (width - textWidth) / 2,
          y: height / 2,
          size: fontSize,
          font,
          color: rgb(0.5, 0.5, 0.5),
          opacity,
          rotate: degrees(rotation),
        });
      }
    } else if (imageFile) {
      const imgBytes = readFileBuffer(imageFile.path);
      const ext = imageFile.originalname.toLowerCase();
      const img = ext.endsWith('.png')
        ? await doc.embedPng(imgBytes)
        : await doc.embedJpg(imgBytes);

      for (const page of pages) {
        const { width, height } = page.getSize();
        const scale = Math.min(width * 0.5 / img.width, height * 0.5 / img.height);
        page.drawImage(img, {
          x: (width - img.width * scale) / 2,
          y: (height - img.height * scale) / 2,
          width: img.width * scale,
          height: img.height * scale,
          opacity,
        });
      }
    }

    const result = await doc.save();
    cleanupUploads(req);
    await sendResult(req, res, Buffer.from(result), 'watermarked.pdf', 'application/pdf');
  } catch (err) {
    cleanupUploads(req);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
