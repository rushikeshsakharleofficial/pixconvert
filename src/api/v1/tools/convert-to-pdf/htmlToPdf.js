import { Router } from 'express';
import fs from 'fs';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { requireFiles, cleanupUploads, tempPath, cleanup } from '../../utils/fileHelpers.js';

const router = Router();

router.post('/', upload.array('files', 1), fileSizeError, fetchUrlFiles, async (req, res) => {
  let browser = null;
  const outPath = tempPath('.pdf');
  try {
    // Either a file upload or a URL in body
    const htmlUrl = req.body?.htmlUrl || req.body?.url;
    let contentUrl;

    if (req.files?.length > 0) {
      contentUrl = `file://${req.files[0].path}`;
    } else if (htmlUrl) {
      contentUrl = htmlUrl;
    } else {
      return res.status(400).json({ success: false, error: 'Provide an HTML file or htmlUrl parameter' });
    }

    const puppeteer = await import('puppeteer');
    browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto(contentUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    const format = req.query.format || req.body?.format || 'A4';
    const landscape = req.query.landscape === 'true' || req.body?.landscape === true;

    await page.pdf({
      path: outPath,
      format,
      landscape,
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    });

    await browser.close();
    browser = null;

    cleanupUploads(req);
    await sendResult(req, res, outPath, 'converted.pdf', 'application/pdf');
    cleanup(outPath);
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    cleanupUploads(req);
    cleanup(outPath);
    res.status(502).json({ success: false, error: err.message });
  }
});

export default router;
