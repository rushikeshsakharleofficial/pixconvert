import { useState, useCallback, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import DropZone from './DropZone';
import usePdfDocument from '../hooks/usePdfDocument';
import EditorToolbar from './pdf-editor/EditorToolbar';
import ThumbnailSidebar from './pdf-editor/ThumbnailSidebar';
import PageCanvas from './pdf-editor/PageCanvas';

let nextId = 1;

const EditPdf = () => {
  const [file, setFile] = useState(null);
  const [activePage, setActivePage] = useState(0);
  const [activeTool, setActiveTool] = useState('select');
  const [activeColor, setActiveColor] = useState('#fde047');
  const [fontSize, setFontSize] = useState(16);
  const [annotations, setAnnotations] = useState([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);
  const mainRef = useRef(null);

  const { pdfDoc, numPages, loading, error: loadError } = usePdfDocument(file);

  const handleFiles = (files) => {
    if (files.length > 0) {
      setFile(files[0]);
      setAnnotations([]);
      setHistory([]);
      setActivePage(0);
      setSelectedAnnotation(null);
      setError(null);
      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
        setResultUrl(null);
      }
    }
  };

  const addAnnotation = useCallback((ann) => {
    const newAnn = { ...ann, id: nextId++ };
    setHistory((prev) => [...prev, annotations]);
    setAnnotations((prev) => [...prev, newAnn]);
    setSelectedAnnotation(newAnn.id);
  }, [annotations]);

  const updateAnnotation = useCallback((id, updates) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  }, []);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setAnnotations(prev);
    setHistory((h) => h.slice(0, -1));
    setSelectedAnnotation(null);
  }, [history]);

  const deleteSelected = useCallback(() => {
    if (!selectedAnnotation) return;
    setHistory((prev) => [...prev, annotations]);
    setAnnotations((prev) => prev.filter((a) => a.id !== selectedAnnotation));
    setSelectedAnnotation(null);
  }, [selectedAnnotation, annotations]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') return;
      deleteSelected();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      undo();
    }
  }, [deleteSelected, undo]);

  const savePdf = useCallback(async () => {
    if (!file || annotations.length === 0) return;
    setSaving(true);
    setError(null);

    try {
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();

      for (const ann of annotations) {
        if (ann.pageIndex >= pages.length) continue;
        const page = pages[ann.pageIndex];
        const { height: pageHeight } = page.getSize();
        // pdfjs renders top-down, pdf-lib coordinates are bottom-up
        const pdfY = pageHeight - ann.y;

        if (ann.type === 'text' && ann.content) {
          page.drawText(ann.content, {
            x: ann.x,
            y: pdfY - (ann.fontSize || 16),
            size: ann.fontSize || 16,
            font,
            color: hexToRgb(ann.color || '#000000'),
          });
        }

        if (ann.type === 'highlight') {
          page.drawRectangle({
            x: ann.x,
            y: pdfY - ann.height,
            width: ann.width,
            height: ann.height,
            color: hexToRgb(ann.color || '#fde047'),
            opacity: 0.3,
          });
        }

        if (ann.type === 'underline') {
          page.drawLine({
            start: { x: ann.x, y: pdfY - ann.height },
            end: { x: ann.x + ann.width, y: pdfY - ann.height },
            thickness: 2,
            color: hexToRgb(ann.color || '#f87171'),
          });
        }

        if (ann.type === 'strikethrough') {
          page.drawLine({
            start: { x: ann.x, y: pdfY - ann.height / 2 },
            end: { x: ann.x + ann.width, y: pdfY - ann.height / 2 },
            thickness: 2,
            color: hexToRgb(ann.color || '#f87171'),
          });
        }

        if (ann.type === 'sticky' && ann.content) {
          // Draw sticky note background
          page.drawRectangle({
            x: ann.x,
            y: pdfY - ann.height,
            width: ann.width,
            height: ann.height,
            color: hexToRgb(ann.color || '#fde047'),
            opacity: 0.9,
            borderColor: rgb(0, 0, 0),
            borderWidth: 0.5,
          });
          // Draw sticky note text
          const lines = wrapText(ann.content, font, 10, ann.width - 10);
          lines.forEach((line, i) => {
            page.drawText(line, {
              x: ann.x + 5,
              y: pdfY - 20 - i * 13,
              size: 10,
              font,
              color: rgb(0, 0, 0),
            });
          });
        }
      }

      const outBytes = await doc.save();
      const blob = new Blob([outBytes], { type: 'application/pdf' });
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
    } catch (err) {
      setError('Failed to save PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  }, [file, annotations, resultUrl]);

  const downloadPdf = useCallback(() => {
    if (!resultUrl) {
      // save first, then download
      savePdf().then(() => {
        // resultUrl will be set after save
      });
      return;
    }
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `edited-${file?.name || 'document.pdf'}`;
    a.click();
  }, [resultUrl, file, savePdf]);

  const handleDownload = useCallback(async () => {
    if (!resultUrl) {
      await savePdf();
    }
    // Need to wait for state update — use a direct approach
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pages = doc.getPages();

    for (const ann of annotations) {
      if (ann.pageIndex >= pages.length) continue;
      const page = pages[ann.pageIndex];
      const { height: pageHeight } = page.getSize();
      const pdfY = pageHeight - ann.y;

      if (ann.type === 'text' && ann.content) {
        page.drawText(ann.content, {
          x: ann.x, y: pdfY - (ann.fontSize || 16),
          size: ann.fontSize || 16, font,
          color: hexToRgb(ann.color || '#000000'),
        });
      }
      if (ann.type === 'highlight') {
        page.drawRectangle({
          x: ann.x, y: pdfY - ann.height, width: ann.width, height: ann.height,
          color: hexToRgb(ann.color || '#fde047'), opacity: 0.3,
        });
      }
      if (ann.type === 'underline') {
        page.drawLine({
          start: { x: ann.x, y: pdfY - ann.height },
          end: { x: ann.x + ann.width, y: pdfY - ann.height },
          thickness: 2, color: hexToRgb(ann.color || '#f87171'),
        });
      }
      if (ann.type === 'strikethrough') {
        page.drawLine({
          start: { x: ann.x, y: pdfY - ann.height / 2 },
          end: { x: ann.x + ann.width, y: pdfY - ann.height / 2 },
          thickness: 2, color: hexToRgb(ann.color || '#f87171'),
        });
      }
      if (ann.type === 'sticky' && ann.content) {
        page.drawRectangle({
          x: ann.x, y: pdfY - ann.height, width: ann.width, height: ann.height,
          color: hexToRgb(ann.color || '#fde047'), opacity: 0.9,
          borderColor: rgb(0, 0, 0), borderWidth: 0.5,
        });
        const lines = wrapText(ann.content, font, 10, ann.width - 10);
        lines.forEach((line, i) => {
          page.drawText(line, {
            x: ann.x + 5, y: pdfY - 20 - i * 13, size: 10, font, color: rgb(0, 0, 0),
          });
        });
      }
    }

    const outBytes = await doc.save();
    const blob = new Blob([outBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edited-${file?.name || 'document.pdf'}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [file, annotations]);

  const reset = () => {
    setFile(null);
    setAnnotations([]);
    setHistory([]);
    setActivePage(0);
    setSelectedAnnotation(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setError(null);
  };

  // Upload screen
  if (!file) {
    return (
      <div>
        <div className="tool-info-bar">
          <p className="tool-info-desc">
            Edit your PDF live — add text, highlights, underlines, strikethrough, and sticky notes. Save directly as PDF.
          </p>
          <div className="tool-feats">
            <span className="tool-feat hi">✏️ Live PDF Editor</span>
            <span className="tool-feat ok">✓ 100% private</span>
            <span className="tool-feat ok">✓ No upload to server</span>
          </div>
        </div>
        <DropZone onFiles={handleFiles} accept="application/pdf,.pdf" maxFiles={1} label="Drop a PDF file here — or click to browse" />
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="pdf-editor-loading">
        <div className="loading-spinner" />
        <p>Loading PDF...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="pdf-editor-error">
        <p className="text-danger">{loadError}</p>
        <button className="btn btn-outline" onClick={reset}>Try Another File</button>
      </div>
    );
  }

  // Editor view
  return (
    <div className="pdf-editor" onKeyDown={handleKeyDown} tabIndex={0}>
      <EditorToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        activeColor={activeColor}
        onColorChange={setActiveColor}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        onSave={savePdf}
        onUndo={undo}
        onDownload={handleDownload}
        saving={saving}
        canUndo={history.length > 0}
      />

      {error && <p className="text-danger" style={{ padding: '0.5rem 1rem', fontWeight: 600 }}>{error}</p>}

      {resultUrl && (
        <div className="pdf-editor-saved-bar">
          <span>PDF saved successfully!</span>
          <button className="btn btn-primary btn-sm" onClick={downloadPdf}>⬇ Download</button>
          <button className="btn btn-outline btn-sm" onClick={() => setResultUrl(null)}>Continue Editing</button>
          <button className="btn btn-outline btn-sm" onClick={reset}>Edit Another</button>
        </div>
      )}

      <div className="pdf-editor-body">
        <ThumbnailSidebar
          pdfDoc={pdfDoc}
          numPages={numPages}
          activePage={activePage}
          onPageSelect={(i) => {
            setActivePage(i);
            // scroll to page in main area
            const pageEl = mainRef.current?.querySelector(`[data-page="${i}"]`);
            if (pageEl) pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />

        <div className="pdf-editor-main" ref={mainRef}>
          {Array.from({ length: numPages }, (_, i) => (
            <div key={i} data-page={i} className="pdf-editor-page-container">
              <div className="page-label">Page {i + 1} of {numPages}</div>
              <PageCanvas
                pdfDoc={pdfDoc}
                pageIndex={i}
                annotations={annotations}
                activeTool={activeTool}
                activeColor={activeColor}
                fontSize={fontSize}
                onAddAnnotation={addAnnotation}
                onUpdateAnnotation={updateAnnotation}
                onSelectAnnotation={setSelectedAnnotation}
                selectedAnnotation={selectedAnnotation}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helpers

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
}

function wrapText(text, font, size, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(test, size);
    if (width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export default EditPdf;
