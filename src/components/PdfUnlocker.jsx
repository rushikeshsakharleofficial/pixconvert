import { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { decryptPDF } from '@pdfsmaller/pdf-decrypt';
import DropZone from './DropZone';

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
};

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
      <DropZone onFiles={handleFiles} multiple={false} maxFiles={1} accept="application/pdf" label="Drop an encrypted PDF file here" />
      
      {file && !unlockedUrl && (
        <div className="glass fade-in visible" style={{ marginTop: '1rem', padding: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--heading)', fontSize: '1.2rem', color: 'var(--text)', marginBottom: '1rem' }}>
            🔒 Unlock {file.name} ({formatSize(file.size)})
          </h3>
          
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>PDF Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Enter password..."
              disabled={isProcessing}
            />
          </div>
          
          {error && <p style={{ color: '#f87171', marginBottom: '1rem', fontWeight: 600 }}>{error}</p>}
          
          <button className="btn btn-primary" onClick={handleUnlock} disabled={isProcessing || !password}>
            {isProcessing ? 'Unlocking...' : '🔓 Unlock PDF'}
          </button>
        </div>
      )}

      {unlockedUrl && (
        <div className="glass fade-in visible" style={{ marginTop: '1rem', textAlign: 'center' }}>
          <div className="icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h3 style={{ fontFamily: 'var(--heading)', fontSize: '1.3rem', color: 'var(--text)', marginBottom: '0.5rem' }}>
            Successfully Unlocked!
          </h3>
          <p style={{ color: 'var(--text2)', marginBottom: '1.5rem' }}>
            New file size: <strong style={{color: 'var(--teal)'}}>{formatSize(unlockedSize)}</strong>
          </p>
          <button className="btn btn-primary" onClick={downloadFile}>
            ⬇ Download Unlocked PDF
          </button>
          <button className="btn btn-outline" style={{ marginLeft: '1rem' }} onClick={() => setFile(null)}>
            Unlock Another
          </button>
        </div>
      )}
    </div>
  );
};

export default PdfUnlocker;
