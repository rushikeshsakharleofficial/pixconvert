import { useState } from 'react';
import DropZone from './DropZone';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import pptxgen from 'pptxgenjs';
import { isEncryptedError } from '../utils/pdfPasswordCheck';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PdfToPowerpoint = () => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');

  const handleFiles = (files) => {
    if (files[0] && files[0].type === 'application/pdf') {
      setFile(files[0]);
      setDownloadUrl(null);
      setError(null);
      setNeedsPassword(false);
      setPassword('');
    } else {
      setError('Please upload a valid PDF file.');
    }
  };

  const processPdf = async (pwd = '') => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setError(null);
    setNeedsPassword(false);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const options = { data: arrayBuffer };
      if (pwd) options.password = pwd;

      const pdf = await pdfjsLib.getDocument(options).promise;
      const numPages = pdf.numPages;
      const pptx = new pptxgen();

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // High res for PPT

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = "white"; // ensure white background instead of transparent
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport }).promise;

        // Convert canvas to base64
        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        
        // Add slide to PPTX
        const slide = pptx.addSlide();
        
        // Convert viewport size (px at 72dpi scale 2.0) to inches for PPTX layout
        // Let PPTX auto-stretch, or we can force standard 16:9 / 4:3
        // For best results, we'll just cover the whole slide
        slide.addImage({ data: base64, x: 0, y: 0, w: '100%', h: '100%' });

        setProgress(Math.round((i / numPages) * 100));
      }

      // Generate the PPTX as a blob
      const blob = await pptx.write({ outputType: 'blob' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

    } catch (err) {
      console.error(err);
      if (isEncryptedError(err)) {
        setNeedsPassword(true);
      } else {
        setError('An error occurred: ' + (err.message || 'Unknown error.'));
      }
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setDownloadUrl(null);
    setProgress(0);
    setError(null);
  };

  return (
    <div className="tool-container">
      {!file ? (
        <DropZone onFiles={handleFiles} multiple={false} accept=".pdf" label="Drop PDF here to convert to PPTX" />
      ) : (
        <div className="processing-box text-center">
          {processing ? (
            <div className="processing-icon mb-3">⚙️</div>
          ) : (
            <h3 className="mb-3">📄</h3>
          )}
          <h4 className="mb-3">{file.name}</h4>
          
          {needsPassword ? (
            <div className="mt-4">
              <p className="text-danger mb-3">🔒 This PDF is password protected.</p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <input 
                  type="password" 
                  placeholder="Enter password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }}
                />
                <button className="btn btn-primary" onClick={() => processPdf(password)}>
                  Unlock & Convert
                </button>
              </div>
            </div>
          ) : processing ? (
            <div className="mt-4">
              <p>Converting to PowerPoint... {progress}%</p>
              <div className="progress-bar">
                <div className="progress-fill animated" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          ) : !downloadUrl ? (
            <button className="btn btn-primary mt-3" onClick={() => processPdf()}>Convert to POWERPOINT</button>
          ) : (
            <div className="mt-4">
              <p className="text-success mb-3">✅ Conversion complete!</p>
              <div className="cs-actions">
                <a href={downloadUrl} download={`${file.name.replace('.pdf', '')}.pptx`} className="btn btn-primary">
                  ⬇ Download PowerPoint
                </a>
                <button className="btn btn-outline" onClick={reset}>Convert Another</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfToPowerpoint;
