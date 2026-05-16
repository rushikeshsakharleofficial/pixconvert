import { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { decryptPDF } from '@pdfsmaller/pdf-decrypt';
import DropZone from './DropZone';
import ToolProgressBar from './ToolProgressBar';
import formatSize from '../utils/formatSize';

const PdfUnlocker = () => {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [unlockedUrl, setUnlockedUrl] = useState(null);
  const [unlockedSize, setUnlockedSize] = useState(0);

  useEffect(() => {
    return () => { if (unlockedUrl) URL.revokeObjectURL(unlockedUrl); };
  }, [unlockedUrl]);

  const handleFiles = (files) => {
    if (files.length > 0) {
      setFile(files[0]);
      setPassword('');
      setError(null);
      setUnlockedUrl(null);
    }
  };

  const handleUnlock = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setUnlockedUrl(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);
      
      // Use the decryptPDF function from @pdfsmaller/pdf-decrypt
      const decryptedBytes = await decryptPDF(pdfBytes, password);
      
      const blob = new Blob([decryptedBytes], { type: 'application/pdf' });
      
      setUnlockedUrl(URL.createObjectURL(blob));
      setUnlockedSize(blob.size);
    } catch (err) {
      console.error(err);
      setError("Failed to unlock: " + (err.message || 'Incorrect password or invalid PDF.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFile = () => {
    if (!unlockedUrl) return;
    const a = document.createElement('a');
    a.href = unlockedUrl;
    a.download = `unlocked_${file.name.replace(/\.[^.]+$/, '')}.pdf`;
    a.click();
  };

  return (
    <div>
      {/* Info bar */}
      <div className="tool-info-bar">
        <p className="tool-info-desc">
          Remove password protection from any PDF. Enter the correct password and download an unlocked copy — entirely in your browser, nothing is uploaded.
        </p>
        <div className="tool-feats">
          <span className="tool-feat hi">🔓 Instant unlock</span>
          <span className="tool-feat ok">✓ 100% private</span>
          <span className="tool-feat ok">✓ No upload</span>
          <span className="tool-feat ok">✓ Works offline</span>
          <span className="tool-feat inf">Supports AES-128 &amp; AES-256 encrypted PDFs</span>
        </div>
      </div>

      <DropZone onFiles={handleFiles} multiple={false} maxFiles={1} accept="application/pdf" label="Drop an encrypted PDF here — or click to browse" />

      {file && !unlockedUrl && (
        <div className="tool-info-bar fade-in" style={{ gap: '1rem' }}>
          <div className="tool-file-info" style={{ margin: 0 }}>
            <span className="file-icon">🔒</span>
            <div>
              <div className="tool-file-name">{file.name}</div>
              <div className="tool-file-size">{formatSize(file.size)}</div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label htmlFor="pdf-unlock-password">PDF Password</label>
            <input
              id="pdf-unlock-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && password && handleUnlock()}
              placeholder="Enter the document password…"
              disabled={isProcessing}
              aria-required="true"
            />
          </div>

          {error && <p className="text-danger" style={{ fontWeight: 600, fontSize: '0.875rem' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" onClick={handleUnlock} disabled={isProcessing || !password}>
              {isProcessing ? 'Unlocking…' : '🔓 Unlock PDF'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => { setFile(null); setPassword(''); setError(null); }}>
              Remove
            </button>
          </div>
          <ToolProgressBar active={isProcessing} label="Decrypting PDF…" />
        </div>
      )}

      {unlockedUrl && (
        <div className="tool-result-box fade-in">
          <div className="tool-result-icon">🔓</div>
          <div className="tool-result-title">PDF Unlocked Successfully</div>
          <p className="tool-result-meta">Unlocked file size: <strong style={{ color: 'var(--success)' }}>{formatSize(unlockedSize)}</strong></p>
          <div className="tool-result-actions">
            <button type="button" className="btn btn-primary" onClick={downloadFile}>⬇ Download Unlocked PDF</button>
            <button type="button" className="btn btn-outline" onClick={() => { setFile(null); setPassword(''); setUnlockedUrl(null); }}>Unlock Another</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfUnlocker;
