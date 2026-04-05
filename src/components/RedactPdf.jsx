import { createElement, useEffect, useRef, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import DropZone from './DropZone';
import ToolProgressBar from './ToolProgressBar';
import formatSize from '../utils/formatSize';
import { rasterizePage } from '../utils/pdfRasterizer';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const RedactPdf = () => {
  const previewCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const drawingRef = useRef(null);
  const renderedPreviewRef = useRef(null);

  const [file, setFile] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [selectedPage, setSelectedPage] = useState(1);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [rectanglesByPage, setRectanglesByPage] = useState({});
  const [isRendering, setIsRendering] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [resultUrl, setResultUrl] = useState(null);
  const [resultSize, setResultSize] = useState(0);

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = previewSize;
    canvas.width = width || 1;
    canvas.height = height || 1;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!width || !height) return;

    const pageRects = rectanglesByPage[selectedPage] || [];
    ctx.lineWidth = Math.max(2, Math.round(width / 400));
    ctx.strokeStyle = '#ff5b5b';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.84)';

    pageRects.forEach((rect) => {
      const x = rect.x * width;
      const y = rect.y * height;
      const w = rect.w * width;
      const h = rect.h * height;
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
  }, [previewSize, rectanglesByPage, selectedPage]);

  useEffect(() => {
    if (!pdfBytes || !selectedPage) return undefined;
    let cancelled = false;

    const renderPreview = async () => {
      setIsRendering(true);
      setError('');
      try {
        const renderedCanvas = await rasterizePage(pdfBytes, selectedPage, {
          scale: 1.35,
          useDPR: false,
        });
        if (cancelled) return;

        const previewCanvas = previewCanvasRef.current;
        if (!previewCanvas) return;
        const ctx = previewCanvas.getContext('2d');
        if (!ctx) throw new Error('Could not create preview canvas.');

        previewCanvas.width = renderedCanvas.width;
        previewCanvas.height = renderedCanvas.height;
        previewCanvas.style.width = '100%';
        previewCanvas.style.height = 'auto';
        ctx.drawImage(renderedCanvas, 0, 0);

        renderedPreviewRef.current = renderedCanvas;
        setPreviewSize({ width: renderedCanvas.width, height: renderedCanvas.height });
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError('Failed to render the PDF preview.');
        }
      } finally {
        if (!cancelled) setIsRendering(false);
      }
    };

    renderPreview();
    return () => {
      cancelled = true;
    };
  }, [pdfBytes, selectedPage]);

  useEffect(() => {
    return () => {
      renderedPreviewRef.current = null;
    };
  }, []);

  const handleFiles = async (files) => {
    if (!files.length) return;

    const nextFile = files[0];
    try {
      const bytes = new Uint8Array(await nextFile.arrayBuffer());
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });

      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
        setResultUrl(null);
      }

      setFile(nextFile);
      setPdfBytes(bytes);
      setPageCount(pdfDoc.getPageCount());
      setSelectedPage(1);
      setRectanglesByPage({});
      setPreviewSize({ width: 0, height: 0 });
      setError('');
    } catch (err) {
      console.error(err);
      setError('Could not open that PDF. Please choose a valid file.');
    }
  };

  const getNormalizedPoint = (event) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
      y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
    };
  };

  const beginDraw = (event) => {
    if (!previewSize.width || !previewSize.height) return;
    const point = getNormalizedPoint(event);
    drawingRef.current = {
      active: true,
      startX: point.x,
      startY: point.y,
      currentX: point.x,
      currentY: point.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const updateDraw = (event) => {
    if (!drawingRef.current?.active) return;
    const point = getNormalizedPoint(event);
    drawingRef.current.currentX = point.x;
    drawingRef.current.currentY = point.y;
    setRectanglesByPage((prev) => ({ ...prev }));
  };

  const endDraw = (event) => {
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

    if (w < 0.01 || h < 0.01) {
      return;
    }

    setRectanglesByPage((prev) => {
      const pageRects = prev[selectedPage] || [];
      return {
        ...prev,
        [selectedPage]: [...pageRects, { x: x1, y: y1, w, h }],
      };
    });
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

  const clearAll = () => {
    setRectanglesByPage({});
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
        const renderedCanvas = await rasterizePage(pdfBytes, pageIndex, {
          scale: 1.8,
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

        const outBytes = await fetch(renderedCanvas.toDataURL('image/png')).then((response) => response.arrayBuffer());
        const image = await outputDoc.embedPng(outBytes);
        const page = outputDoc.addPage([width, height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width,
          height,
        });

        setProgress(Math.round((pageIndex / totalPages) * 100));
      }

      const finalBytes = await outputDoc.save();
      const blob = new Blob([finalBytes], { type: 'application/pdf' });

      if (resultUrl) URL.revokeObjectURL(resultUrl);
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
          Draw black boxes over sensitive content, page by page, then export a flattened PDF where the redactions are burned into the pixels.
        </p>
        <div className="tool-feats">
          <span className="tool-feat hi">Client-side redaction</span>
          <span className="tool-feat ok">Page-specific boxes</span>
          <span className="tool-feat ok">Rasterized export</span>
          <span className="tool-feat ok">No upload required</span>
        </div>
      </div>

      {!file && createElement(DropZone, {
        onFiles: handleFiles,
        multiple: false,
        accept: 'application/pdf,.pdf',
        label: 'Drop a PDF here or click to browse',
      })}

      {file && !resultUrl && (
        <div className="tool-info-bar fade-in" style={{ marginTop: '1rem' }}>
          <div className="tool-file-info" style={{ margin: 0 }}>
            <span className="file-icon">PDF</span>
            <div>
              <div className="tool-file-name">{file.name}</div>
              <div className="tool-file-size">{formatSize(file.size)} - {pageCount} pages - {totalRects} redactions</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.9rem 0' }}>
            <button className="btn btn-outline" onClick={() => setSelectedPage((page) => Math.max(1, page - 1))} disabled={selectedPage <= 1}>
              Prev
            </button>
            <button className="btn btn-outline" onClick={() => setSelectedPage((page) => Math.min(pageCount, page + 1))} disabled={selectedPage >= pageCount}>
              Next
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>Page</label>
              <input
                type="number"
                min={1}
                max={pageCount}
                value={selectedPage}
                onChange={(event) => setSelectedPage(clamp(Number(event.target.value || 1), 1, pageCount))}
                style={{ width: '5rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 1.3fr)', gap: '1rem' }}>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <p className="tool-info-desc" style={{ marginBottom: 0 }}>
                Drag to mark a sensitive area on the preview. Boxes are stored per page.
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn btn-outline" onClick={undoLast} disabled={!currentRects.length}>
                  Undo last
                </button>
                <button className="btn btn-outline" onClick={clearCurrentPage} disabled={!currentRects.length}>
                  Clear page
                </button>
                <button className="btn btn-outline" onClick={clearAll} disabled={!totalRects}>
                  Clear all
                </button>
              </div>

              <div style={{ padding: '0.85rem', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg2)' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Current page</div>
                <div style={{ color: 'var(--text3)', fontSize: '0.92rem' }}>{currentRects.length} redactions on this page</div>
              </div>
            </div>

            <div
              style={{
                position: 'relative',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#111',
                minHeight: '280px',
                touchAction: 'none',
              }}
            >
              <canvas ref={previewCanvasRef} style={{ width: '100%', display: 'block' }} />
              <canvas
                ref={overlayCanvasRef}
                onPointerDown={beginDraw}
                onPointerMove={updateDraw}
                onPointerUp={endDraw}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  cursor: 'crosshair',
                }}
              />
              {!previewSize.width && (
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--text3)', background: 'rgba(0, 0, 0, 0.12)' }}>
                  {isRendering ? 'Rendering preview...' : 'Preview will appear here'}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={exportRedactedPdf} disabled={isProcessing || !totalRects}>
              {isProcessing ? 'Exporting...' : 'Export redacted PDF'}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => {
                setFile(null);
                setPdfBytes(null);
                setPreviewSize({ width: 0, height: 0 });
                setRectanglesByPage({});
                setSelectedPage(1);
                setError('');
                if (resultUrl) {
                  URL.revokeObjectURL(resultUrl);
                  setResultUrl(null);
                }
              }}
            >
              Reset
            </button>
          </div>

          {createElement(ToolProgressBar, {
            active: isRendering || isProcessing,
            label: isProcessing ? 'Burning redactions into PDF...' : 'Rendering preview...',
            value: isProcessing ? progress : undefined,
          })}
        </div>
      )}

      {error && <p className="text-danger" style={{ marginTop: '0.9rem', fontWeight: 600 }}>{error}</p>}

      {resultUrl && (
        <div className="tool-result-box fade-in">
          <div className="tool-result-title">Redacted PDF ready</div>
          <p className="tool-result-meta">Output size: <strong style={{ color: 'var(--success)' }}>{formatSize(resultSize)}</strong></p>
          <div className="tool-result-actions">
            <button className="btn btn-primary" onClick={downloadResult}>Download redacted PDF</button>
            <button
              className="btn btn-outline"
              onClick={() => {
                setFile(null);
                setPdfBytes(null);
                setRectanglesByPage({});
                if (resultUrl) {
                  URL.revokeObjectURL(resultUrl);
                  setResultUrl(null);
                }
              }}
            >
              Redact another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RedactPdf;
