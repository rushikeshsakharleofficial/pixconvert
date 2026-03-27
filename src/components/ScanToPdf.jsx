import { useEffect, useRef, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import DropZone from './DropZone';

const reorder = (items, from, to) => {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const copy = [...items];
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
};

const ScanToPdf = () => {
  const [files, setFiles] = useState([]);
  const filesRef = useRef([]);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

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
      const dropped = combined.slice(60);
      dropped.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return kept;
    });
    setError(null);
    setIsReady(false);
  };

  const removeFile = (index) => {
    setFiles((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const move = (index, direction) => {
    const next = index + direction;
    setFiles((prev) => reorder(prev, index, next));
  };

  const onDragStart = (event, index) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
    setDragIndex(index);
  };

  const getDropIndexFromTarget = (target) => {
    const card = target.closest('[data-scan-card-index]');
    if (!card) return null;
    const raw = card.getAttribute('data-scan-card-index');
    const parsed = Number(raw);
    return Number.isInteger(parsed) ? parsed : null;
  };

  const onGridDragOver = (event) => {
    event.preventDefault();
    if (dragIndex === null) return;
    const index = getDropIndexFromTarget(event.target);
    if (index !== null) setDragOverIndex(index);
  };

  const onGridDrop = (event) => {
    event.preventDefault();
    if (dragIndex === null) return;
    const index = getDropIndexFromTarget(event.target);
    if (index === null) return;
    setFiles((prev) => reorder(prev, dragIndex, index));
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const onDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const convert = async () => {
    if (!files.length) return;
    setIsProcessing(true);
    setError(null);
    try {
      const pdf = await PDFDocument.create();
      for (const item of files) {
        const file = item.file;
        const name = file.name.toLowerCase();
        const bytes = await file.arrayBuffer();
        let embedded;
        if (file.type === 'image/jpeg' || file.type === 'image/jpg' || name.endsWith('.jpg') || name.endsWith('.jpeg')) {
          embedded = await pdf.embedJpg(bytes);
        } else if (file.type === 'image/png' || name.endsWith('.png')) {
          embedded = await pdf.embedPng(bytes);
        } else {
          throw new Error('Only JPG and PNG are supported in Scan to PDF right now.');
        }
        const page = pdf.addPage([embedded.width, embedded.height]);
        page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
      }

      const out = await pdf.save();
      const blob = new Blob([out], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'scanned.pdf';
      a.click();
      URL.revokeObjectURL(url);
      setIsReady(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create PDF from images.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div className="tool-info-bar">
        <p className="tool-info-desc">Create a PDF from scanned images. Reorder pages before export.</p>
        <div className="tool-feats">
          <span className="tool-feat hi">🖨 Image to PDF</span>
          <span className="tool-feat ok">↕ Reorder pages</span>
          <span className="tool-feat ok">✓ 100% private</span>
          <span className="tool-feat ok">✓ No upload</span>
        </div>
      </div>

      <DropZone onFiles={handleFiles} multiple accept="image/jpeg,image/png,.jpg,.jpeg,.png" maxFiles={60} label="Drop JPG/PNG files here — or click to browse" />

      {files.length > 0 && (
        <div className="tool-info-bar fade-in" style={{ marginTop: '1rem' }}>
          <p className="tool-info-desc" style={{ marginBottom: '0.35rem' }}>{files.length} page image(s) selected</p>
          <p className="tool-info-desc" style={{ marginBottom: '0.8rem', color: 'var(--text3)' }}>
            Drag and drop cards with mouse to reorder pages.
          </p>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '0.9rem' }}
            onDragOver={onGridDragOver}
            onDrop={onGridDrop}
          >
            {files.map((item, i) => (
              <div
                key={item.id}
                data-scan-card-index={i}
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
                <div style={{ width: '100%', aspectRatio: '1 / 1.3', overflow: 'hidden', borderRadius: '8px', background: 'var(--bg3)', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={item.previewUrl} alt={`Page preview ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ fontSize: '0.86rem', marginBottom: '0.45rem', minHeight: '2.4rem', lineHeight: 1.35 }}>
                  <span style={{ color: 'var(--text3)', marginRight: '0.35rem' }}>{i + 1}.</span>
                  <span style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{item.file.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, minWidth: '2.2rem' }}
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                  >
                    ↑
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, minWidth: '2.2rem' }}
                    onClick={() => move(i, 1)}
                    disabled={i === files.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1.1, minWidth: '5.2rem' }}
                    onClick={() => removeFile(i)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={convert} disabled={isProcessing}>
            {isProcessing ? 'Creating PDF…' : 'Create PDF'}
          </button>
        </div>
      )}

      {error && <p className="text-danger" style={{ marginTop: '0.9rem', fontWeight: 600 }}>{error}</p>}

      {isReady && (
        <div className="tool-result-box fade-in">
          <div className="tool-result-icon">✅</div>
          <div className="tool-result-title">PDF Downloaded</div>
          <p className="tool-result-meta">Your scanned images were converted into a PDF.</p>
        </div>
      )}
    </div>
  );
};

export default ScanToPdf;
