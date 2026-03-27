import { useEffect, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import DropZone from './DropZone';
import formatSize from '../utils/formatSize';

const parseRanges = (input, pageCount) => {
  const cleaned = input.replace(/\s+/g, '');
  if (!cleaned) return [];
  const set = new Set();
  const parts = cleaned.split(',');
  for (const part of parts) {
    if (!part) continue;
    if (part.includes('-')) {
      const [startRaw, endRaw] = part.split('-');
      const start = Number(startRaw);
      const end = Number(endRaw);
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < 1 || start > end) {
        throw new Error('Invalid range format.');
      }
      for (let i = start; i <= end; i += 1) {
        if (i > pageCount) throw new Error('Page number out of bounds.');
        set.add(i - 1);
      }
    } else {
      const page = Number(part);
      if (!Number.isInteger(page) || page < 1 || page > pageCount) {
        throw new Error('Page number out of bounds.');
      }
      set.add(page - 1);
    }
  }
  return [...set].sort((a, b) => a - b);
};

const ExtractPages = () => {
  const [file, setFile] = useState(null);
  const [sourceBytes, setSourceBytes] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [rangeInput, setRangeInput] = useState('');
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
      setFile(selected);
      setSourceBytes(bytes);
      setPageCount(pdf.getPageCount());
      setRangeInput('');
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

  const extract = async () => {
    if (!sourceBytes) return;
    setIsProcessing(true);
    setError(null);
    try {
      const indices = parseRanges(rangeInput, pageCount);
      if (!indices.length) throw new Error('Please enter at least one page or range.');
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
        <p className="tool-info-desc">Extract specific pages to a new PDF. Use pages like 1,3,5-8.</p>
        <div className="tool-feats">
          <span className="tool-feat hi">📄 Select page ranges</span>
          <span className="tool-feat ok">✓ 100% private</span>
          <span className="tool-feat ok">✓ No upload</span>
        </div>
      </div>

      <DropZone onFiles={handleFiles} multiple={false} maxFiles={1} accept="application/pdf,.pdf" label="Drop a PDF here — or click to browse" />

      {file && (
        <div className="tool-info-bar fade-in" style={{ marginTop: '1rem' }}>
          <p className="tool-info-desc">{file.name} ({formatSize(file.size)}) - {pageCount} pages</p>
          <div className="form-group" style={{ marginBottom: '0.8rem' }}>
            <label>Pages to extract</label>
            <input
              type="text"
              value={rangeInput}
              onChange={(e) => setRangeInput(e.target.value)}
              placeholder="Example: 1,3,5-8"
              disabled={isProcessing}
            />
          </div>
          <button className="btn btn-primary" onClick={extract} disabled={isProcessing}>
            {isProcessing ? 'Extracting…' : 'Extract Pages'}
          </button>
        </div>
      )}

      {error && <p className="text-danger" style={{ marginTop: '0.9rem', fontWeight: 600 }}>{error}</p>}

      {resultUrl && (
        <div className="tool-result-box fade-in">
          <div className="tool-result-icon">✅</div>
          <div className="tool-result-title">Extracted PDF Ready</div>
          <p className="tool-result-meta">Output size: <strong style={{ color: 'var(--success)' }}>{formatSize(resultSize)}</strong></p>
          <div className="tool-result-actions">
            <button className="btn btn-primary" onClick={download}>⬇ Download Extracted PDF</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtractPages;
