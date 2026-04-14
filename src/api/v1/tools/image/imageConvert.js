import { Router } from 'express';
import sharp from 'sharp';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, readFileBuffer } from '../../utils/fileHelpers.js';
import { parseNumber } from '../../utils/validators.js';

/**
 * Create a route for image format conversion.
 */
function createImageHandler(targetFormat, ext, mimeType) {
  const router = Router();

  router.post('/', upload.array('files', 1), fileSizeError, fetchUrlFiles, async (req, res) => {
    try {
      if (!requireFiles(req, res, 1)) return;

      const quality = parseNumber(req.query.quality || req.body?.quality, 1, 100, 90);
      const imgBytes = readFileBuffer(req.files[0].path);
      const originalName = req.files[0].originalname.replace(/\.[^.]+$/, '');

      let pipeline = sharp(imgBytes);

      switch (targetFormat) {
        case 'jpeg':
          pipeline = pipeline.jpeg({ quality });
          break;
        case 'png':
          pipeline = pipeline.png({ quality });
          break;
        case 'webp':
          pipeline = pipeline.webp({ quality });
          break;
        default:
          pipeline = pipeline.toFormat(targetFormat, { quality });
      }

      const result = await pipeline.toBuffer();
      cleanupUploads(req);
      await sendResult(req, res, result, `${originalName}.${ext}`, mimeType);
    } catch (err) {
      cleanupUploads(req);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

export const jpgToPng = createImageHandler('png', 'png', 'image/png');
export const pngToJpg = createImageHandler('jpeg', 'jpg', 'image/jpeg');
export const webpToJpg = createImageHandler('jpeg', 'jpg', 'image/jpeg');
export const heicToJpg = createImageHandler('jpeg', 'jpg', 'image/jpeg');
export const bmpToPng = createImageHandler('png', 'png', 'image/png');
