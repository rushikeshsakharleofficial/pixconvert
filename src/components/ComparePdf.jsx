import { useEffect, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import pixelmatch from 'pixelmatch';
import DropZone from './DropZone';
import ToolProgressBar from './ToolProgressBar';
import formatSize from '../utils/formatSize';
import { rasterizePage } from '../utils/pdfRasterizer';
import { useFileTool } from '../hooks/useFileTool';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const canvasToObjectUrl = (canvas) =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not create an image preview.'));
        return;
      }
      resolve(URL.createObjectURL(blob));
    }, 'image/png');
  });

const fitCanvasToBox = (sourceCanvas, width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not create a comparison canvas.');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const scale = Math.min(width / sourceCanvas.width, height / sourceCanvas.height);
  const drawWidth = Math.round(sourceCanvas.width * scale);
  const drawHeight = Math.round(sourceCanvas.height * scale);
  const drawX = Math.round((width - drawWidth) / 2);
  const drawY = Math.round((height - drawHeight) / 2);

  ctx.drawImage(sourceCanvas, drawX, drawY, drawWidth, drawHeight);
  return canvas;
};

const buildDiffCanvas = (leftCanvas, rightCanvas) => {
  const width = Math.max(leftCanvas.width, rightCanvas.width);
  const height = Math.max(leftCanvas.height, rightCanvas.height);
  const left = fitCanvasToBox(leftCanvas, width, height);
  const right = fitCanvasToBox(rightCanvas, width, height);

  const leftCtx = left.getContext('2d', { willReadFrequently: true });
  const rightCtx = right.getContext('2d', { willReadFrequently: true });
  if (!leftCtx || !rightCtx) throw new Error('Could not read canvas pixels.');

  const leftPixels = leftCtx.getImageData(0, 0, width, height);
  const rightPixels = rightCtx.getImageData(0, 0, width, height);
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width;
  diffCanvas.height = height;
  const diffCtx = diffCanvas.getContext('2d', { willReadFrequently: true });
  if (!diffCtx) throw new Error('Could not create a diff canvas.');

  const diffPixels = diffCtx.createImageData(width, height);

  const changedPixels = pixelmatch(
    leftPixels.data,
    rightPixels.data,
    diffPixels.data,
    width,
    height,
    { threshold: 0.12, includeAA: false }
  );

  diffCtx.putImageData(diffPixels, 0, 0);

  return {
    leftCanvas: left,
    rightCanvas: right,
    diffCanvas,
    changedPixels,
    totalPixels: width * height,
    width,
    height,
  };
};

const ComparePdf = () => {
  const toolA = useFileTool();
  const toolB = useFileTool();

  const [pageCountA, setPageCountA] = useState(0);
  const [pageCountB, setPageCountB] = useState(0);
  const [pageA, setPageA] = useState(1);
  const [pageB, setPageB] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (toolA.pdfBytes) {
      PDFDocument.load(toolA.pdfBytes, { ignoreEncryption: true }).then(doc => {
        setPageCountA(doc.getPageCount());
        setPageA(1);
      });
    } else {
      setPageCountA(0);
      setPageA(1);
    }
    setResult(null);
  }, [toolA.pdfBytes]);

  useEffect(() => {
    if (toolB.pdfBytes) {
      PDFDocument.load(toolB.pdfBytes, { ignoreEncryption: true }).then(doc => {
        setPageCountB(doc.getPageCount());
        setPageB(1);
      });
    } else {
      setPageCountB(0);
      setPageB(1);
    }
    setResult(null);
  }, [toolB.pdfBytes]);

  useEffect(() => {
    return () => {
      if (!result) return;
      URL.revokeObjectURL(result.leftUrl);
      URL.revokeObjectURL(result.rightUrl);
      URL.revokeObjectURL(result.diffUrl);
    };
  }, [result]);

  const resetResult = () => {
    if (result) {
      URL.revokeObjectURL(result.leftUrl);
      URL.revokeObjectURL(result.rightUrl);
      URL.revokeObjectURL(result.diffUrl);
    }
    setResult(null);
  };

  const handleFilesA = (files) => {
    if (files[0]) toolA.setFileWithBytes(files[0]);
    resetResult();
  };

  const handleFilesB = (files) => {
    if (files[0]) toolB.setFileWithBytes(files[0]);
    resetResult();
  };

  const comparePages = async () => {
    if (!toolA.pdfBytes || !toolB.pdfBytes) return;

    const comparePageA = clamp(pageA, 1, pageCountA || 1);
    const comparePageB = clamp(pageB, 1, pageCountB || 1);
    
    toolA.setIsProcessing(true);
    toolB.setIsProcessing(true);
    setProgress(5);
    toolA.setError('');
    resetResult();

    try {
      const [renderA, renderB] = await Promise.all([
        rasterizePage(toolA.pdfBytes, comparePageA, { scale: 1.5, useDPR: false }),
        rasterizePage(toolB.pdfBytes, comparePageB, { scale: 1.5, useDPR: false }),
      ]);
      setProgress(55);

      const diff = buildDiffCanvas(renderA, renderB);
      setProgress(80);

      const [leftUrl, rightUrl, diffUrl] = await Promise.all([
        canvasToObjectUrl(diff.leftCanvas),
        canvasToObjectUrl(diff.rightCanvas),
        canvasToObjectUrl(diff.diffCanvas),
      ]);

      setResult({
        pageA: comparePageA,
        pageB: comparePageB,
        leftUrl,
        rightUrl,
        diffUrl,
        leftRenderSize: `${diff.leftCanvas.width} x ${diff.leftCanvas.height}`,
        rightRenderSize: `${diff.rightCanvas.width} x ${diff.rightCanvas.height}`,
        diffSize: `${diff.width} x ${diff.height}`,
        changedPixels: diff.changedPixels,
        totalPixels: diff.totalPixels,
        changedPercent: diff.totalPixels ? ((diff.changedPixels / diff.totalPixels) * 100).toFixed(2) : '0.00',
      });
      setProgress(100);
    } catch (err) {
      console.error(err);
      toolA.setError(err.message || 'Failed to compare the selected pages.');
    } finally {
      toolA.setIsProcessing(false);
      toolB.setIsProcessing(false);
      setTimeout(() => setProgress(0), 700);
    }
  };

  const resetAll = () => {
    toolA.reset();
    toolB.reset();
    setPageCountA(0);
    setPageCountB(0);
    setPageA(1);
    setPageB(1);
    setZoom(100);
    resetResult();
  };

  const canCompare = Boolean(toolA.pdfBytes && toolB.pdfBytes);
  const isProcessing = toolA.isProcessing || toolB.isProcessing;
  const hasPageMismatch = pageCountA > 0 && pageCountB > 0 && pageCountA !== pageCountB;

  return (
    <div>
      <div className="tool-info-bar">
        <p className="tool-info-desc">
          Upload two PDFs, compare the same page from each, and get a visual diff entirely in the browser.
        </p>
        <div className="tool-feats">
          <span className="tool-feat hi">Side-by-side preview</span>
          <span className="tool-feat ok">Shared zoom control</span>
          <span className="tool-feat ok">Canvas-based diff</span>
          <span className="tool-feat ok">Private client-side processing</span>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <DropZone onFiles={handleFilesA} multiple={false} accept=".pdf,application/pdf" label="Drop PDF A here or click to browse" />
          <DropZone onFiles={handleFilesB} multiple={false} accept=".pdf,application/pdf" label="Drop PDF B here or click to browse" />
        </div>

        {(toolA.file || toolB.file) && (
          <div className="tool-info-bar fade-in" style={{ gap: '1.1rem' }}>
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div className="tool-file-info" style={{ margin: 0 }}>
                <span className="file-icon">A</span>
                <div>
                  <div className="tool-file-name">{toolA.file?.name || 'Waiting for PDF A'}</div>
                  <div className="tool-file-size">{toolA.file ? formatSize(toolA.file.size) : 'No file selected'}</div>
                </div>
              </div>
              <div className="tool-file-info" style={{ margin: 0 }}>
                <span className="file-icon">B</span>
                <div>
                  <div className="tool-file-name">{toolB.file?.name || 'Waiting for PDF B'}</div>
                  <div className="tool-file-size">{toolB.file ? formatSize(toolB.file.size) : 'No file selected'}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Page A (of {pageCountA || 1})</label>
                <input
                  type="number"
                  min="1"
                  max={pageCountA || 1}
                  value={pageA}
                  onChange={(event) => setPageA(clamp(Number(event.target.value) || 1, 1, pageCountA || 1))}
                  disabled={!toolA.file}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Page B (of {pageCountB || 1})</label>
                <input
                  type="number"
                  min="1"
                  max={pageCountB || 1}
                  value={pageB}
                  onChange={(event) => setPageB(clamp(Number(event.target.value) || 1, 1, pageCountB || 1))}
                  disabled={!toolB.file}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Zoom: {zoom}%</label>
                <input
                  type="range"
                  min="75"
                  max="200"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <button className="btn btn-primary" onClick={comparePages} disabled={!canCompare || isProcessing}>
                {isProcessing ? 'Comparing...' : 'Compare pages'}
              </button>
              <button className="btn btn-outline" onClick={resetAll}>
                Reset
              </button>
            </div>

            <ToolProgressBar active={isProcessing} label="Rendering and diffing pages..." value={progress} />

            {hasPageMismatch && (
              <p className="text-danger" style={{ marginBottom: 0, fontWeight: 600, fontSize: '0.9rem' }}>
                Note: Page counts differ. Comparison works best on similar documents.
              </p>
            )}
          </div>
        )}

        {(toolA.error || toolB.error) && <p className="text-danger" style={{ marginTop: '0.25rem', fontWeight: 600 }}>{toolA.error || toolB.error}</p>}

        {result && (
          <div className="tool-info-bar fade-in" style={{ gap: '1rem' }}>
            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div className="tool-result-box" style={{ margin: 0 }}>
                <div className="tool-result-title">Comparison stats</div>
                <p className="tool-result-meta" style={{ marginBottom: 0 }}>Page A: <strong>{result.pageA}</strong></p>
                <p className="tool-result-meta" style={{ marginBottom: 0 }}>Page B: <strong>{result.pageB}</strong></p>
                <p className="tool-result-meta" style={{ marginBottom: 0 }}>Changed pixels: <strong>{result.changedPixels.toLocaleString()}</strong></p>
                <p className="tool-result-meta" style={{ marginBottom: 0 }}>Diff coverage: <strong>{result.changedPercent}%</strong></p>
              </div>
              <div className="tool-result-box" style={{ margin: 0 }}>
                <div className="tool-result-title">Raster sizes</div>
                <p className="tool-result-meta" style={{ marginBottom: 0 }}>File A: <strong>{result.leftRenderSize}</strong></p>
                <p className="tool-result-meta" style={{ marginBottom: 0 }}>File B: <strong>{result.rightRenderSize}</strong></p>
                <p className="tool-result-meta" style={{ marginBottom: 0 }}>Diff: <strong>{result.diffSize}</strong></p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gap: '0.9rem',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                alignItems: 'start',
              }}
            >
              {[
                { label: 'File A', url: result.leftUrl, accent: 'var(--primary)' },
                { label: 'File B', url: result.rightUrl, accent: 'var(--success)' },
                { label: 'Diff', url: result.diffUrl, accent: 'var(--danger)' },
              ].map((pane) => (
                <div key={pane.label} className="glass" style={{ padding: '0.9rem', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <strong style={{ color: pane.accent }}>{pane.label}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>{zoom}%</span>
                  </div>
                  <div
                    style={{
                      overflow: 'auto',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: '#fff',
                      maxHeight: '70vh',
                    }}
                  >
                    <img
                      src={pane.url}
                      alt={`${pane.label} preview`}
                      style={{ display: 'block', width: `${zoom}%`, maxWidth: 'none' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparePdf;
