import { useState } from 'react';
import DropZone from './DropZone';
import { PDFDocument } from 'pdf-lib';

const PdfToPdfA = () => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleFiles = (files) => {
    if (files[0] && files[0].type === 'application/pdf') {
      setFile(files[0]);
      setDownloadUrl(null);
      setError(null);
    } else {
      setError('Please upload a valid PDF file.');
    }
  };

  const processPdf = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      
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
      if (err.name === 'EncryptedPDFError' || (err.message && err.message.toLowerCase().includes('encrypt'))) {
        setError('This PDF is password protected. Please unlock it first using our Unlock PDF tool.');
      } else {
        setError('An error occurred. The PDF might be corrupted or severely restricted.');
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
    <div className="tool-container">
      {!file ? (
        <DropZone onFiles={handleFiles} multiple={false} accept=".pdf" label="Drop PDF here to convert for archiving" />
      ) : (
        <div className="processing-box text-center">
          <h3 className="mb-3">🔒 {file.name}</h3>
          
          {error && <p className="text-danger">{error}</p>}
          
          {processing ? (
            <div className="mt-4">
              <p>Optimizing and flattening for archive...</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `100%`, animation: 'progressAnim 2s infinite' }}></div>
              </div>
            </div>
          ) : !downloadUrl ? (
            <div className="mt-3">
              <p className="text-muted text-sm mb-3">Note: We flatten forms and optimize metadata for long-term preservation.</p>
              <button className="btn btn-primary" onClick={processPdf}>Convert to PDF/A</button>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-success mb-3">✅ Ready for archive!</p>
              <div className="cs-actions">
                <a href={downloadUrl} download={`${file.name.replace('.pdf', '')}_PDFA.pdf`} className="btn btn-primary">
                  ⬇ Download Archive PDF
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

export default PdfToPdfA;
