import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

/**
 * Loads a PDF file and provides the document proxy + page count.
 * @param {File|null} file - The PDF file to load.
 * @returns {{ pdfDoc, numPages, loading, error }}
 */
export default function usePdfDocument(file) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const docRef = useRef(null);

  useEffect(() => {
    if (!file) {
      setPdfDoc(null);
      setNumPages(0);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const buffer = await file.arrayBuffer();
        const doc = await pdfjsLib.getDocument({
          data: new Uint8Array(buffer),
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.5.207/cmaps/',
          cMapPacked: true,
        }).promise;

        if (cancelled) {
          doc.destroy();
          return;
        }

        if (docRef.current) docRef.current.destroy();
        docRef.current = doc;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load PDF');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    return () => {
      if (docRef.current) docRef.current.destroy();
    };
  }, []);

  return { pdfDoc, numPages, loading, error };
}
