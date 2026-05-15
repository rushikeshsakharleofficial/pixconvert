import { Router } from 'express';
import { PDFDocument } from 'pdf-lib';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, readFileBuffer } from '../../utils/fileHelpers.js';

const router = Router();

router.post('/', upload.array('files', 1), fileSizeError, fetchUrlFiles, async (req, res) => {
  try {
    if (!requireFiles(req, res, 1)) return;

    const password = req.query.password || req.body?.password || '';
    const bytes = readFileBuffer(req.files[0].path);

    let doc;
    try {
      doc = await PDFDocument.load(bytes, { password });
    } catch (loadErr) {
      cleanupUploads(req);
      const msg = loadErr.message || '';
      if (msg.includes('password') || msg.includes('encrypted') || msg.includes('decrypt')) {
        return res.status(403).json({ success: false, error: 'Incorrect or missing password' });
      }
      return res.status(422).json({ success: false, error: 'Failed to read PDF' });
    }

    const result = await doc.save();

    cleanupUploads(req);
    await sendResult(req, res, Buffer.from(result), 'unlocked.pdf', 'application/pdf');
  } catch (err) {
    cleanupUploads(req);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
