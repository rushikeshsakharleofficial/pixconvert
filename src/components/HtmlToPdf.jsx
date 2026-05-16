import { useState } from 'react';
import DropZone from './DropZone';
import ToolProgressBar from './ToolProgressBar';
import formatSize from '../utils/formatSize';
import { htmlToPdfBytes } from '../utils/htmlToPdf';

const HtmlToPdf = () => {
  const [htmlInput, setHtmlInput] = useState('');
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleFiles = (files) => {
    if (!files.length) return;
    const f = files[0];
    setFile(f);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setHtmlInput(String(reader.result || ''));
    reader.readAsText(f);
  };

  const convert = async () => {
    const html = htmlInput;
    if (!html.trim()) {
      setError('Paste HTML or choose an .html / .htm file.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const styled = `<div class="html-root">${html}</div>
        <style>
          .html-root{font-size:14px;line-height:1.55;}
          .html-root img{max-width:100%;height:auto;}
          .html-root table{border-collapse:collapse;width:100%;}
          .html-root td,.html-root th{border:1px solid #ddd;padding:6px;}
        </style>`;
      const bytes = await htmlToPdfBytes(styled);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file ? `${file.name.replace(/\.[^.]+$/, '')}.pdf` : 'page.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div className="tool-info-bar">
        <p className="tool-info-desc">
          Paste HTML or upload a file. Remote images must allow cross-origin loading or they may be omitted.
        </p>
        <div className="tool-feats">
          <span className="tool-feat hi">🌐 HTML → PDF</span>
          <span className="tool-feat ok">✓ 100% private</span>
          <span className="tool-feat ok">✓ No upload</span>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="html-content">HTML content</label>
        <textarea
          id="html-content"
          rows={12}
          value={htmlInput}
          onChange={(e) => setHtmlInput(e.target.value)}
          placeholder="<h1>Hello</h1><p>Your HTML here…</p>"
          disabled={isProcessing}
          style={{ width: '100%', fontFamily: 'ui-monospace, monospace', fontSize: '0.85rem', minHeight: '44px' }}
        />
      </div>

      <DropZone
        onFiles={handleFiles}
        multiple={false}
        maxFiles={1}
        accept=".html,.htm,text/html"
        label="Or drop an .html file here"
      />

      {file && <p className="tool-info-desc fade-in" style={{ marginTop: '0.75rem' }}>Loaded: {file.name} ({formatSize(file.size)})</p>}

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-primary" onClick={convert} disabled={isProcessing}>
          {isProcessing ? 'Creating PDF…' : 'Download PDF'}
        </button>
      </div>
      <ToolProgressBar active={isProcessing} label="Rendering HTML to PDF…" />

      {error && <p className="text-danger" style={{ marginTop: '0.9rem', fontWeight: 600 }}>{error}</p>}
    </div>
  );
};

export default HtmlToPdf;
