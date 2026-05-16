import { useState } from 'react';
import DropZone from './DropZone';
import ToolProgressBar from './ToolProgressBar';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { createWorker } from 'tesseract.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const LANGUAGE_OPTIONS = [
  { value: 'eng', label: 'English' },
  { value: 'fra', label: 'French' },
  { value: 'deu', label: 'German' },
  { value: 'spa', label: 'Spanish' },
  { value: 'por', label: 'Portuguese' },
  { value: 'ita', label: 'Italian' },
  { value: 'chi_sim', label: 'Chinese (Simplified)' },
  { value: 'chi_tra', label: 'Chinese (Traditional)' },
  { value: 'jpn', label: 'Japanese' },
  { value: 'kor', label: 'Korean' },
  { value: 'ara', label: 'Arabic' },
  { value: 'hin', label: 'Hindi' },
  { value: 'rus', label: 'Russian' },
];

const OcrTool = ({ type = 'image' }) => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState('eng');

  const [copying, setCopying] = useState(false);

  const handleFiles = (files) => {
    if (files[0]) {
      setFile(files[0]);
      setResult('');
      setDownloadUrl(null);
      setError(null);
      setNeedsPassword(false);
      setPassword('');
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const processFile = async (pwd = '') => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setError(null);
    setNeedsPassword(false);

    try {
      let fullText = '';
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      const worker = await createWorker(language, 1, {
        logger: m => {
          if (m.status === 'recognizing text' && !isPdf) {
            setProgress(Math.round(m.progress * 100));
          }
        }
      });

      if (isPdf) {
        const arrayBuffer = await file.arrayBuffer();
        const options = { data: arrayBuffer };
        if (pwd) options.password = pwd;

        const pdf = await pdfjsLib.getDocument(options).promise;
        const numPages = pdf.numPages;

        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({ canvasContext: ctx, viewport }).promise;

          const { data: { text } } = await worker.recognize(canvas);
          fullText += `## Page ${i}\n\n${text}\n\n`;
          setProgress(Math.round((i / numPages) * 100));
        }
      } else {
        // Image processing
        const { data: { text } } = await worker.recognize(file);
        fullText = text;
        setProgress(100);
      }

      await worker.terminate();

      setResult(fullText);
      const blob = new Blob([fullText], { type: 'text/markdown' });
      setDownloadUrl(URL.createObjectURL(blob));

    } catch (err) {
      console.error(err);
      const isEncrypted = err.name === 'PasswordException' || err.name === 'EncryptedPDFError' || 
                          (err.message && (err.message.toLowerCase().includes('password') || err.message.toLowerCase().includes('encrypt')));
      
      if (isEncrypted) {
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
    setResult('');
    setDownloadUrl(null);
    setProgress(0);
    setError(null);
  };

  const toolLabel = type === 'pdf' ? 'PDF to Markdown (OCR)' : 'Photo to Markdown (OCR)';
  const acceptTypes = type === 'pdf' ? '.pdf' : 'image/*';

  return (
    <>
      {!file ? (
        <>
          <div className="mb-3" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <label htmlFor="ocr-lang" style={{ fontWeight: 500, fontSize: '0.95rem' }}>Language</label>
            <select
              id="ocr-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem', cursor: 'pointer' }}
            >
              {LANGUAGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <DropZone onFiles={handleFiles} multiple={false} accept={acceptTypes} label={`Drop ${type === 'pdf' ? 'PDF' : 'Image'} here to extract text to Markdown`} />
        </>
      ) : (
        <div className="processing-box text-center">
          {processing ? (
            <div className="processing-icon mb-3">👁️</div>
          ) : (
            <h3 className="mb-3">{type === 'pdf' ? '📄' : '🖼️'}</h3>
          )}
          <h4 className="mb-3">{file.name}</h4>

          {needsPassword ? (
            <div className="mt-4">
              <p className="text-danger mb-3">🔒 This PDF is password protected.</p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <label htmlFor="ocr-pdf-password" className="visually-hidden">PDF Password</label>
                <input
                  id="ocr-pdf-password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }}
                />
                <button type="button" className="btn btn-primary" onClick={() => processFile(password)}>
                  Unlock & Extract
                </button>
              </div>
            </div>
          ) : processing ? (
            <div className="mt-4">
              <ToolProgressBar active label="Recognizing text…" value={progress} />
            </div>
          ) : !result ? (
            <button type="button" className="btn btn-primary mt-3" onClick={() => processFile()}>Extract Text (OCR)</button>
          ) : (
            <div className="mt-4">
              <p className="text-success mb-3">✅ Text extracted successfully!</p>
              <div style={{ position: 'relative' }}>
                <label htmlFor="ocr-output" className="visually-hidden">Extracted text</label>
                <textarea
                  id="ocr-output"
                  readOnly
                  aria-readonly="true"
                  value={result}
                  className="glass p-3 mb-3"
                  style={{ display: 'block', width: '100%', minHeight: '120px', maxHeight: '40vh', overflowY: 'auto', textAlign: 'left', fontSize: '0.9rem', whiteSpace: 'pre-wrap', resize: 'none', border: '1px solid var(--border)', borderRadius: '8px', background: 'transparent', color: 'var(--text)', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  aria-label="Copy extracted text"
                  onClick={copyToClipboard}
                  style={{ position: 'absolute', top: '10px', right: '10px', padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', minHeight: '28px' }}
                >
                  {copying ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="cs-actions">
                <a
                  href={downloadUrl}
                  download={`${file.name.replace(/\.[^.]+$/, '')}.md`}
                  className="btn btn-primary"
                  aria-label="Download as text file"
                >
                  ⬇ Download Markdown (.md)
                </a>
                <button type="button" className="btn btn-outline" onClick={reset}>Try Another</button>
              </div>
            </div>
          )}
          {error && <p className="text-danger mt-3">{error}</p>}
        </div>
      )}
    </>
  );
};

export default OcrTool;
