import { useEffect, useState } from 'react';
import { rasterizePage } from '../utils/pdfRasterizer';
import BoxLoader from './ui/box-loader';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * PdfInteractivePreview
 * 
 * Consolidates PDF page rendering and coordinate mapping (0..1 system).
 * 
 * @param {Uint8Array} pdfBytes - The PDF bytes to render.
 * @param {number} page - The 1-indexed page number to preview.
 * @param {Function} onPointSelect - Callback when the preview is clicked. Receives {x, y} normalized (0..1).
 * @param {Function} onPointerDown - Optional pointer down handler. Receives {x, y, event}.
 * @param {Function} onPointerMove - Optional pointer move handler. Receives {x, y, event}.
 * @param {Function} onPointerUp - Optional pointer up handler. Receives {x, y, event}.
 * @param {React.ReactNode} children - Overlay content to render inside the relative container.
 * @param {string} [cursor='crosshair'] - The cursor style for the preview container.
 * @param {boolean} [isBusy=false] - Optional override for the busy state.
 */
const PdfInteractivePreview = ({ 
  pdfBytes, 
  page, 
  onPointSelect, 
  onPointerDown,
  onPointerMove,
  onPointerUp,
  children, 
  cursor = 'crosshair',
  isBusy = false 
}) => {
  const [previewUrl, setPreviewUrl] = useState('');
  const [internalBusy, setInternalBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!pdfBytes || !page) {
      setPreviewUrl('');
      return undefined;
    }
    let cancelled = false;

    const renderPreview = async () => {
      setInternalBusy(true);
      setError('');
      try {
        const canvas = await rasterizePage(pdfBytes, page, { scale: 1.3, useDPR: false });
        if (!cancelled) {
          setPreviewUrl(canvas.toDataURL('image/png'));
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError('Failed to render the PDF preview.');
        }
      } finally {
        if (!cancelled) setInternalBusy(false);
      }
    };

    renderPreview();
    return () => {
      cancelled = true;
    };
  }, [pdfBytes, page]);

  const getNormalizedPoint = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
      y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
    };
  };

  const handlePointerDown = (event) => {
    if (onPointerDown && previewUrl) {
      const { x, y } = getNormalizedPoint(event);
      onPointerDown({ x, y, event });
    }
  };

  const handlePointerMove = (event) => {
    if (onPointerMove && previewUrl) {
      const { x, y } = getNormalizedPoint(event);
      onPointerMove({ x, y, event });
    }
  };

  const handlePointerUp = (event) => {
    if (onPointerUp && previewUrl) {
      const { x, y } = getNormalizedPoint(event);
      onPointerUp({ x, y, event });
    }
    if (onPointSelect && previewUrl) {
      const { x, y } = getNormalizedPoint(event);
      onPointSelect({ x, y });
    }
  };

  const busy = isBusy || internalBusy;

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'relative',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background: (busy || !previewUrl) ? 'var(--bg2)' : '#ffffff',
        minHeight: '280px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: (busy || !previewUrl) ? 'default' : cursor,
        touchAction: 'none',
      }}
    >
      {previewUrl ? (
        <>
          <img 
            src={previewUrl} 
            alt={`Preview of page ${page}`} 
            style={{ width: '100%', display: 'block', pointerEvents: 'none' }} 
          />
          {children}
        </>
      ) : (
        <div style={{ color: 'var(--text3)', fontSize: '0.95rem' }}>
          {error ? error : (busy ? <BoxLoader /> : 'Preview will appear here.')}
        </div>
      )}
    </div>
  );
};

export default PdfInteractivePreview;
