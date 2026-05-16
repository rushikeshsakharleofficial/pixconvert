import { useState } from 'react';
import DropZone from './DropZone';
import ToolProgressBar from './ToolProgressBar';
import { PDFDocument } from 'pdf-lib';
import { isEncryptedError } from '../utils/pdfPasswordCheck';

const PdfToPdfA = () => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
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
    setError(null);
    setNeedsPassword(false);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { password: pwd || undefined });
      
      // Basic PDF/A simulation: flatten forms to make it uneditable (archived)
      const form = pdfDoc.getForm();
      if (form) {
        form.flatten();
      }
      
      pdfDoc.setTitle(`${file.name.replace('.pdf', '')} - Archived`);
      pdfDoc.setProducer('PixConvert (Offline)');
      pdfDoc.setCreator('PixConvert');

      const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));

    } catch (err) {
      console.error(err);
      if (isEncryptedError(err)) {
        setNeedsPassword(true);
      } else {
        setError('An error occurred: ' + (err.message || 'The PDF might be corrupted or restricted.'));
      }
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setDownloadUrl(null);
    setError(null);
  };

  return (
    <>
      <div className="tool-info-bar">
        <p className="tool-info-desc">
          Flatten forms, embed metadata, and prepare your PDF for long-term archiving. Produces a clean, self-contained PDF suitable for official record-keeping.
        </p>
        <div className="tool-feats">
          <span className="tool-feat hi">🔒 Flatten &amp; archive</span>
          <span className="tool-feat ok">✓ Embeds metadata</span>
          <span className="tool-feat ok">✓ Removes form fields</span>
          <span className="tool-feat ok">✓ 100% private</span>
          <span className="tool-feat inf">Note: does not produce ISO 19005-certified PDF/A</span>
        </div>
      </div>

      {!file ? (
        <DropZone onFiles={handleFiles} multiple={false} accept=".pdf" label="Drop PDF here to flatten &amp; archive — or click to browse" />
      ) : (
        <div className="processing-box text-center">
          {processing ? (
            <div className="processing-icon mb-3">⚙️</div>
          ) : (
            <h3 className="mb-3">🔒</h3>
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
                <button type="button" className="btn btn-primary" onClick={() => processPdf(password)}>
                  Unlock & Archive
                </button>
              </div>
            </div>
          ) : processing ? (
            <div className="mt-4">
              <ToolProgressBar active label="Optimizing and flattening for archive…" />
            </div>
          ) : !downloadUrl ? (
            <div className="mt-3">
              <p className="text-muted text-sm mb-3">Note: This tool flattens forms and optimizes metadata for long-term preservation. It does not produce a fully ISO 19005-compliant PDF/A — for strict compliance, use a dedicated PDF/A validator.</p>
              <button type="button" className="btn btn-primary" onClick={() => processPdf()}>Flatten &amp; Archive PDF</button>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-success mb-3">✅ Ready for archive!</p>
              <div className="cs-actions">
                <a href={downloadUrl} download={`${file.name.replace('.pdf', '')}_PDFA.pdf`} className="btn btn-primary">
                  ⬇ Download Archive PDF
                </a>
                <button type="button" className="btn btn-outline" onClick={reset}>Convert Another</button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default PdfToPdfA;
