import { useEffect, useRef, useState, useCallback } from 'react';

const RENDER_SCALE = 2;

export default function PageCanvas({
  pdfDoc,
  pageIndex,
  annotations,
  activeTool,
  activeColor,
  fontSize,
  onAddAnnotation,
  onUpdateAnnotation,
  onSelectAnnotation,
  selectedAnnotation,
}) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [viewport, setViewport] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);

  // Render PDF page to canvas
  useEffect(() => {
    if (!pdfDoc) return;
    let cancelled = false;

    const render = async () => {
      const page = await pdfDoc.getPage(pageIndex + 1);
      const vp = page.getViewport({ scale: RENDER_SCALE });
      const displayVp = page.getViewport({ scale: 1 });

      if (cancelled) return;
      setViewport(displayVp);

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = vp.width;
      canvas.height = vp.height;
      canvas.style.width = `${displayVp.width}px`;
      canvas.style.height = `${displayVp.height}px`;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, vp.width, vp.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
    };

    render();
    return () => { cancelled = true; };
  }, [pdfDoc, pageIndex]);

  const getRelativePos = useCallback((e) => {
    const rect = overlayRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (activeTool === 'select') return;
    if (e.button !== 0) return;

    const pos = getRelativePos(e);

    if (activeTool === 'text') {
      onAddAnnotation({
        type: 'text',
        pageIndex,
        x: pos.x,
        y: pos.y,
        content: '',
        color: activeColor,
        fontSize,
        width: 200,
        height: 30,
        editing: true,
      });
      return;
    }

    if (activeTool === 'sticky') {
      onAddAnnotation({
        type: 'sticky',
        pageIndex,
        x: pos.x,
        y: pos.y,
        content: '',
        color: activeColor,
        width: 180,
        height: 120,
        editing: true,
      });
      return;
    }

    // highlight, underline, strikethrough — drag to create
    setDragStart(pos);
    setDragCurrent(pos);
  }, [activeTool, activeColor, fontSize, pageIndex, onAddAnnotation, getRelativePos]);

  const handleMouseMove = useCallback((e) => {
    if (!dragStart) return;
    setDragCurrent(getRelativePos(e));
  }, [dragStart, getRelativePos]);

  const handleMouseUp = useCallback(() => {
    if (!dragStart || !dragCurrent) {
      setDragStart(null);
      setDragCurrent(null);
      return;
    }

    const x = Math.min(dragStart.x, dragCurrent.x);
    const y = Math.min(dragStart.y, dragCurrent.y);
    const width = Math.abs(dragCurrent.x - dragStart.x);
    const height = Math.abs(dragCurrent.y - dragStart.y);

    if (width > 5 || height > 5) {
      onAddAnnotation({
        type: activeTool,
        pageIndex,
        x,
        y,
        width,
        height: activeTool === 'highlight' ? Math.max(height, 20) : height,
        color: activeColor,
      });
    }

    setDragStart(null);
    setDragCurrent(null);
  }, [dragStart, dragCurrent, activeTool, activeColor, pageIndex, onAddAnnotation]);

  const pageAnnotations = annotations.filter((a) => a.pageIndex === pageIndex);

  // Preview rect while dragging
  const dragRect = dragStart && dragCurrent ? {
    x: Math.min(dragStart.x, dragCurrent.x),
    y: Math.min(dragStart.y, dragCurrent.y),
    width: Math.abs(dragCurrent.x - dragStart.x),
    height: Math.abs(dragCurrent.y - dragStart.y),
  } : null;

  return (
    <div className="page-canvas-wrapper" style={viewport ? { width: viewport.width, height: viewport.height } : {}}>
      <canvas ref={canvasRef} className="page-canvas" />
      <div
        ref={overlayRef}
        className="page-overlay"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={viewport ? { width: viewport.width, height: viewport.height } : {}}
      >
        {pageAnnotations.map((ann) => (
          <AnnotationElement
            key={ann.id}
            annotation={ann}
            isSelected={selectedAnnotation === ann.id}
            onSelect={() => onSelectAnnotation(ann.id)}
            onUpdate={(updates) => onUpdateAnnotation(ann.id, updates)}
          />
        ))}

        {dragRect && dragRect.width > 2 && (
          <div
            className={`drag-preview drag-preview-${activeTool}`}
            style={{
              left: dragRect.x,
              top: dragRect.y,
              width: dragRect.width,
              height: dragRect.height,
              background: activeTool === 'highlight' ? activeColor + '50' : 'transparent',
              borderBottom: activeTool === 'underline' ? `3px solid ${activeColor}` : undefined,
              position: 'absolute',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </div>
  );
}

function AnnotationElement({ annotation, isSelected, onSelect, onUpdate }) {
  const { type, x, y, width, height, color, content, fontSize, editing } = annotation;
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  if (type === 'text') {
    return (
      <div
        className={`annotation annotation-text${isSelected ? ' selected' : ''}`}
        style={{ left: x, top: y, minWidth: width, color: '#000', fontSize: fontSize || 14 }}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        {editing ? (
          <textarea
            ref={inputRef}
            className="annotation-input text-input"
            value={content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            onBlur={() => onUpdate({ editing: false })}
            onKeyDown={(e) => { if (e.key === 'Escape') onUpdate({ editing: false }); }}
            style={{ fontSize: fontSize || 14, color: color || '#000' }}
            placeholder="Type here..."
          />
        ) : (
          <div
            className="annotation-text-content"
            style={{ color: color || '#000', fontSize: fontSize || 14 }}
            onDoubleClick={() => onUpdate({ editing: true })}
          >
            {content || 'Double-click to edit'}
          </div>
        )}
      </div>
    );
  }

  if (type === 'sticky') {
    return (
      <div
        className={`annotation annotation-sticky${isSelected ? ' selected' : ''}`}
        style={{ left: x, top: y, width, minHeight: height, background: color || '#fde047' }}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        <div className="sticky-header">Note</div>
        {editing ? (
          <textarea
            ref={inputRef}
            className="annotation-input sticky-input"
            value={content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            onBlur={() => onUpdate({ editing: false })}
            onKeyDown={(e) => { if (e.key === 'Escape') onUpdate({ editing: false }); }}
            placeholder="Write a note..."
          />
        ) : (
          <div
            className="sticky-content"
            onDoubleClick={() => onUpdate({ editing: true })}
          >
            {content || 'Double-click to edit'}
          </div>
        )}
      </div>
    );
  }

  if (type === 'highlight') {
    return (
      <div
        className={`annotation annotation-highlight${isSelected ? ' selected' : ''}`}
        style={{
          left: x, top: y, width, height,
          background: (color || '#fde047') + '50',
          borderRadius: 2,
        }}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      />
    );
  }

  if (type === 'underline') {
    return (
      <div
        className={`annotation annotation-underline${isSelected ? ' selected' : ''}`}
        style={{
          left: x, top: y + height, width, height: 0,
          borderBottom: `3px solid ${color || '#f87171'}`,
        }}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      />
    );
  }

  if (type === 'strikethrough') {
    return (
      <div
        className={`annotation annotation-strikethrough${isSelected ? ' selected' : ''}`}
        style={{
          left: x, top: y + height / 2, width, height: 0,
          borderBottom: `3px solid ${color || '#f87171'}`,
        }}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      />
    );
  }

  return null;
}
