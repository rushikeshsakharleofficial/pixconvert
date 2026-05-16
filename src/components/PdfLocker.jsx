import { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';
import DropZone from './DropZone';
import ToolProgressBar from './ToolProgressBar';
import formatSize from '../utils/formatSize';

const PdfLocker = () => {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [lockedUrl, setLockedUrl] = useState(null);
  const [lockedSize, setLockedSize] = useState(0);

  useEffect(() => {
    return () => { if (lockedUrl) URL.revokeObjectURL(lockedUrl); };
  }, [lockedUrl]);

  const handleFiles = (files) => {
    if (files.length > 0) {
      setFile(files[0]);
      setPassword('');
      setError(null);
      setLockedUrl(null);
    }
  };

  const handleLock = async () => {
    if (!file || !password) return;
    setIsProcessing(true);
    setError(null);
    setLockedUrl(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);
      
      // Use the encryptPDF function from @pdfsmaller/pdf-encrypt-lite
      const encryptedBytes = await encryptPDF(pdfBytes, password);
      
      const blob = new Blob([encryptedBytes], { type: 'application/pdf' });
      setLockedUrl(URL.createObjectURL(blob));
      setLockedSize(blob.size);
    } catch (err) {
      console.error(err);
      setError("Failed to lock: " + (err.message || 'An error occurred during encryption.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFile = () => {
    if (!lockedUrl) return;
    const a = document.createElement('a');
    a.href = lockedUrl;
    a.download = `protected_${file.name.replace(/\.[^.]+$/, '')}.pdf`;
    a.click();
  };

  return (
    <div>
      {/* Info bar */}
      <div className="tool-info-bar">
        <p className="tool-info-desc">
          Add strong password protection to any PDF. Your file is encrypted locally — nothing ever leaves your browser.
        </p>
        <div className="tool-feats">
          <span className="tool-feat hi">🔐 AES Encryption</span>
          <span className="tool-feat ok">✓ 100% private</span>
          <span className="tool-feat ok">✓ No upload</span>
          <span className="tool-feat ok">✓ Instant protect</span>
          <span className="tool-feat inf">Compatible with Adobe Acrobat &amp; all PDF readers</span>
        </div>
      </div>

      <DropZone onFiles={handleFiles} multiple={false} maxFiles={1} accept="application/pdf" label="Drop a PDF here to protect — or click to browse" />

      {file && !lockedUrl && (
        <div className="tool-info-bar fade-in" style={{ gap: '1rem' }}>
          <div className="tool-file-info" style={{ margin: 0 }}>
            <span className="file-icon">📄</span>
            <div>
              <div className="tool-file-name">{file.name}</div>
              <div className="tool-file-size">{formatSize(file.size)}</div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label htmlFor="pdf-lock-password">Set Password</label>
            <input
              id="pdf-lock-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && password && handleLock()}
              placeholder="Choose a strong password…"
              disabled={isProcessing}
              aria-required="true"
            />
          </div>

          {error && <p className="text-danger" style={{ fontWeight: 600, fontSize: '0.875rem' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" onClick={handleLock} disabled={isProcessing || !password}>
              {isProcessing ? 'Encrypting…' : '🔐 Protect PDF'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => { setFile(null); setPassword(''); setError(null); }}>
              Remove
            </button>
          </div>
          <ToolProgressBar active={isProcessing} label="Encrypting PDF…" />
        </div>
      )}

      {lockedUrl && (
        <div className="tool-result-box fade-in">
          <div className="tool-result-icon">🔐</div>
          <div className="tool-result-title">PDF Protected Successfully</div>
          <p className="tool-result-meta">Your PDF is now password-encrypted and ready to share safely.</p>
          <div className="tool-result-actions">
            <button type="button" className="btn btn-primary" onClick={downloadFile}>⬇ Download Protected PDF</button>
            <button type="button" className="btn btn-outline" onClick={() => { setFile(null); setPassword(''); setLockedUrl(null); }}>Protect Another</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfLocker;
