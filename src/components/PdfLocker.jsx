import { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';
import DropZone from './DropZone';
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
      <DropZone onFiles={handleFiles} multiple={false} maxFiles={1} accept="application/pdf" label="Drop an unencrypted PDF file here" />
      
      {file && !lockedUrl && (
        <div className="glass fade-in visible" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--heading)', fontSize: '1.2rem', color: 'var(--text)', marginBottom: '1rem' }}>
            🔒 Protect {file.name} ({formatSize(file.size)})
          </h3>
          
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Set PDF Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Enter a strong password..."
              disabled={isProcessing}
            />
          </div>
          
          {error && <p style={{ color: '#f87171', marginBottom: '1rem', fontWeight: 600 }}>{error}</p>}
          
          <button className="btn btn-primary" onClick={handleLock} disabled={isProcessing || !password}>
            {isProcessing ? 'Locking...' : '🔒 Lock PDF'}
          </button>
        </div>
      )}

      {lockedUrl && (
        <div className="glass fade-in visible" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <div className="icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h3 style={{ fontFamily: 'var(--heading)', fontSize: '1.3rem', color: 'var(--text)', marginBottom: '0.5rem' }}>
            Successfully Locked!
          </h3>
          <p style={{ color: 'var(--text2)', marginBottom: '1.5rem' }}>
            Your PDF is now password protected.
          </p>
          <button className="btn btn-primary" onClick={downloadFile}>
            ⬇ Download Locked PDF
          </button>
          <button className="btn btn-outline" style={{ marginLeft: '1rem' }} onClick={() => setFile(null)}>
            Lock Another
          </button>
        </div>
      )}
    </div>
  );
};

export default PdfLocker;
