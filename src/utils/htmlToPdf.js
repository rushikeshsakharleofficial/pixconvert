import html2canvas from 'html2canvas';
import { PDFDocument } from 'pdf-lib';
import DOMPurify from 'dompurify';

const A4_W = 595.28;
const A4_H = 841.89;

/**
 * Renders HTML to a multi-page PDF (client-side).
 * @param {string} html - Sanitized HTML fragment
 * @param {{ widthPx?: number }} [options]
 * @returns {Promise<Uint8Array>}
 */
export async function htmlToPdfBytes(html, options = {}) {
  const widthPx = options.widthPx ?? 794;
  const wrap = document.createElement('div');
  wrap.style.cssText = [
    `position:fixed`,
    `left:-12000px`,
    `top:0`,
    `width:${widthPx}px`,
    `padding:28px 32px`,
    `box-sizing:border-box`,
    `background:#ffffff`,
    `color:#111827`,
    `font:14px/1.6 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`,
    `word-break:break-word`,
  ].join(';');
  wrap.innerHTML = DOMPurify.sanitize(html, { FORCE_BODY: true });
  document.body.appendChild(wrap);

  try {
    const canvas = await html2canvas(wrap, {
      scale: Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2),
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const pdf = await PDFDocument.create();
    const imgW = canvas.width;
    const imgH = canvas.height;
    const scale = A4_W / imgW;
    const scaledH = imgH * scale;
    const numPages = Math.max(1, Math.ceil(scaledH / A4_H));
    const srcChunkH = imgH / numPages;

    for (let p = 0; p < numPages; p += 1) {
      const sy = p * srcChunkH;
      const sh = Math.min(srcChunkH, imgH - sy);
      const slice = document.createElement('canvas');
      slice.width = imgW;
      slice.height = sh;
      const ctx = slice.getContext('2d');
      ctx.drawImage(canvas, 0, sy, imgW, sh, 0, 0, imgW, sh);

      const blob = await new Promise((resolve, reject) => {
        slice.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))), 'image/png');
      });
      const pngBytes = await blob.arrayBuffer();
      const png = await pdf.embedPng(pngBytes);
      const drawH = sh * scale;
      const page = pdf.addPage([A4_W, A4_H]);
      page.drawImage(png, {
        x: 0,
        y: A4_H - drawH,
        width: A4_W,
        height: drawH,
      });
    }

    return pdf.save();
  } finally {
    document.body.removeChild(wrap);
  }
}
