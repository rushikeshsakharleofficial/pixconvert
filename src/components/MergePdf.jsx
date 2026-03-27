import { useEffect, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import DropZone from './DropZone';
import formatSize from '../utils/formatSize';

const MergePdf = () => {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [resultSize, setResultSize] = useState(0);

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  const handleFiles = (nextFiles) => {
    setFiles((prev) => [...prev, ...nextFiles].slice(0, 50));
    setError(null);
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      setResultUrl(null);
    }
  };

  const moveFile = (index, direction) => {
    const next = index + direction;
    if (next < 0 || next >= files.length) return;
    setFiles((prev) => {
      const copy = [...prev];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const mergeFiles = async () => {
    if (files.length < 2) return;
    setIsProcessing(true);
    setError(null);
    try {
      const output = await PDFDocument.create();
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pageIndices = src.getPageIndices();
        const pages = await output.copyPages(src, pageIndices);
        pages.forEach((p) => output.addPage(p));
      }
      const outBytes = await output.save();
      const blob = new Blob([outBytes], { type: 'application/pdf' });
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
    } catch (err) {
      console.error(err);
      setError('Failed to merge PDFs. Make sure all files are valid PDFs.');
    } finally {
      setIsProcessing(false);
    }
  };

  const download = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = 'merged.pdf';
    a.click();
  };

  return (
    <div>
      <div className="tool-info-bar">
        <p className="tool-info-desc">Combine multiple PDFs in your preferred order. Processing stays in your browser.</p>
        <div className="tool-feats">
          <span className="tool-feat hi">📁 Merge many PDFs</span>
          <span className="tool-feat ok">↕ Reorder before merge</span>
          <span className="tool-feat ok">✓ 100% private</span>
          <span className="tool-feat ok">✓ No upload</span>
        </div>
      </div>

      <DropZone onFiles={handleFiles} multiple accept="application/pdf,.pdf" maxFiles={50} label="Drop PDF files here — or click to browse" />

      {files.length > 0 && (
        <div className="tool-info-bar fade-in" style={{ marginTop: '1rem' }}>
          <p className="tool-info-desc" style={{ marginBottom: '0.7rem' }}>
            Arrange file order before merge.
          </p>
          <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '0.9rem' }}>
            {files.map((file, i) => (
              <div key={`${file.name}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.55rem 0.7rem', background: 'var(--bg2)' }}>
                <div style={{ fontSize: '0.92rem' }}>
                  {i + 1}. {file.name} <span style={{ color: 'var(--text3)' }}>({formatSize(file.size)})</span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => moveFile(i, -1)} disabled={i === 0}>↑</button>
                  <button className="btn btn-outline btn-sm" onClick={() => moveFile(i, 1)} disabled={i === files.length - 1}>↓</button>
                  <button className="btn btn-outline btn-sm" onClick={() => removeFile(i)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={mergeFiles} disabled={files.length < 2 || isProcessing}>
              {isProcessing ? 'Merging…' : 'Merge PDFs'}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-danger" style={{ marginTop: '0.9rem', fontWeight: 600 }}>{error}</p>}

      {resultUrl && (
        <div className="tool-result-box fade-in">
          <div className="tool-result-icon">✅</div>
          <div className="tool-result-title">Merged PDF Ready</div>
          <p className="tool-result-meta">Output size: <strong style={{ color: 'var(--success)' }}>{formatSize(resultSize)}</strong></p>
          <div className="tool-result-actions">
            <button className="btn btn-primary" onClick={download}>⬇ Download Merged PDF</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MergePdf;
