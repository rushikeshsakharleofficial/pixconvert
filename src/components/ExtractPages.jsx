import { useEffect, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import DropZone from './DropZone';
import ToolProgressBar from './ToolProgressBar';
import formatSize from '../utils/formatSize';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const ExtractPages = () => {
  const [file, setFile] = useState(null);
  const [sourceBytes, setSourceBytes] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [extractFlags, setExtractFlags] = useState([]);
  const [pagePreviews, setPagePreviews] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [resultSize, setResultSize] = useState(0);

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  const handleFiles = async (files) => {
    if (!files.length) return;
    try {
      const selected = files[0];
      const bytes = new Uint8Array(await selected.arrayBuffer());
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const count = pdf.getPageCount();
      setFile(selected);
      setSourceBytes(bytes);
      setPageCount(count);
      setExtractFlags(Array.from({ length: count }, () => false));
      setPagePreviews(Array.from({ length: count }, () => null));
      setError(null);
      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
        setResultUrl(null);
      }

      setPreviewLoading(true);
      setPreviewProgress(0);
      const previewPdf = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
      const previews = [];
      const n = previewPdf.numPages;
      for (let i = 1; i <= n; i += 1) {
        const page = await previewPdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.4 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        previews.push(canvas.toDataURL('image/jpeg', 0.72));
        setPreviewProgress(Math.round((i / n) * 100));
      }
      setPagePreviews(previews);
    } catch (err) {
      console.error(err);
      setError('Could not read this PDF. Try another file.');
    } finally {
      setPreviewLoading(false);
      setPreviewProgress(0);
    }
  };

  const toggleExtract = (index) => {
    setExtractFlags((prev) => prev.map((v, i) => (i === index ? !v : v)));
  };

  const selectAll = () => setExtractFlags(Array.from({ length: pageCount }, () => true));
  const clearSelection = () => setExtractFlags(Array.from({ length: pageCount }, () => false));

  const extract = async () => {
    if (!sourceBytes) return;
    setIsProcessing(true);
    setError(null);
    try {
      const indices = extractFlags.map((include, i) => (include ? i : -1)).filter((i) => i >= 0);
      if (!indices.length) throw new Error('Select at least one page to extract.');
      const src = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, indices);
      pages.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
    } catch (err) {
      setError(err.message || 'Failed to extract pages.');
    } finally {
      setIsProcessing(false);
    }
  };

  const download = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `${file.name.replace(/\.[^.]+$/, '')}-extracted.pdf`;
    a.click();
  };

  return (
    <div>
      <div className="tool-info-bar">
        <p className="tool-info-desc">Extract specific pages to a new PDF using visual page previews.</p>
        <div className="tool-feats">
          <span className="tool-feat hi">🖼 Preview each page</span>
          <span className="tool-feat ok">📄 Extract selected pages</span>
          <span className="tool-feat ok">✓ 100% private</span>
          <span className="tool-feat ok">✓ No upload</span>
        </div>
      </div>

      <DropZone onFiles={handleFiles} multiple={false} maxFiles={1} accept="application/pdf,.pdf" label="Drop a PDF here — or click to browse" />

      {file && (
        <div className="tool-info-bar fade-in" style={{ marginTop: '1rem' }}>
          <p className="tool-info-desc">{file.name} ({formatSize(file.size)}) - {pageCount} pages</p>
          <ToolProgressBar
            active={previewLoading}
            label="Rendering page previews…"
            value={previewProgress}
          />
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={selectAll} disabled={isProcessing || !pageCount}>Select All</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={clearSelection} disabled={isProcessing || !pageCount}>Clear</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '0.85rem' }}>
            {extractFlags.map((extractPage, i) => (
              <label key={i} style={{ border: `1px solid ${extractPage ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '10px', padding: '0.55rem', display: 'grid', gap: '0.45rem', background: 'var(--bg2)', cursor: 'pointer' }}>
                <div style={{ width: '100%', aspectRatio: '1 / 1.42', overflow: 'hidden', borderRadius: '8px', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {pagePreviews[i] ? (
                    <img src={pagePreviews[i]} alt={`Page ${i + 1} preview`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>Loading preview...</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <input type="checkbox" checked={extractPage} onChange={() => toggleExtract(i)} />
                  <span>Page {i + 1}</span>
                </div>
              </label>
            ))}
          </div>
          <button type="button" className="btn btn-primary" onClick={extract} disabled={isProcessing}>
            {isProcessing ? 'Extracting…' : 'Extract Pages'}
          </button>
          <ToolProgressBar active={isProcessing} label="Building PDF…" />
        </div>
      )}

      {error && <p className="text-danger" style={{ marginTop: '0.9rem', fontWeight: 600 }}>{error}</p>}

      {resultUrl && (
        <div className="tool-result-box fade-in">
          <div className="tool-result-icon">✅</div>
          <div className="tool-result-title">Extracted PDF Ready</div>
          <p className="tool-result-meta">Output size: <strong style={{ color: 'var(--success)' }}>{formatSize(resultSize)}</strong></p>
          <div className="tool-result-actions">
            <button type="button" className="btn btn-primary" onClick={download}>⬇ Download Extracted PDF</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtractPages;
