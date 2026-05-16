import { useEffect, useRef, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import DropZone from './DropZone';
import ToolProgressBar from './ToolProgressBar';
import formatSize from '../utils/formatSize';

const reorder = (items, from, to) => {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const copy = [...items];
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
};

const JpgToPdf = () => {
  const [files, setFiles] = useState([]);
  const filesRef = useRef([]);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [marginPt, setMarginPt] = useState(40);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    return () => {
      filesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  const handleFiles = (nextFiles) => {
    setFiles((prev) => {
      const incoming = nextFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      const combined = [...prev, ...incoming];
      const kept = combined.slice(0, 60);
      combined.slice(60).forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return kept;
    });
    setError(null);
  };

  const removeFile = (index) => {
    setFiles((prev) => {
      const t = prev[index];
      if (t) URL.revokeObjectURL(t.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const move = (index, direction) => {
    const next = index + direction;
    setFiles((prev) => reorder(prev, index, next));
  };

  const onDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setDragIndex(index);
  };

  const getDropIndex = (target) => {
    const card = target.closest('[data-jpg-card-index]');
    if (!card) return null;
    const n = Number(card.getAttribute('data-jpg-card-index'));
    return Number.isInteger(n) ? n : null;
  };

  const onGridDragOver = (e) => {
    e.preventDefault();
    if (dragIndex === null) return;
    const i = getDropIndex(e.target);
    if (i !== null) setDragOverIndex(i);
  };

  const onGridDrop = (e) => {
    e.preventDefault();
    if (dragIndex === null) return;
    const i = getDropIndex(e.target);
    if (i === null) return;
    setFiles((prev) => reorder(prev, dragIndex, i));
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const onDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const buildPdf = async () => {
    if (!files.length) return;
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    try {
      const pdf = await PDFDocument.create();
      const m = marginPt;
      const total = files.length;

      const webpToPngBytes = async (buf) => {
        const blob = new Blob([buf], { type: 'image/webp' });
        const bmp = await createImageBitmap(blob);
        const c = document.createElement('canvas');
        c.width = bmp.width;
        c.height = bmp.height;
        c.getContext('2d').drawImage(bmp, 0, 0);
        bmp.close?.();
        const pngBlob = await new Promise((resolve, reject) => {
          c.toBlob((b) => (b ? resolve(b) : reject(new Error('WebP decode failed'))), 'image/png');
        });
        return pngBlob.arrayBuffer();
      };

      for (let idx = 0; idx < total; idx += 1) {
        const item = files[idx];
        const file = item.file;
        const name = file.name.toLowerCase();
        const bytes = await file.arrayBuffer();
        let embedded;
        if (file.type === 'image/jpeg' || file.type === 'image/jpg' || name.endsWith('.jpg') || name.endsWith('.jpeg')) {
          embedded = await pdf.embedJpg(bytes);
        } else if (file.type === 'image/png' || name.endsWith('.png')) {
          embedded = await pdf.embedPng(bytes);
        } else if (file.type === 'image/webp' || name.endsWith('.webp')) {
          embedded = await pdf.embedPng(await webpToPngBytes(bytes));
        } else {
          throw new Error('Use JPG, PNG, or WebP images.');
        }

        const iw = embedded.width;
        const ih = embedded.height;
        const pageW = iw + m * 2;
        const pageH = ih + m * 2;
        const page = pdf.addPage([pageW, pageH]);
        page.drawImage(embedded, { x: m, y: m, width: iw, height: ih });
        setProgress(Math.round(((idx + 1) / total) * 100));
      }

      const out = await pdf.save();
      const blob = new Blob([out], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'images.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create PDF.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div>
      <div className="tool-info-bar">
        <p className="tool-info-desc">
          Turn JPG, PNG, or WebP images into a single PDF. Reorder pages before export.
        </p>
        <div className="tool-feats">
          <span className="tool-feat hi">🖼 Images → PDF</span>
          <span className="tool-feat ok">↕ Reorder pages</span>
          <span className="tool-feat ok">✓ 100% private</span>
        </div>
      </div>

      <DropZone
        onFiles={handleFiles}
        multiple
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        maxFiles={60}
        label="Drop images here — or click to browse"
      />

      {files.length > 0 && (
        <div className="tool-info-bar fade-in" style={{ marginTop: '1rem' }}>
          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label htmlFor="jpg-margin">Margin around each image (points)</label>
            <input
              id="jpg-margin"
              type="number"
              min={0}
              max={120}
              value={marginPt}
              onChange={(e) => setMarginPt(Number(e.target.value) || 0)}
              disabled={isProcessing}
              style={{ minHeight: '44px' }}
            />
          </div>
          <p className="tool-info-desc" style={{ marginBottom: '0.5rem' }}>{files.length} image(s)</p>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '0.9rem' }}
            onDragOver={onGridDragOver}
            onDrop={onGridDrop}
          >
            {files.map((item, i) => (
              <div
                key={item.id}
                data-jpg-card-index={i}
                draggable
                onDragStart={(e) => onDragStart(e, i)}
                onDragEnd={onDragEnd}
                style={{
                  border: `1px solid ${dragOverIndex === i ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: '10px',
                  padding: '0.5rem',
                  background: 'var(--bg2)',
                  opacity: dragIndex === i ? 0.6 : 1,
                  cursor: 'grab',
                }}
              >
                <div style={{ width: '100%', aspectRatio: '1 / 1.2', overflow: 'hidden', borderRadius: '8px', background: 'var(--bg3)', marginBottom: '0.4rem' }}>
                  <img src={item.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ fontSize: '0.82rem', marginBottom: '0.4rem', wordBreak: 'break-word' }}>
                  {i + 1}. {item.file.name} <span style={{ color: 'var(--text3)' }}>({formatSize(item.file.size)})</span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => move(i, 1)} disabled={i === files.length - 1}>↓</button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => removeFile(i)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-primary" onClick={buildPdf} disabled={isProcessing}>
            {isProcessing ? 'Creating PDF…' : 'Download PDF'}
          </button>
          <ToolProgressBar active={isProcessing} label="Creating PDF…" value={progress} />
        </div>
      )}

      {error && <p className="text-danger" style={{ marginTop: '0.9rem', fontWeight: 600 }}>{error}</p>}
    </div>
  );
};

export default JpgToPdf;
