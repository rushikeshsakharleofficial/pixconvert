import { useEffect, useRef, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import DropZone from './DropZone';
import ToolProgressBar from './ToolProgressBar';
import formatSize from '../utils/formatSize';
import { useFileTool } from '../hooks/useFileTool';
import { readFile, loadImg } from '../utils/fileHelpers';
import PdfInteractivePreview from './PdfInteractivePreview';

const DRAW_WIDTH = 480;
const DRAW_HEIGHT = 180;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const dataUrlToUint8Array = (dataUrl) => {
  const base64 = dataUrl.split(',')[1];
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const makeTypedSignature = async (text) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create a canvas for the typed signature.');

  const fontSize = 54;
  ctx.font = `${fontSize}px "Brush Script MT", "Segoe Script", cursive`;
  const metrics = ctx.measureText(text || 'Signature');
  const paddingX = 32;
  const paddingY = 26;
  canvas.width = Math.ceil(metrics.width + paddingX * 2);
  canvas.height = fontSize + paddingY * 2;

  const drawCtx = canvas.getContext('2d');
  if (!drawCtx) throw new Error('Could not render the typed signature.');
  drawCtx.clearRect(0, 0, canvas.width, canvas.height);
  drawCtx.font = `${fontSize}px "Brush Script MT", "Segoe Script", cursive`;
  drawCtx.fillStyle = '#111111';
  drawCtx.textBaseline = 'middle';
  drawCtx.fillText(text || 'Signature', paddingX, canvas.height / 2 + 6);

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height,
  };
};

const SignPdf = () => {
  const {
    file,
    pdfBytes,
    resultUrl, setResultUrl,
    isProcessing, setIsProcessing,
    error, setError,
    reset,
    setFileWithBytes
  } = useFileTool();

  const drawRef = useRef(null);
  const ctxRef = useRef(null);
  const drawingStateRef = useRef({ active: false, x: 0, y: 0 });

  const [pageCount, setPageCount] = useState(0);
  const [selectedPage, setSelectedPage] = useState(1);
  const [signatureMode, setSignatureMode] = useState('draw');
  const [typedSignature, setTypedSignature] = useState('Rishi');
  const [uploadedSignature, setUploadedSignature] = useState('');
  const [drawnSignatureUrl, setDrawnSignatureUrl] = useState('');
  const [placement, setPlacement] = useState({ x: 0.5, y: 0.55, width: 0.34 });
  const [resultSize, setResultSize] = useState(0);
  const [applyToAll, setApplyToAll] = useState(false);

  useEffect(() => {
    const canvas = drawRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    ctxRef.current = ctx;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 3;
    setDrawnSignatureUrl(canvas.toDataURL('image/png'));
    return undefined;
  }, []);

  const handleFiles = async (files) => {
    if (!files.length) return;
    const nextFile = files[0];

    try {
      await setFileWithBytes(nextFile);
      const bytes = new Uint8Array(await nextFile.arrayBuffer());
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });

      setPageCount(pdfDoc.getPageCount());
      setSelectedPage(1);
      setPlacement({ x: 0.5, y: 0.55, width: 0.34 });
      setResultUrl(null);
    } catch (err) {
      console.error(err);
      setError('Could not open that PDF. Please choose a valid file.');
    }
  };

  const getDrawPoint = (event) => {
    const canvas = drawRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (event) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const point = getDrawPoint(event);
    drawingStateRef.current = { active: true, x: point.x, y: point.y };
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const continueDrawing = (event) => {
    if (!drawingStateRef.current.active) return;
    const ctx = ctxRef.current;
    if (!ctx) return;

    const point = getDrawPoint(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    drawingStateRef.current = { active: true, x: point.x, y: point.y };
  };

  const stopDrawing = () => {
    const canvas = drawRef.current;
    if (canvas) {
      setDrawnSignatureUrl(canvas.toDataURL('image/png'));
    }
    drawingStateRef.current = { active: false, x: 0, y: 0 };
  };

  const clearDrawnSignature = () => {
    const ctx = ctxRef.current;
    const canvas = drawRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setDrawnSignatureUrl(canvas.toDataURL('image/png'));
  };

  const handleSignatureUpload = async (files) => {
    if (!files.length) return;
    try {
      const dataUrl = await readFile(files[0]);
      setUploadedSignature(dataUrl);
      setSignatureMode('upload');
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load the uploaded signature image.');
    }
  };

  const handlePointSelect = ({ x, y }) => {
    setPlacement((prev) => ({ 
      ...prev, 
      x: clamp(x, 0.02, 0.98), 
      y: clamp(y, 0.02, 0.98) 
    }));
  };

  const buildSignatureAsset = async () => {
    if (signatureMode === 'draw') {
      const canvas = drawRef.current;
      if (!canvas) throw new Error('Signature pad is not ready.');
      return {
        dataUrl: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height,
      };
    }

    if (signatureMode === 'type') {
      if (!typedSignature.trim()) {
        throw new Error('Enter the name you want to place as a signature.');
      }
      return makeTypedSignature(typedSignature.trim());
    }

    if (!uploadedSignature) {
      throw new Error('Upload a signature image first.');
    }

    const image = await loadImg(uploadedSignature);
    return {
      dataUrl: uploadedSignature,
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  };

  const handleReset = () => {
    reset();
    setPageCount(0);
    setSelectedPage(1);
    setSignatureMode('draw');
    setTypedSignature('Rishi');
    setUploadedSignature('');
    setPlacement({ x: 0.5, y: 0.55, width: 0.34 });
    setResultSize(0);
    setApplyToAll(false);
    clearDrawnSignature();
  };

  const exportSignedPdf = async () => {
    if (!pdfBytes || !file) return;

    setIsProcessing(true);
    setError('');

    try {
      const signatureAsset = await buildSignatureAsset();
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

      const imageBytes = dataUrlToUint8Array(signatureAsset.dataUrl);
      const image = signatureAsset.dataUrl.startsWith('data:image/jpeg')
        ? await pdfDoc.embedJpg(imageBytes)
        : await pdfDoc.embedPng(imageBytes);

      const pagesToSign = applyToAll
        ? pdfDoc.getPages()
        : [pdfDoc.getPage(selectedPage - 1)];

      pagesToSign.forEach((page) => {
        const pageSize = page.getSize();
        const signatureWidth = pageSize.width * placement.width;
        const signatureHeight = signatureWidth * (signatureAsset.height / signatureAsset.width);
        const x = pageSize.width * placement.x - signatureWidth / 2;
        const y = pageSize.height * (1 - placement.y) - signatureHeight / 2;

        page.drawImage(image, {
          x: clamp(x, 0, Math.max(pageSize.width - signatureWidth, 0)),
          y: clamp(y, 0, Math.max(pageSize.height - signatureHeight, 0)),
          width: signatureWidth,
          height: signatureHeight,
        });
      });

      const outputBytes = await pdfDoc.save();
      const blob = new Blob([outputBytes], { type: 'application/pdf' });

      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to place the signature on the PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultUrl || !file) return;
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `${file.name.replace(/\.pdf$/i, '')}-signed.pdf`;
    link.click();
  };

  return (
    <div>
      <div className="tool-info-bar">
        <p className="tool-info-desc">
          Sign a PDF directly in your browser. Draw, type, or upload a signature image, place it on a page preview, and export a signed copy.
        </p>
        <div className="tool-feats">
          <span className="tool-feat hi">Draw, type, or upload</span>
          <span className="tool-feat ok">Page preview placement</span>
          <span className="tool-feat ok">Private client-side export</span>
          <span className="tool-feat ok">No upload required</span>
        </div>
      </div>

      <DropZone
        onFiles={handleFiles}
        multiple={false}
        accept="application/pdf,.pdf"
        label="Drop a PDF here or click to browse"
      />

      {file && (
        <div className="tool-info-bar fade-in" style={{ marginTop: '1.25rem', gap: '1.25rem' }}>
          <div className="tool-file-info" style={{ margin: 0 }}>
            <span className="file-icon">PDF</span>
            <div>
              <div className="tool-file-name">{file.name}</div>
              <div className="tool-file-size">{formatSize(file.size)} - {pageCount} pages</div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'minmax(280px, 420px) minmax(320px, 1fr)' }}>
            <div style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Signature source</label>
                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <button className={`btn ${signatureMode === 'draw' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSignatureMode('draw')}>Draw</button>
                  <button className={`btn ${signatureMode === 'type' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSignatureMode('type')}>Type</button>
                  <button className={`btn ${signatureMode === 'upload' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSignatureMode('upload')}>Upload</button>
                </div>
              </div>

              {signatureMode === 'draw' && (
                <div style={{ display: 'grid', gap: '0.65rem' }}>
                  <canvas
                    ref={drawRef}
                    width={DRAW_WIDTH}
                    height={DRAW_HEIGHT}
                    onPointerDown={startDrawing}
                    onPointerMove={continueDrawing}
                    onPointerUp={stopDrawing}
                    onPointerLeave={stopDrawing}
                    style={{
                      width: '100%',
                      maxWidth: '420px',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      background: '#ffffff',
                      touchAction: 'none',
                      cursor: 'crosshair',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-outline btn-sm" onClick={clearDrawnSignature}>Clear signature</button>
                  </div>
                </div>
              )}

              {signatureMode === 'type' && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Typed signature</label>
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={(event) => setTypedSignature(event.target.value)}
                    placeholder="Enter the signer name"
                  />
                </div>
              )}

              {signatureMode === 'upload' && (
                <div style={{ display: 'grid', gap: '0.85rem' }}>
                  <DropZone
                    onFiles={handleSignatureUpload}
                    multiple={false}
                    accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                    label="Drop a signature image here"
                  />
                  {uploadedSignature && (
                    <div style={{ border: '1px solid var(--border)', borderRadius: '12px', background: '#ffffff', padding: '0.75rem' }}>
                      <img src={uploadedSignature} alt="Uploaded signature preview" style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain' }} />
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gap: '0.85rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>{applyToAll ? 'Preview Page' : 'Page'}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <select value={selectedPage} onChange={(event) => setSelectedPage(Number(event.target.value))} style={{ minWidth: '120px' }}>
                      {Array.from({ length: pageCount }, (_, index) => (
                        <option key={index + 1} value={index + 1}>
                          Page {index + 1}
                        </option>
                      ))}
                    </select>
                    <label 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        cursor: pageCount <= 1 ? 'not-allowed' : 'pointer', 
                        fontWeight: 600,
                        opacity: pageCount <= 1 ? 0.6 : 1
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={applyToAll}
                        onChange={(e) => setApplyToAll(e.target.checked)}
                        disabled={pageCount <= 1}
                      />
                      Apply to all pages
                    </label>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Signature width: {Math.round(placement.width * 100)}%</label>
                  <input
                    type="range"
                    min="12"
                    max="70"
                    value={Math.round(placement.width * 100)}
                    onChange={(event) => setPlacement((prev) => ({ ...prev, width: Number(event.target.value) / 100 }))}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <p className="tool-info-desc" style={{ marginBottom: 0, fontSize: '0.9rem' }}>
                Click the preview to place the signature.
              </p>
              
              <PdfInteractivePreview
                pdfBytes={pdfBytes}
                page={selectedPage}
                onPointSelect={handlePointSelect}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: `${placement.x * 100}%`,
                    top: `${placement.y * 100}%`,
                    width: `${placement.width * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                  }}
                >
                  {signatureMode === 'upload' && uploadedSignature ? (
                    <img src={uploadedSignature} alt="Signature placement preview" style={{ width: '100%', display: 'block', objectFit: 'contain' }} />
                  ) : signatureMode === 'type' ? (
                    <div style={{ width: '100%', textAlign: 'center', fontSize: 'clamp(1.6rem, 4vw, 3rem)', color: '#111111', fontFamily: '"Brush Script MT", "Segoe Script", cursive' }}>
                      {typedSignature || 'Signature'}
                    </div>
                  ) : (
                    <img src={drawnSignatureUrl} alt="Drawn signature placement preview" style={{ width: '100%', display: 'block', opacity: 0.88 }} />
                  )}
                </div>
              </PdfInteractivePreview>

              <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <button className="btn btn-primary" onClick={exportSignedPdf} disabled={isProcessing || !pdfBytes}>
                  {isProcessing ? 'Signing...' : 'Export signed PDF'}
                </button>
                <button
                  className="btn btn-outline"
                  onClick={handleReset}
                >
                  Reset
                </button>
              </div>
              <ToolProgressBar active={isProcessing} label="Embedding signature..." />
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-danger" style={{ marginTop: '1rem', fontWeight: 600 }}>{error}</p>}

      {resultUrl && (
        <div className="tool-result-box fade-in">
          <div className="tool-result-title">Signed PDF ready</div>
          <p className="tool-result-meta">Output size: <strong style={{ color: 'var(--success)' }}>{formatSize(resultSize)}</strong></p>
          <div className="tool-result-actions">
            <button className="btn btn-primary" onClick={downloadResult}>Download signed PDF</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignPdf;
