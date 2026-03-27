import { useEffect, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import DropZone from './DropZone';
import formatSize from '../utils/formatSize';

const RemovePages = () => {
  const [file, setFile] = useState(null);
  const [sourceBytes, setSourceBytes] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [removeFlags, setRemoveFlags] = useState([]);
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
      const bytes = await selected.arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const count = pdf.getPageCount();
      setFile(selected);
      setSourceBytes(bytes);
      setPageCount(count);
      setRemoveFlags(Array.from({ length: count }, () => false));
      setError(null);
      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
        setResultUrl(null);
      }
    } catch (err) {
      console.error(err);
      setError('Could not read this PDF. Try another file.');
    }
  };

  const toggleRemove = (index) => {
    setRemoveFlags((prev) => prev.map((v, i) => (i === index ? !v : v)));
  };

  const applyRemoval = async () => {
    if (!sourceBytes || !pageCount) return;
    const keepIndices = removeFlags.map((isRemoved, i) => (!isRemoved ? i : -1)).filter((i) => i >= 0);
    if (!keepIndices.length) {
      setError('At least one page must remain in the output PDF.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const src = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, keepIndices);
      pages.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
    } catch (err) {
      console.error(err);
      setError('Failed to remove pages.');
    } finally {
      setIsProcessing(false);
    }
  };

  const download = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `${file.name.replace(/\.[^.]+$/, '')}-trimmed.pdf`;
    a.click();
  };

  return (
    <div>
      <div className="tool-info-bar">
        <p className="tool-info-desc">Remove unwanted pages from your PDF while keeping original page quality.</p>
        <div className="tool-feats">
          <span className="tool-feat hi">🗑 Remove selected pages</span>
          <span className="tool-feat ok">✓ 100% private</span>
          <span className="tool-feat ok">✓ No upload</span>
        </div>
      </div>

      <DropZone onFiles={handleFiles} multiple={false} maxFiles={1} accept="application/pdf,.pdf" label="Drop a PDF here — or click to browse" />

      {file && (
        <div className="tool-info-bar fade-in" style={{ marginTop: '1rem' }}>
          <p className="tool-info-desc">{file.name} ({formatSize(file.size)}) - {pageCount} pages</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', margin: '0.75rem 0' }}>
            {removeFlags.map((remove, i) => (
              <label key={i} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.45rem 0.55rem', display: 'flex', alignItems: 'center', gap: '0.45rem', background: 'var(--bg2)' }}>
                <input type="checkbox" checked={remove} onChange={() => toggleRemove(i)} />
                <span>Page {i + 1}</span>
              </label>
            ))}
          </div>
          <button className="btn btn-primary" onClick={applyRemoval} disabled={isProcessing}>
            {isProcessing ? 'Processing…' : 'Remove Selected Pages'}
          </button>
        </div>
      )}

      {error && <p className="text-danger" style={{ marginTop: '0.9rem', fontWeight: 600 }}>{error}</p>}

      {resultUrl && (
        <div className="tool-result-box fade-in">
          <div className="tool-result-icon">✅</div>
          <div className="tool-result-title">Updated PDF Ready</div>
          <p className="tool-result-meta">Output size: <strong style={{ color: 'var(--success)' }}>{formatSize(resultSize)}</strong></p>
          <div className="tool-result-actions">
            <button className="btn btn-primary" onClick={download}>⬇ Download PDF</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemovePages;
