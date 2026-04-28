import { Router } from 'express';
import { upload, fileSizeError } from '../../middleware/fileGuard.js';
import { fetchUrlFiles } from '../../middleware/urlFetcher.js';
import { sendResult } from '../../middleware/outputHandler.js';
import { cleanupUploads, tempPath, cleanup } from '../../utils/fileHelpers.js';
import { assertPublicHttpUrl } from '../../utils/networkGuard.js';

const router = Router();
const PDF_FORMATS = new Set(['A4', 'Letter', 'Legal', 'Tabloid']);

function safeClientError(res, status, error) {
  return res.status(status).json({ success: false, error });
}

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
      await assertPublicHttpUrl(htmlUrl);
      contentUrl = htmlUrl;
    } else {
      return res.status(400).json({ success: false, error: 'Provide an HTML file or htmlUrl parameter' });
    }

    const { chromium } = await import('playwright');
    browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage();
    await page.route('**/*', async (route) => {
      const requestUrl = route.request().url();
      if (requestUrl.startsWith('file://')) {
        return contentUrl.startsWith('file://') ? route.continue() : route.abort();
      }

      try {
        await assertPublicHttpUrl(requestUrl);
        return route.continue();
      } catch {
        return route.abort();
      }
    });

    await page.goto(contentUrl, { waitUntil: 'networkidle', timeout: 30000 });

    const requestedFormat = req.query.format || req.body?.format || 'A4';
    const format = PDF_FORMATS.has(requestedFormat) ? requestedFormat : 'A4';
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
    console.error('[html-to-pdf] conversion failed:', err.message);
    safeClientError(res, err.statusCode || 502, err.statusCode ? err.message : 'HTML to PDF conversion failed');
  }
});

export default router;
