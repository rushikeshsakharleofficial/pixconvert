import { useEffect, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import DropZone from './DropZone';
import formatSize from '../utils/formatSize';

const OrganizePdf = () => {
  const [file, setFile] = useState(null);
  const [sourceBytes, setSourceBytes] = useState(null);
  const [pages, setPages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [resultSize, setResultSize] = useState(0);

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  const loadPdf = async (selectedFile) => {
    const bytes = await selectedFile.arrayBuffer();
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pageIndices = Array.from({ length: pdf.getPageCount() }, (_, i) => i);
    setFile(selectedFile);
    setSourceBytes(bytes);
    setPages(pageIndices);
    setError(null);
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      setResultUrl(null);
    }
  };

  const handleFiles = async (files) => {
    if (!files.length) return;
    try {
      await loadPdf(files[0]);
    } catch (err) {
      console.error(err);
      setError('Could not read this PDF. Try another file.');
    }
  };

  const movePage = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= pages.length) return;
    setPages((prev) => {
      const copy = [...prev];
      [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
      return copy;
    });
  };

  const removePage = (index) => {
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const resetOrder = async () => {
    if (!file) return;
    await loadPdf(file);
  };

  const downloadOrganizedPdf = async () => {
    if (!sourceBytes || !pages.length) return;
    setIsProcessing(true);
    setError(null);
    try {
      const source = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
      const output = await PDFDocument.create();
      const copiedPages = await output.copyPages(source, pages);
      copiedPages.forEach((page) => output.addPage(page));
      const bytes = await output.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
    } catch (err) {
      console.error(err);
      setError('Failed to organize PDF. Please retry.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFile = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `organized_${file.name.replace(/\.[^.]+$/, '')}.pdf`;
    a.click();
  };

  return (
    <div>
      <div className="tool-info-bar">
        <p className="tool-info-desc">
          Reorder and remove pages from a PDF directly in your browser.
          Your files never leave your device.
        </p>
        <div className="tool-feats">
          <span className="tool-feat hi">📑 Reorder pages</span>
          <span className="tool-feat ok">✂ Remove pages</span>
          <span className="tool-feat ok">✓ 100% private</span>
          <span className="tool-feat ok">✓ No upload</span>
        </div>
      </div>

      <DropZone
        onFiles={handleFiles}
        multiple={false}
        maxFiles={1}
        accept="application/pdf,.pdf"
        label="Drop a PDF here — or click to browse"
      />

      {file && (
        <div className="tool-info-bar fade-in" style={{ marginTop: '1.25rem' }}>
          <div className="tool-file-info" style={{ margin: 0 }}>
            <span className="file-icon">📄</span>
            <div>
              <div className="tool-file-name">{file.name}</div>
              <div className="tool-file-size">
                {formatSize(file.size)} - {pages.length} page{pages.length === 1 ? '' : 's'} selected
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={downloadOrganizedPdf} disabled={isProcessing || pages.length === 0}>
              {isProcessing ? 'Processing…' : 'Generate Organized PDF'}
            </button>
            <button className="btn btn-outline" onClick={resetOrder} disabled={isProcessing}>
              Reset
            </button>
          </div>
        </div>
      )}

      {pages.length > 0 && (
        <div className="tool-info-bar fade-in" style={{ marginTop: '1rem' }}>
          <p className="tool-info-desc" style={{ marginBottom: '0.85rem' }}>
            Arrange pages in final order. Use arrows to move pages and remove to drop them.
          </p>
          <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '420px', overflowY: 'auto' }}>
            {pages.map((pageIndex, i) => (
              <div
                key={`${pageIndex}-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  padding: '0.6rem 0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  background: 'var(--bg2)'
                }}
              >
                <div style={{ fontSize: '0.92rem', color: 'var(--text2)' }}>
                  Position {i + 1}: Original page {pageIndex + 1}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => movePage(i, -1)} disabled={i === 0}>
                    ↑
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => movePage(i, 1)} disabled={i === pages.length - 1}>
                    ↓
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => removePage(i)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-danger" style={{ marginTop: '0.9rem', fontWeight: 600 }}>{error}</p>}

      {resultUrl && (
        <div className="tool-result-box fade-in">
          <div className="tool-result-icon">✅</div>
          <div className="tool-result-title">Organized PDF Ready</div>
          <p className="tool-result-meta">
            Output size: <strong style={{ color: 'var(--success)' }}>{formatSize(resultSize)}</strong>
          </p>
          <div className="tool-result-actions">
            <button className="btn btn-primary" onClick={downloadFile}>⬇ Download Organized PDF</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizePdf;
