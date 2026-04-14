import { Router } from 'express';
import sharp from 'sharp';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, readFileBuffer } from '../../utils/fileHelpers.js';
import { parseNumber } from '../../utils/validators.js';

const router = Router();

router.post('/', upload.array('files', 50), fileSizeError, fetchUrlFiles, async (req, res) => {
  try {
    if (!requireFiles(req, res, 2)) return;

    const delay = parseNumber(req.query.delay || req.body?.delay, 10, 10000, 500);
    const loop = req.query.loop !== 'false' && req.body?.loop !== false;

    // Get dimensions from first image
    const firstMeta = await sharp(req.files[0].path).metadata();
    const width = firstMeta.width || 400;
    const height = firstMeta.height || 400;

    // Convert all frames to raw RGBA
    const frames = [];
    for (const file of req.files) {
      const frame = await sharp(file.path)
        .resize(width, height, { fit: 'contain', background: '#ffffff' })
        .raw()
        .ensureAlpha()
        .toBuffer();
      frames.push(frame);
    }

    // Use sharp to create animated GIF
    const result = await sharp(frames[0], { raw: { width, height, channels: 4 } })
      .gif({ delay: Array(frames.length).fill(delay), loop: loop ? 0 : -1 })
      .toBuffer();

    cleanupUploads(req);
    await sendResult(req, res, result, 'animation.gif', 'image/gif');
  } catch (err) {
    cleanupUploads(req);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
