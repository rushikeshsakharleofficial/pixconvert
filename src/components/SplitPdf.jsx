import { useState } from 'react';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import DropZone from './DropZone';

const SplitPdf = () => {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const handleFiles = async (files) => {
    if (!files.length) return;
    try {
      const selected = files[0];
      const bytes = await selected.arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      setFile(selected);
      setPageCount(pdf.getPageCount());
      setError(null);
      setIsReady(false);
    } catch (err) {
      console.error(err);
      setError('Could not read this PDF. Try another file.');
    }
  };

  const splitAndDownload = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const bytes = await file.arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const zip = new JSZip();
      for (let i = 0; i < src.getPageCount(); i += 1) {
        const onePagePdf = await PDFDocument.create();
        const [page] = await onePagePdf.copyPages(src, [i]);
        onePagePdf.addPage(page);
        const out = await onePagePdf.save();
        zip.file(`page-${i + 1}.pdf`, out);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace(/\.[^.]+$/, '')}-split.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setIsReady(true);
    } catch (err) {
      console.error(err);
      setError('Failed to split PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div className="tool-info-bar">
        <p className="tool-info-desc">Split a PDF into single-page PDFs and download all pages as a ZIP file.</p>
        <div className="tool-feats">
          <span className="tool-feat hi">✂ One page per file</span>
          <span className="tool-feat ok">📦 ZIP download</span>
          <span className="tool-feat ok">✓ 100% private</span>
          <span className="tool-feat ok">✓ No upload</span>
        </div>
      </div>

      <DropZone onFiles={handleFiles} multiple={false} maxFiles={1} accept="application/pdf,.pdf" label="Drop a PDF here — or click to browse" />

      {file && (
        <div className="tool-info-bar fade-in" style={{ marginTop: '1rem' }}>
          <p className="tool-info-desc">{file.name} - {pageCount} pages</p>
          <button className="btn btn-primary" onClick={splitAndDownload} disabled={isProcessing}>
            {isProcessing ? 'Splitting…' : 'Split PDF to ZIP'}
          </button>
        </div>
      )}

      {error && <p className="text-danger" style={{ marginTop: '0.9rem', fontWeight: 600 }}>{error}</p>}

      {isReady && (
        <div className="tool-result-box fade-in">
          <div className="tool-result-icon">✅</div>
          <div className="tool-result-title">Split Completed</div>
          <p className="tool-result-meta">A ZIP containing one PDF per page was downloaded.</p>
        </div>
      )}
    </div>
  );
};

export default SplitPdf;
