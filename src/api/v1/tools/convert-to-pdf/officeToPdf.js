import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, tempPath, cleanup } from '../../utils/fileHelpers.js';
import { runLibreOffice } from '../../utils/binaryRunner.js';
import os from 'os';

const router = Router();

/**
 * Shared handler for Word/Excel/PPT → PDF via LibreOffice.
 */
async function convertToPdf(req, res) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pixconv-'));
  try {
    if (!requireFiles(req, res, 1)) return;

    await runLibreOffice(req.files[0].path, outDir, 'pdf');

    // Find output PDF
    const files = fs.readdirSync(outDir).filter((f) => f.endsWith('.pdf'));
    if (files.length === 0) {
      cleanupUploads(req);
      cleanup(outDir);
      return res.status(502).json({ success: false, error: 'LibreOffice produced no output' });
    }

    const outPath = path.join(outDir, files[0]);
    const originalName = path.parse(req.files[0].originalname).name;

    cleanupUploads(req);
    await sendResult(req, res, outPath, `${originalName}.pdf`, 'application/pdf');
    fs.rmSync(outDir, { recursive: true, force: true });
  } catch (err) {
    cleanupUploads(req);
    fs.rmSync(outDir, { recursive: true, force: true });
    res.status(502).json({ success: false, error: err.message });
  }
}

// Word to PDF
export const wordToPdf = Router();
wordToPdf.post('/', upload.array('files', 1), fileSizeError, fetchUrlFiles, convertToPdf);

// PowerPoint to PDF
export const powerpointToPdf = Router();
powerpointToPdf.post('/', upload.array('files', 1), fileSizeError, fetchUrlFiles, convertToPdf);

// Excel to PDF
export const excelToPdf = Router();
excelToPdf.post('/', upload.array('files', 1), fileSizeError, fetchUrlFiles, convertToPdf);

export default { wordToPdf, powerpointToPdf, excelToPdf };
