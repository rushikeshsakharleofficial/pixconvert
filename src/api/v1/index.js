import { Router } from 'express';
import { apiRateLimiter } from './middleware/rateLimiter.js';

// Organize PDF
import mergePdf from './tools/organize/mergePdf.js';
import splitPdf from './tools/organize/splitPdf.js';
import removePages from './tools/organize/removePages.js';
import extractPages from './tools/organize/extractPages.js';
import organizePdf from './tools/organize/organizePdf.js';
import scanToPdf from './tools/organize/scanToPdf.js';

// Optimize PDF
import compressPdf from './tools/optimize/compressPdf.js';
import repairPdf from './tools/optimize/repairPdf.js';
import ocrPdf from './tools/optimize/ocrPdf.js';

// Convert to PDF
import jpgToPdf from './tools/convert-to-pdf/jpgToPdf.js';
import { wordToPdf, powerpointToPdf, excelToPdf } from './tools/convert-to-pdf/officeToPdf.js';
import htmlToPdf from './tools/convert-to-pdf/htmlToPdf.js';

// Convert from PDF
import pdfToJpg from './tools/convert-from-pdf/pdfToJpg.js';
import { pdfToWord, pdfToPowerpoint, pdfToExcel } from './tools/convert-from-pdf/pdfToOffice.js';
import pdfToPdfa from './tools/convert-from-pdf/pdfToPdfa.js';

// Edit PDF
import rotatePdf from './tools/edit/rotatePdf.js';
import addPageNumbers from './tools/edit/addPageNumbers.js';
import addWatermark from './tools/edit/addWatermark.js';
import cropPdf from './tools/edit/cropPdf.js';
import editPdf from './tools/edit/editPdf.js';

// Security
import unlockPdf from './tools/security/unlockPdf.js';
import lockPdf from './tools/security/lockPdf.js';
import signPdf from './tools/security/signPdf.js';
import redactPdf from './tools/security/redactPdf.js';
import comparePdf from './tools/security/comparePdf.js';

// Image
import { jpgToPng, pngToJpg, webpToJpg, heicToJpg, bmpToPng } from './tools/image/imageConvert.js';
import photoToMarkdown from './tools/image/photoToMarkdown.js';

// Media
import universalConvert from './tools/media/universalConvert.js';
import gifMaker from './tools/media/gifMaker.js';

const router = Router();

// Apply rate limiter to all v1 routes
router.use(apiRateLimiter);

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, version: '1.0.0', uptime: process.uptime() });
});

// List all available endpoints
router.get('/tools', (req, res) => {
  res.json({
    success: true,
    tools: TOOL_LIST,
  });
});

// --- Organize PDF ---
router.use('/merge-pdf', mergePdf);
router.use('/split-pdf', splitPdf);
router.use('/remove-pages', removePages);
router.use('/extract-pages', extractPages);
router.use('/organize-pdf', organizePdf);
router.use('/scan-to-pdf', scanToPdf);

// --- Optimize PDF ---
router.use('/compress-pdf', compressPdf);
router.use('/repair-pdf', repairPdf);
router.use('/ocr-pdf', ocrPdf);

// --- Convert to PDF ---
router.use('/jpg-to-pdf', jpgToPdf);
router.use('/word-to-pdf', wordToPdf);
router.use('/powerpoint-to-pdf', powerpointToPdf);
router.use('/excel-to-pdf', excelToPdf);
router.use('/html-to-pdf', htmlToPdf);

// --- Convert from PDF ---
router.use('/pdf-to-jpg', pdfToJpg);
router.use('/pdf-to-word', pdfToWord);
router.use('/pdf-to-powerpoint', pdfToPowerpoint);
router.use('/pdf-to-excel', pdfToExcel);
router.use('/pdf-to-pdfa', pdfToPdfa);

// --- Edit PDF ---
router.use('/rotate-pdf', rotatePdf);
router.use('/add-page-numbers', addPageNumbers);
router.use('/add-watermark', addWatermark);
router.use('/crop-pdf', cropPdf);
router.use('/edit-pdf', editPdf);

// --- Security ---
router.use('/unlock-pdf', unlockPdf);
router.use('/lock-pdf', lockPdf);
router.use('/sign-pdf', signPdf);
router.use('/redact-pdf', redactPdf);
router.use('/compare-pdf', comparePdf);

// --- Image ---
router.use('/jpg-to-png', jpgToPng);
router.use('/png-to-jpg', pngToJpg);
router.use('/webp-to-jpg', webpToJpg);
router.use('/heic-to-jpg', heicToJpg);
router.use('/bmp-to-png', bmpToPng);
router.use('/photo-to-markdown', photoToMarkdown);

// --- Media ---
router.use('/convert', universalConvert);
router.use('/gif', gifMaker);

// Tool catalog for /tools endpoint
const TOOL_LIST = [
  { category: 'Organize PDF', tools: [
    { endpoint: '/merge-pdf', method: 'POST', description: 'Merge multiple PDFs into one', input: 'Multiple PDF files' },
    { endpoint: '/split-pdf', method: 'POST', description: 'Split PDF into pages', input: 'Single PDF', options: 'pages' },
    { endpoint: '/remove-pages', method: 'POST', description: 'Remove pages from PDF', input: 'Single PDF', options: 'pages (required)' },
    { endpoint: '/extract-pages', method: 'POST', description: 'Extract specific pages', input: 'Single PDF', options: 'pages (required)' },
    { endpoint: '/organize-pdf', method: 'POST', description: 'Reorder PDF pages', input: 'Single PDF', options: 'order (JSON array)' },
    { endpoint: '/scan-to-pdf', method: 'POST', description: 'Convert images to PDF', input: 'Image file(s)' },
  ]},
  { category: 'Optimize PDF', tools: [
    { endpoint: '/compress-pdf', method: 'POST', description: 'Compress PDF file size', input: 'Single PDF', options: 'quality (low/medium/high)' },
    { endpoint: '/repair-pdf', method: 'POST', description: 'Repair damaged PDF', input: 'Single PDF' },
    { endpoint: '/ocr-pdf', method: 'POST', description: 'OCR text recognition', input: 'Single PDF/Image', options: 'lang, format (pdf/txt)' },
  ]},
  { category: 'Convert to PDF', tools: [
    { endpoint: '/jpg-to-pdf', method: 'POST', description: 'Images to PDF', input: 'Image file(s)', options: 'orientation, margin' },
    { endpoint: '/word-to-pdf', method: 'POST', description: 'Word to PDF', input: '.doc/.docx file' },
    { endpoint: '/powerpoint-to-pdf', method: 'POST', description: 'PowerPoint to PDF', input: '.ppt/.pptx file' },
    { endpoint: '/excel-to-pdf', method: 'POST', description: 'Excel to PDF', input: '.xls/.xlsx file' },
    { endpoint: '/html-to-pdf', method: 'POST', description: 'HTML to PDF', input: 'HTML file or htmlUrl param', options: 'format, landscape' },
  ]},
  { category: 'Convert from PDF', tools: [
    { endpoint: '/pdf-to-jpg', method: 'POST', description: 'PDF to JPG images', input: 'Single PDF', options: 'dpi, quality' },
    { endpoint: '/pdf-to-word', method: 'POST', description: 'PDF to Word', input: 'Single PDF' },
    { endpoint: '/pdf-to-powerpoint', method: 'POST', description: 'PDF to PowerPoint', input: 'Single PDF' },
    { endpoint: '/pdf-to-excel', method: 'POST', description: 'PDF to Excel', input: 'Single PDF' },
    { endpoint: '/pdf-to-pdfa', method: 'POST', description: 'PDF to PDF/A archive', input: 'Single PDF' },
  ]},
  { category: 'Edit PDF', tools: [
    { endpoint: '/rotate-pdf', method: 'POST', description: 'Rotate PDF pages', input: 'Single PDF', options: 'angle (90/180/270), pages' },
    { endpoint: '/add-page-numbers', method: 'POST', description: 'Add page numbers', input: 'Single PDF', options: 'position, startFrom, fontSize, format' },
    { endpoint: '/add-watermark', method: 'POST', description: 'Add text/image watermark', input: 'PDF + optional image', options: 'text, opacity, rotation, fontSize' },
    { endpoint: '/crop-pdf', method: 'POST', description: 'Crop PDF margins', input: 'Single PDF', options: 'top, right, bottom, left (points)' },
    { endpoint: '/edit-pdf', method: 'POST', description: 'Apply annotations to PDF', input: 'Single PDF', options: 'annotations (JSON array)' },
  ]},
  { category: 'PDF Security', tools: [
    { endpoint: '/unlock-pdf', method: 'POST', description: 'Remove PDF password', input: 'Single PDF', options: 'password' },
    { endpoint: '/lock-pdf', method: 'POST', description: 'Password-protect PDF', input: 'Single PDF', options: 'password (required)' },
    { endpoint: '/sign-pdf', method: 'POST', description: 'Add signature image', input: 'PDF + signature image', options: 'page, x, y, width, height' },
    { endpoint: '/redact-pdf', method: 'POST', description: 'Black-out PDF regions', input: 'Single PDF', options: 'regions (JSON array)' },
    { endpoint: '/compare-pdf', method: 'POST', description: 'Visual PDF comparison', input: 'Two PDF files' },
  ]},
  { category: 'Image Conversion', tools: [
    { endpoint: '/jpg-to-png', method: 'POST', description: 'JPG to PNG', input: 'Image', options: 'quality' },
    { endpoint: '/png-to-jpg', method: 'POST', description: 'PNG to JPG', input: 'Image', options: 'quality' },
    { endpoint: '/webp-to-jpg', method: 'POST', description: 'WebP to JPG', input: 'Image', options: 'quality' },
    { endpoint: '/heic-to-jpg', method: 'POST', description: 'HEIC to JPG', input: 'Image', options: 'quality' },
    { endpoint: '/bmp-to-png', method: 'POST', description: 'BMP to PNG', input: 'Image' },
    { endpoint: '/photo-to-markdown', method: 'POST', description: 'OCR image to Markdown', input: 'Image', options: 'lang' },
  ]},
  { category: 'Media', tools: [
    { endpoint: '/convert', method: 'POST', description: 'Universal format converter', input: 'Any supported file', options: 'to (required)' },
    { endpoint: '/gif', method: 'POST', description: 'Create animated GIF', input: 'Multiple images', options: 'delay, loop' },
  ]},
];

export default router;
