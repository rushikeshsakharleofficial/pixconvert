import { useState, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import DropZone from './DropZone';
import ToolProgressBar from './ToolProgressBar';
import formatSize from '../utils/formatSize';

const AddWatermark = () => {
  const [file, setFile] = useState(null);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [resultSize, setResultSize] = useState(0);

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  const handleFiles = (files) => {
    if (files.length > 0) {
      setFile(files[0]);
      setError(null);
      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
        setResultUrl(null);
      }
    }
  };

  const processPdf = async () => {
    if (!file || !watermarkText) return;
    setIsProcessing(true);
    setError(null);
    setProgress(10);
    try {
      const bytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      setProgress(40);
      
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();
      
      pages.forEach((page) => {
        const { width, height } = page.getSize();
        const fontSize = 60;
        const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
        const textHeight = font.heightAtSize(fontSize);
        
        page.drawText(watermarkText, {
          x: width / 2 - textWidth / 2,
          y: height / 2 - textHeight / 2,
          size: fontSize,
          font,
          color: rgb(0.8, 0.2, 0.2),
          opacity: 0.3,
          rotate: degrees(45),
        });
      });
      
      setProgress(80);
      const outBytes = await pdfDoc.save();
      const blob = new Blob([outBytes], { type: 'application/pdf' });
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      setProgress(100);
    } catch (err) {
      console.error(err);
      setError('Failed to add watermark. Please ensure the file is valid.');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const download = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `watermarked-${file.name}`;
    a.click();
  };

  return (
    <div>
      <div className="tool-info-bar">
        <p className="tool-info-desc">Stamp a text watermark over your PDF documents. Processed securely in your browser.</p>
        <div className="tool-feats">
          <span className="tool-feat hi">©️ Add Watermark</span>
          <span className="tool-feat ok">✓ 100% private</span>
          <span className="tool-feat ok">✓ No upload</span>
        </div>
      </div>

      {!file && (
        <DropZone onFiles={handleFiles} accept="application/pdf,.pdf" maxFiles={1} label="Drop a PDF file here — or click to browse" />
      )}

      {file && !resultUrl && (
        <div className="tool-info-bar fade-in" style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0.8rem', background: 'var(--bg2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div>
              <strong>{file.name}</strong> <span style={{ color: 'var(--text3)' }}>({formatSize(file.size)})</span>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => setFile(null)}>Remove</button>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Watermark Text:</label>
            <input 
              type="text" 
              value={watermarkText} 
              onChange={(e) => setWatermarkText(e.target.value)} 
              className="form-input" 
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg1)', color: 'var(--text1)', width: '100%', maxWidth: '300px' }}
              placeholder="e.g. CONFIDENTIAL"
            />
          </div>

          <button className="btn btn-primary" onClick={processPdf} disabled={isProcessing || !watermarkText}>
            {isProcessing ? 'Processing…' : 'Add Watermark'}
          </button>
          
          <ToolProgressBar active={isProcessing} label="Adding Watermark…" value={progress} />
        </div>
      )}

      {error && <p className="text-danger" style={{ marginTop: '0.9rem', fontWeight: 600 }}>{error}</p>}

      {resultUrl && (
        <div className="tool-result-box fade-in">
          <div className="tool-result-icon">✅</div>
          <div className="tool-result-title">PDF Ready</div>
          <p className="tool-result-meta">Output size: <strong style={{ color: 'var(--success)' }}>{formatSize(resultSize)}</strong></p>
          <div className="tool-result-actions">
            <button className="btn btn-primary" onClick={download}>⬇ Download PDF</button>
            <button className="btn btn-outline" onClick={() => { setFile(null); setResultUrl(null); }}>Process Another</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddWatermark;