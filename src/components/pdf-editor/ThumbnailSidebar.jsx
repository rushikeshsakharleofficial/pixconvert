import { useEffect, useRef, useState } from 'react';

const THUMB_WIDTH = 120;

export default function ThumbnailSidebar({ pdfDoc, numPages, activePage, onPageSelect, sidebarOpen }) {
  // sidebarOpen controls visibility on mobile. On desktop the sidebar is always shown
  // (the existing CSS `@media (max-width: 480px) { .pdf-thumbnail-sidebar { display: none } }`
  // is overridden here when the user opens the panel via the toolbar toggle).
  // We use an inline style so it beats the media-query specificity.
  const sidebarStyle = sidebarOpen ? { display: 'flex' } : {};

  return (
    <div
      className="pdf-thumbnail-sidebar"
      style={sidebarStyle}
      role="navigation"
      aria-label="Page thumbnails"
    >
      <div className="thumbnail-header">Pages</div>
      <div className="thumbnail-list">
        {Array.from({ length: numPages }, (_, i) => (
          <Thumbnail
            key={i}
            pdfDoc={pdfDoc}
            pageIndex={i}
            isActive={activePage === i}
            onClick={() => onPageSelect(i)}
          />
        ))}
      </div>
    </div>
  );
}

function Thumbnail({ pdfDoc, pageIndex, isActive, onClick }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const renderedRef = useRef(false);
  const [isVisible, setIsVisible] = useState(false);

  // Lazy visibility detection
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { rootMargin: '100px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!pdfDoc || !isVisible || renderedRef.current) return;

    let cancelled = false;

    const render = async () => {
      try {
        const page = await pdfDoc.getPage(pageIndex + 1);
        const viewport = page.getViewport({ scale: THUMB_WIDTH / page.getViewport({ scale: 1 }).width });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) renderedRef.current = true;
      } catch {
        // silently skip failed thumbnail
      }
    };

    render();
    return () => { cancelled = true; };
  }, [pdfDoc, pageIndex, isVisible]);

  return (
    <button
      ref={wrapperRef}
      type="button"
      className={`thumbnail-item${isActive ? ' active' : ''}`}
      onClick={onClick}
      aria-label={`Page ${pageIndex + 1}`}
      aria-current={isActive ? 'page' : undefined}
      title={`Page ${pageIndex + 1}`}
    >
      <canvas ref={canvasRef} className="thumbnail-canvas" aria-hidden="true" />
      <span className="thumbnail-num">{pageIndex + 1}</span>
    </button>
  );
}
