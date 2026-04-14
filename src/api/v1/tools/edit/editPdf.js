import { Router } from 'express';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, readFileBuffer } from '../../utils/fileHelpers.js';

const router = Router();

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
}

router.post('/', upload.array('files', 1), fileSizeError, fetchUrlFiles, async (req, res) => {
  try {
    if (!requireFiles(req, res, 1)) return;

    let annotations = req.body?.annotations;
    if (typeof annotations === 'string') {
      try { annotations = JSON.parse(annotations); } catch {
        cleanupUploads(req);
        return res.status(400).json({ success: false, error: 'Invalid annotations JSON' });
      }
    }

    if (!Array.isArray(annotations) || annotations.length === 0) {
      cleanupUploads(req);
      return res.status(400).json({ success: false, error: 'Provide annotations array in body' });
    }

    const bytes = readFileBuffer(req.files[0].path);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pages = doc.getPages();

    for (const ann of annotations) {
      if (ann.pageIndex >= pages.length) continue;
      const page = pages[ann.pageIndex];
      const { height: pageHeight } = page.getSize();
      const pdfY = pageHeight - ann.y;

      if (ann.type === 'text' && ann.content) {
        page.drawText(ann.content, {
          x: ann.x, y: pdfY - (ann.fontSize || 16),
          size: ann.fontSize || 16, font,
          color: hexToRgb(ann.color || '#000000'),
        });
      }

      if (ann.type === 'highlight') {
        page.drawRectangle({
          x: ann.x, y: pdfY - ann.height,
          width: ann.width, height: ann.height,
          color: hexToRgb(ann.color || '#fde047'), opacity: 0.3,
        });
      }

      if (ann.type === 'underline') {
        page.drawLine({
          start: { x: ann.x, y: pdfY - ann.height },
          end: { x: ann.x + ann.width, y: pdfY - ann.height },
          thickness: 2, color: hexToRgb(ann.color || '#f87171'),
        });
      }

      if (ann.type === 'strikethrough') {
        page.drawLine({
          start: { x: ann.x, y: pdfY - ann.height / 2 },
          end: { x: ann.x + ann.width, y: pdfY - ann.height / 2 },
          thickness: 2, color: hexToRgb(ann.color || '#f87171'),
        });
      }

      if (ann.type === 'sticky' && ann.content) {
        page.drawRectangle({
          x: ann.x, y: pdfY - ann.height,
          width: ann.width, height: ann.height,
          color: hexToRgb(ann.color || '#fde047'), opacity: 0.9,
          borderColor: rgb(0, 0, 0), borderWidth: 0.5,
        });
        page.drawText(ann.content.slice(0, 500), {
          x: ann.x + 5, y: pdfY - 20,
          size: 10, font, color: rgb(0, 0, 0),
        });
      }
    }

    const result = await doc.save();
    cleanupUploads(req);
    await sendResult(req, res, Buffer.from(result), 'edited.pdf', 'application/pdf');
  } catch (err) {
    cleanupUploads(req);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
