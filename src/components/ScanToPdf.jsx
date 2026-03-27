import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import DropZone from './DropZone';

const ScanToPdf = () => {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const handleFiles = (nextFiles) => {
    setFiles((prev) => [...prev, ...nextFiles].slice(0, 60));
    setError(null);
    setIsReady(false);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const move = (index, direction) => {
    const next = index + direction;
    if (next < 0 || next >= files.length) return;
    setFiles((prev) => {
      const copy = [...prev];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  };

  const convert = async () => {
    if (!files.length) return;
    setIsProcessing(true);
    setError(null);
    try {
      const pdf = await PDFDocument.create();
      for (const file of files) {
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
          <p className="tool-info-desc" style={{ marginBottom: '0.7rem' }}>{files.length} page image(s) selected</p>
          <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '0.9rem' }}>
            {files.map((file, i) => (
              <div key={`${file.name}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.5rem 0.7rem', background: 'var(--bg2)' }}>
                <span style={{ fontSize: '0.92rem' }}>{i + 1}. {file.name}</span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                  <button className="btn btn-outline btn-sm" onClick={() => move(i, 1)} disabled={i === files.length - 1}>↓</button>
                  <button className="btn btn-outline btn-sm" onClick={() => removeFile(i)}>Remove</button>
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
