import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads } from '../../utils/fileHelpers.js';
import { runLibreOffice } from '../../utils/binaryRunner.js';

/**
 * Create a handler for PDF → Office format conversion.
 */
function createPdfToOfficeHandler(targetFormat, ext, mimeType) {
  const router = Router();

  router.post('/', upload.array('files', 1), fileSizeError, fetchUrlFiles, async (req, res) => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), `pixconv-pdf2${ext}-`));
    try {
      if (!requireFiles(req, res, 1)) return;

      await runLibreOffice(req.files[0].path, outDir, targetFormat);

      const outFiles = fs.readdirSync(outDir).filter((f) => f.endsWith(`.${ext}`));
      if (outFiles.length === 0) {
        cleanupUploads(req);
        return res.status(502).json({ success: false, error: `LibreOffice produced no ${ext} output` });
      }

      const outPath = path.join(outDir, outFiles[0]);
      const originalName = path.parse(req.files[0].originalname).name;

      cleanupUploads(req);
      await sendResult(req, res, outPath, `${originalName}.${ext}`, mimeType);
      fs.rmSync(outDir, { recursive: true, force: true });
    } catch (err) {
      cleanupUploads(req);
      fs.rmSync(outDir, { recursive: true, force: true });
      res.status(502).json({ success: false, error: err.message });
    }
  });

  return router;
}

export const pdfToWord = createPdfToOfficeHandler(
  'docx', 'docx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
);

export const pdfToPowerpoint = createPdfToOfficeHandler(
  'pptx', 'pptx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
);

export const pdfToExcel = createPdfToOfficeHandler(
  'xlsx', 'xlsx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
);
