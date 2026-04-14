import { useEffect, useRef, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import DropZone from './DropZone';
import ToolProgressBar from './ToolProgressBar';
import PdfInteractivePreview from './PdfInteractivePreview';
import formatSize from '../utils/formatSize';
import { rasterizePage } from '../utils/pdfRasterizer';
import { useFileTool } from '../hooks/useFileTool';
import { findTextInPdf } from '../utils/pdfSearch';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const dataUrlToUint8Array = (dataUrl) => {
  const base64 = dataUrl.split(',')[1];
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const isDuplicate = (pageRects, newRect) => 
  pageRects.some(r => 
    Math.abs(r.x - newRect.x) < 0.001 && 
    Math.abs(r.y - newRect.y) < 0.001 &&
    Math.abs(r.w - newRect.w) < 0.001 &&
    Math.abs(r.h - newRect.h) < 0.001
  );

const RedactPdf = () => {
  const {
    file,
    pdfBytes,
    resultUrl,
    setResultUrl,
    isProcessing,
    setIsProcessing,
    error,
    setError,
    reset,
    setFileWithBytes
  } = useFileTool();

  const overlayCanvasRef = useRef(null);
  const drawingRef = useRef(null);

  const [pageCount, setPageCount] = useState(0);
  const [selectedPage, setSelectedPage] = useState(1);
  const [rectanglesByPage, setRectanglesByPage] = useState({});
  const [progress, setProgress] = useState(0);
  const [resultSize, setResultSize] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState('');

  // Load page count when pdfBytes change
  useEffect(() => {
    if (pdfBytes) {
      PDFDocument.load(pdfBytes, { ignoreEncryption: true }).then(doc => {
        setPageCount(doc.getPageCount());
      });
    } else {
      setPageCount(0);
      setRectanglesByPage({});
      setSelectedPage(1);
    }
  }, [pdfBytes]);

  // Redraw overlay canvas when rects or page change
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width || 1;
    canvas.height = rect.height || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { width, height } = canvas;
    const pageRects = rectanglesByPage[selectedPage] || [];
    
    ctx.lineWidth = Math.max(2, Math.round(width / 400));
    ctx.strokeStyle = '#ff5b5b';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.84)';

    pageRects.forEach((r) => {
      const x = r.x * width;
      const y = r.y * height;
      const w = r.w * width;
      const h = r.h * height;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
    });

    if (drawingRef.current?.active) {
      const draft = drawingRef.current;
      const x = Math.min(draft.startX, draft.currentX) * width;
      const y = Math.min(draft.startY, draft.currentY) * height;
      const w = Math.abs(draft.currentX - draft.startX) * width;
      const h = Math.abs(draft.currentY - draft.startY) * height;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#ff5b5b';
      ctx.strokeRect(x, y, w, h);
    }
  }, [rectanglesByPage, selectedPage, pdfBytes]);

  const handlePointerDown = ({ x, y, event }) => {
    drawingRef.current = {
      active: true,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = ({ x, y }) => {
    if (!drawingRef.current?.active) return;
    drawingRef.current.currentX = x;
    drawingRef.current.currentY = y;
    // Trigger redraw
    setRectanglesByPage(prev => ({ ...prev }));
  };

  const handlePointerUp = ({ event }) => {
    if (!drawingRef.current?.active) return;

    const draft = drawingRef.current;
    const x1 = clamp(Math.min(draft.startX, draft.currentX), 0, 1);
    const y1 = clamp(Math.min(draft.startY, draft.currentY), 0, 1);
    const x2 = clamp(Math.max(draft.startX, draft.currentX), 0, 1);
    const y2 = clamp(Math.max(draft.startY, draft.currentY), 0, 1);
    const w = x2 - x1;
    const h = y2 - y1;

    drawingRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (w < 0.005 || h < 0.005) return;

    setRectanglesByPage((prev) => {
      const pageRects = prev[selectedPage] || [];
      return {
        ...prev,
        [selectedPage]: [...pageRects, { x: x1, y: y1, w, h }],
      };
    });
  };

  const handleSearch = async () => {
    const term = searchTerm.trim();
    if (!term || !pdfBytes) return;
    setIsSearching(true);
    setSearchFeedback('');
    try {
      const results = await findTextInPdf(pdfBytes, term);
      let matchCount = 0;
      const affectedPages = new Set();

      setRectanglesByPage(prev => {
        const next = { ...prev };
        Object.entries(results).forEach(([page, matches]) => {
          const pageNum = parseInt(page);
          const currentRects = next[pageNum] || [];
          const newOnes = [];
          
          matches.forEach(m => {
            if (!isDuplicate(currentRects, m) && !isDuplicate(newOnes, m)) {
              newOnes.push(m);
              matchCount += 1;
              affectedPages.add(pageNum);
            }
          });

          if (newOnes.length > 0) {
            next[pageNum] = [...currentRects, ...newOnes];
          }
        });
        setSearchFeedback(`Redacted ${matchCount} occurrences across ${affectedPages.size} pages`);
        return next;
      });
      setSearchTerm('');
    } catch (err) {
      console.error(err);
      setError('Search failed.');
    } finally {
      setIsSearching(false);
    }
  };

  const undoLast = () => {
    setRectanglesByPage((prev) => {
      const pageRects = prev[selectedPage] || [];
      if (!pageRects.length) return prev;
      return {
        ...prev,
        [selectedPage]: pageRects.slice(0, -1),
      };
    });
  };

  const clearCurrentPage = () => {
    setRectanglesByPage((prev) => ({
      ...prev,
      [selectedPage]: [],
    }));
  };

  const clearAll = () => setRectanglesByPage({});

  const handleReset = () => {
    reset();
    setPageCount(0);
    setSelectedPage(1);
    setRectanglesByPage({});
    setSearchTerm('');
    setIsSearching(false);
    setSearchFeedback('');
    setResultSize(0);
    setProgress(0);
  };

  const exportRedactedPdf = async () => {
    if (!pdfBytes || !file) return;

    setIsProcessing(true);
    setError('');
    setProgress(5);

    try {
      const sourceDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const outputDoc = await PDFDocument.create();
      const totalPages = sourceDoc.getPageCount();

      for (let pageIndex = 1; pageIndex <= totalPages; pageIndex += 1) {
        const sourcePage = sourceDoc.getPage(pageIndex - 1);
        const { width, height } = sourcePage.getSize();
        
        // Rasterize at high quality for the final export
        const renderedCanvas = await rasterizePage(pdfBytes, pageIndex, {
          scale: 2.0,
          useDPR: false,
        });
        const context = renderedCanvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('Could not prepare the redaction canvas.');

        const pageRects = rectanglesByPage[pageIndex] || [];
        context.fillStyle = '#000000';

        pageRects.forEach((rect) => {
          const x = Math.round(rect.x * renderedCanvas.width);
          const y = Math.round(rect.y * renderedCanvas.height);
          const w = Math.ceil(rect.w * renderedCanvas.width);
          const h = Math.ceil(rect.h * renderedCanvas.height);
          context.fillRect(x, y, w, h);
        });

        const outBytes = dataUrlToUint8Array(renderedCanvas.toDataURL('image/png'));
        const image = await outputDoc.embedPng(outBytes);
        const page = outputDoc.addPage([width, height]);
        page.drawImage(image, { x: 0, y: 0, width, height });

        setProgress(Math.round((pageIndex / totalPages) * 100));
      }

      const finalBytes = await outputDoc.save();
      const blob = new Blob([finalBytes], { type: 'application/pdf' });
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to redact the PDF.');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const downloadResult = () => {
    if (!resultUrl || !file) return;
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `${file.name.replace(/\.pdf$/i, '')}-redacted.pdf`;
    link.click();
  };

  const currentRects = rectanglesByPage[selectedPage] || [];
  const totalRects = Object.values(rectanglesByPage).reduce((sum, rects) => sum + rects.length, 0);

  return (
    <div>
      <div className="tool-info-bar">
        <p className="tool-info-desc">
          Redact sensitive information by drawing boxes or using search to auto-redact terms. 
          The final PDF is rasterized, ensuring redactions cannot be removed.
        </p>
        <div className="tool-feats">
          <span className="tool-feat hi">Client-side redaction</span>
          <span className="tool-feat ok">Search & Redact</span>
          <span className="tool-feat ok">Rasterized export</span>
        </div>
      </div>

      <DropZone
        onFiles={(files) => setFileWithBytes(files[0])}
        multiple={false}
        accept="application/pdf,.pdf"
        label="Drop a PDF here or click to browse"
      />

      {file && (
        <div className="tool-info-bar fade-in" style={{ marginTop: '1.25rem', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', alignItems: 'center' }}>
            <div className="tool-file-info" style={{ margin: 0 }}>
              <span className="file-icon">PDF</span>
              <div>
                <div className="tool-file-name">{file.name}</div>
                <div className="tool-file-size">{formatSize(file.size)} - {pageCount} pages</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Search term to redact..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{ flex: 1, padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
              <button 
                className="btn btn-primary btn-sm" 
                onClick={handleSearch} 
                disabled={!searchTerm || isSearching}
              >
                {isSearching ? '...' : 'Redact All'}
              </button>
            </div>
          </div>
          
          {searchFeedback && <p style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600, margin: 0 }}>{searchFeedback}</p>}

          <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'minmax(280px, 320px) minmax(320px, 1fr)' }}>
            <div style={{ display: 'grid', gap: '1.25rem', alignContent: 'start' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Navigation</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => setSelectedPage(p => Math.max(1, p - 1))} disabled={selectedPage <= 1}>Prev</button>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', minWidth: '60px', textAlign: 'center' }}>{selectedPage} / {pageCount}</span>
                  <button className="btn btn-outline btn-sm" onClick={() => setSelectedPage(p => Math.min(pageCount, p + 1))} disabled={selectedPage >= pageCount}>Next</button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Redaction Tools ({currentRects.length} on page)</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-outline btn-sm" onClick={undoLast} disabled={!currentRects.length}>Undo</button>
                  <button className="btn btn-outline btn-sm" onClick={clearCurrentPage} disabled={!currentRects.length}>Clear Page</button>
                  <button className="btn btn-outline btn-sm btn-danger" onClick={clearAll} disabled={!totalRects}>Clear All ({totalRects})</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginTop: 'auto' }}>
                <button className="btn btn-primary" onClick={exportRedactedPdf} disabled={isProcessing || !totalRects}>
                  {isProcessing ? 'Exporting...' : 'Export Redacted PDF'}
                </button>
                <button className="btn btn-outline" onClick={handleReset}>Reset</button>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <p className="tool-info-desc" style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Draw boxes over content you want to hide.
              </p>
              <PdfInteractivePreview
                pdfBytes={pdfBytes}
                page={selectedPage}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                <canvas
                  ref={overlayCanvasRef}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                  }}
                />
              </PdfInteractivePreview>
            </div>
          </div>

          <ToolProgressBar
            active={isProcessing}
            label="Burning redactions into PDF pixels..."
            value={progress}
          />
        </div>
      )}

      {error && <p className="text-danger" style={{ marginTop: '1rem', fontWeight: 600 }}>{error}</p>}

      {resultUrl && (
        <div className="tool-result-box fade-in">
          <div className="tool-result-title">Redaction Complete</div>
          <p className="tool-result-meta">Output size: <strong style={{ color: 'var(--success)' }}>{formatSize(resultSize)}</strong></p>
          <div className="tool-result-actions">
            <button className="btn btn-primary" onClick={downloadResult}>Download Redacted PDF</button>
            <button className="btn btn-outline" onClick={handleReset}>Redact Another</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RedactPdf;
