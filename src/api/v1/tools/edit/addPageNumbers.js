import { Router } from 'express';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, readFileBuffer } from '../../utils/fileHelpers.js';
import { parsePosition, parseNumber } from '../../utils/validators.js';

const router = Router();

router.post('/', upload.array('files', 1), fileSizeError, fetchUrlFiles, async (req, res) => {
  try {
    if (!requireFiles(req, res, 1)) return;

    const position = parsePosition(req.query.position || req.body?.position, 'bottom-center');
    const startFrom = parseNumber(req.query.startFrom || req.body?.startFrom, 1, 9999, 1);
    const fontSize = parseNumber(req.query.fontSize || req.body?.fontSize, 6, 72, 12);
    const format = req.query.format || req.body?.format || '{n}';

    const bytes = readFileBuffer(req.files[0].path);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pages = doc.getPages();
    const total = pages.length;

    for (let i = 0; i < total; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      const num = startFrom + i;

      const text = format
        .replace('{n}', String(num))
        .replace('{total}', String(total + startFrom - 1));

      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const margin = 30;

      let x, y;
      // Vertical position
      if (position.startsWith('top')) y = height - margin;
      else if (position.startsWith('center')) y = height / 2;
      else y = margin;

      // Horizontal position
      if (position.endsWith('left')) x = margin;
      else if (position.endsWith('right')) x = width - textWidth - margin;
      else x = (width - textWidth) / 2;

      page.drawText(text, { x, y, size: fontSize, font, color: rgb(0, 0, 0) });
    }

    const result = await doc.save();
    cleanupUploads(req);
    await sendResult(req, res, Buffer.from(result), 'numbered.pdf', 'application/pdf');
  } catch (err) {
    cleanupUploads(req);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
