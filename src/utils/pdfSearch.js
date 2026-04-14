import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

/**
 * Searches for a term in a PDF and returns normalized coordinates for matches.
 * 
 * @param {Uint8Array} pdfBytes 
 * @param {string} term 
 * @returns {Promise<Object>} Mapping of page index (1-based) to array of {x, y, w, h} normalized (0..1).
 */
export const findTextInPdf = async (pdfBytes, term) => {
  if (!term || !pdfBytes) return {};

  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;
  const resultsByPage = {};

  const lowerTerm = term.toLowerCase();

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });
    const { width, height } = viewport;

    const pageMatches = [];

    textContent.items.forEach((item) => {
      if (item.str.toLowerCase().includes(lowerTerm)) {
        // item.transform: [scaleX, skewY, skewX, scaleY, translateX, translateY]
        // item.width, item.height are also available (item.height is usually scaleY)
        const [scaleX, , , scaleY, tx, ty] = item.transform;

        // Normalize to 0..1 with top-left as origin
        // PDF coordinates are bottom-left (0,0)
        const x = tx / width;
        const y = (height - ty - scaleY) / height;
        const w = item.width / width;
        const h = scaleY / height;

        pageMatches.push({
          x: Math.max(0, x),
          y: Math.max(0, y),
          w: Math.min(1 - x, w),
          h: Math.min(1 - y, h)
        });
      }
    });

    if (pageMatches.length > 0) {
      resultsByPage[i] = pageMatches;
    }
  }

  return resultsByPage;
};
