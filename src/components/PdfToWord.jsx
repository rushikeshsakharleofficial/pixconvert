import { useState } from 'react';
import DropZone from './DropZone';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { Document, Packer, Paragraph, TextRun } from 'docx';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PdfToWord = () => {
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

      const docChildren = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Group items by Y coordinate (nearest 5 pixels roughly represents a line)
        const linesMap = new Map();
        textContent.items.forEach(item => {
          const y = Math.round(item.transform[5] / 5) * 5;
          if (!linesMap.has(y)) linesMap.set(y, []);
          linesMap.get(y).push(item);
        });

        // Convert map to sorted array (top to bottom)
        const sortedY = Array.from(linesMap.keys()).sort((a, b) => b - a);
        
        for (const y of sortedY) {
          const lineItems = linesMap.get(y);
          // Sort items in the line from left to right
          lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
          
          const lineString = lineItems.map(it => it.str).join(' ');
          
          if (lineString.trim()) {
            docChildren.push(
              new Paragraph({
                children: [ new TextRun(lineString) ]
              })
            );
          }
        }

        // Add page break if not last page
        if (i < numPages) {
          docChildren.push(new Paragraph({ pageBreakBefore: true }));
        }

        setProgress(Math.round((i / numPages) * 100));
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: docChildren.length ? docChildren : [new Paragraph({ children: [new TextRun("No text found in PDF.")] })]
        }]
      });

      const blob = await Packer.toBlob(doc);
      setDownloadUrl(URL.createObjectURL(blob));

    } catch (err) {
      console.error(err);
      if (err.name === 'PasswordException') {
        setNeedsPassword(true);
      } else {
        setError('An error occurred during Word extraction. May not contain extractable text.');
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
        <DropZone onFiles={handleFiles} multiple={false} accept=".pdf" label="Drop PDF here to extract to Word" />
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
                  Unlock & Extract
                </button>
              </div>
            </div>
          ) : processing ? (
            <div className="mt-4">
              <p>Extracting text to Word... {progress}%</p>
              <div className="progress-bar">
                <div className="progress-fill animated" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          ) : !downloadUrl ? (
            <div className="mt-3">
              <p className="text-muted text-sm mb-3">Note: Text extraction translates readable text. Complex layouts and images might not be perfectly preserved.</p>
              <button className="btn btn-primary" onClick={processPdf}>Extract to Word</button>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-success mb-3">✅ Extraction complete!</p>
              <div className="cs-actions">
                <a href={downloadUrl} download={`${file.name.replace('.pdf', '')}.docx`} className="btn btn-primary">
                  ⬇ Download DOCX
                </a>
                <button className="btn btn-outline" onClick={reset}>Extract Another</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfToWord;
