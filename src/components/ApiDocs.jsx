import { useState } from 'react';

const TOOLS = [
  { cat: 'Organize PDF', items: [
    { path: '/merge-pdf', desc: 'Merge multiple PDFs into one', input: 'Multiple PDF files', curl: 'curl -X POST /api/v1/merge-pdf \\\n  -F "files=@doc1.pdf" \\\n  -F "files=@doc2.pdf" -o merged.pdf', params: [] },
    { path: '/split-pdf', desc: 'Split PDF into pages', input: 'Single PDF', curl: 'curl -X POST /api/v1/split-pdf \\\n  -F "files=@doc.pdf" \\\n  -F "pages=1-3,5" -o split.pdf', params: [{ name: 'pages', type: 'string', req: false, desc: 'Page range (e.g. "1-3,5,8"). Omit to split all.' }] },
    { path: '/remove-pages', desc: 'Remove pages from PDF', input: 'Single PDF', curl: 'curl -X POST /api/v1/remove-pages \\\n  -F "files=@doc.pdf" \\\n  -F "pages=2,4" -o result.pdf', params: [{ name: 'pages', type: 'string', req: true, desc: 'Pages to remove (e.g. "2,4,6")' }] },
    { path: '/extract-pages', desc: 'Extract specific pages', input: 'Single PDF', curl: 'curl -X POST /api/v1/extract-pages \\\n  -F "files=@doc.pdf" \\\n  -F "pages=1-3" -o extracted.pdf', params: [{ name: 'pages', type: 'string', req: true, desc: 'Pages to extract (e.g. "1-3,5")' }] },
    { path: '/organize-pdf', desc: 'Reorder PDF pages', input: 'Single PDF', curl: 'curl -X POST /api/v1/organize-pdf \\\n  -F "files=@doc.pdf" \\\n  -F "order=[2,0,1]" -o reordered.pdf', params: [{ name: 'order', type: 'JSON array', req: true, desc: '0-based page indices in desired order' }] },
    { path: '/scan-to-pdf', desc: 'Convert scanned images to PDF', input: 'Image file(s)', curl: 'curl -X POST /api/v1/scan-to-pdf \\\n  -F "files=@scan1.jpg" \\\n  -F "files=@scan2.jpg" -o scanned.pdf', params: [] },
  ]},
  { cat: 'Optimize PDF', items: [
    { path: '/compress-pdf', desc: 'Compress PDF file size', input: 'Single PDF', curl: 'curl -X POST /api/v1/compress-pdf \\\n  -F "files=@doc.pdf" \\\n  -F "quality=medium" -o small.pdf', params: [{ name: 'quality', type: 'string', req: false, desc: 'low | medium (default) | high' }] },
    { path: '/repair-pdf', desc: 'Repair damaged PDF', input: 'Single PDF', curl: 'curl -X POST /api/v1/repair-pdf \\\n  -F "files=@broken.pdf" -o fixed.pdf', params: [] },
    { path: '/ocr-pdf', desc: 'OCR text recognition', input: 'Single PDF/Image', curl: 'curl -X POST /api/v1/ocr-pdf \\\n  -F "files=@scan.pdf" \\\n  -F "lang=eng" \\\n  -F "format=pdf" -o searchable.pdf', params: [{ name: 'lang', type: 'string', req: false, desc: 'Language code (eng, fra, deu, spa...)' }, { name: 'format', type: 'string', req: false, desc: 'pdf (default) | txt' }] },
  ]},
  { cat: 'Convert to PDF', items: [
    { path: '/jpg-to-pdf', desc: 'Convert images to PDF', input: 'Image file(s)', curl: 'curl -X POST /api/v1/jpg-to-pdf \\\n  -F "files=@photo.jpg" \\\n  -F "orientation=portrait" \\\n  -F "margin=0" -o output.pdf', params: [{ name: 'orientation', type: 'string', req: false, desc: 'portrait (default) | landscape' }, { name: 'margin', type: 'number', req: false, desc: 'Margin in px (default: 0)' }] },
    { path: '/word-to-pdf', desc: 'Word document to PDF', input: '.doc/.docx', curl: 'curl -X POST /api/v1/word-to-pdf \\\n  -F "files=@doc.docx" -o output.pdf', params: [] },
    { path: '/powerpoint-to-pdf', desc: 'PowerPoint to PDF', input: '.ppt/.pptx', curl: 'curl -X POST /api/v1/powerpoint-to-pdf \\\n  -F "files=@slides.pptx" -o output.pdf', params: [] },
    { path: '/excel-to-pdf', desc: 'Excel spreadsheet to PDF', input: '.xls/.xlsx', curl: 'curl -X POST /api/v1/excel-to-pdf \\\n  -F "files=@sheet.xlsx" -o output.pdf', params: [] },
    { path: '/html-to-pdf', desc: 'HTML page to PDF', input: 'HTML file or URL', curl: 'curl -X POST /api/v1/html-to-pdf \\\n  -H "Content-Type: application/json" \\\n  -d \'{"htmlUrl":"https://example.com","format":"A4"}\' \\\n  -o page.pdf', params: [{ name: 'htmlUrl', type: 'string', req: false, desc: 'URL to convert (alt to file upload)' }, { name: 'format', type: 'string', req: false, desc: 'A4 (default) | Letter' }, { name: 'landscape', type: 'boolean', req: false, desc: 'Landscape mode (default: false)' }] },
  ]},
  { cat: 'Convert from PDF', items: [
    { path: '/pdf-to-jpg', desc: 'PDF pages to JPG images', input: 'Single PDF', curl: 'curl -X POST /api/v1/pdf-to-jpg \\\n  -F "files=@doc.pdf" \\\n  -F "dpi=200" \\\n  -F "quality=90" -o pages.zip', params: [{ name: 'dpi', type: 'number', req: false, desc: '72-600 (default: 150)' }, { name: 'quality', type: 'number', req: false, desc: '1-100 (default: 90)' }] },
    { path: '/pdf-to-word', desc: 'PDF to Word document', input: 'Single PDF', curl: 'curl -X POST /api/v1/pdf-to-word \\\n  -F "files=@doc.pdf" -o output.docx', params: [] },
    { path: '/pdf-to-powerpoint', desc: 'PDF to PowerPoint', input: 'Single PDF', curl: 'curl -X POST /api/v1/pdf-to-powerpoint \\\n  -F "files=@doc.pdf" -o output.pptx', params: [] },
    { path: '/pdf-to-excel', desc: 'PDF to Excel spreadsheet', input: 'Single PDF', curl: 'curl -X POST /api/v1/pdf-to-excel \\\n  -F "files=@doc.pdf" -o output.xlsx', params: [] },
    { path: '/pdf-to-pdfa', desc: 'PDF to PDF/A archive format', input: 'Single PDF', curl: 'curl -X POST /api/v1/pdf-to-pdfa \\\n  -F "files=@doc.pdf" -o archived.pdf', params: [] },
  ]},
  { cat: 'Edit PDF', items: [
    { path: '/rotate-pdf', desc: 'Rotate PDF pages', input: 'Single PDF', curl: 'curl -X POST /api/v1/rotate-pdf \\\n  -F "files=@doc.pdf" \\\n  -F "angle=90" \\\n  -F "pages=1-3" -o rotated.pdf', params: [{ name: 'angle', type: 'number', req: true, desc: '90 | 180 | 270' }, { name: 'pages', type: 'string', req: false, desc: 'Specific pages (default: all)' }] },
    { path: '/add-page-numbers', desc: 'Add page numbers to PDF', input: 'Single PDF', curl: 'curl -X POST /api/v1/add-page-numbers \\\n  -F "files=@doc.pdf" \\\n  -F "position=bottom-center" \\\n  -F "startFrom=1" -o numbered.pdf', params: [{ name: 'position', type: 'string', req: false, desc: 'Position (default: bottom-center)' }, { name: 'startFrom', type: 'number', req: false, desc: 'Starting number (default: 1)' }, { name: 'format', type: 'string', req: false, desc: 'e.g. "Page {n} of {total}"' }] },
    { path: '/add-watermark', desc: 'Add text or image watermark', input: 'PDF + optional image', curl: 'curl -X POST /api/v1/add-watermark \\\n  -F "files=@doc.pdf" \\\n  -F "text=DRAFT" \\\n  -F "opacity=0.3" -o watermarked.pdf', params: [{ name: 'text', type: 'string', req: false, desc: 'Watermark text' }, { name: 'opacity', type: 'number', req: false, desc: '0.01-1 (default: 0.3)' }, { name: 'rotation', type: 'number', req: false, desc: 'Degrees (default: -45)' }] },
    { path: '/crop-pdf', desc: 'Crop PDF margins', input: 'Single PDF', curl: 'curl -X POST /api/v1/crop-pdf \\\n  -F "files=@doc.pdf" \\\n  -F "top=50" \\\n  -F "bottom=50" -o cropped.pdf', params: [{ name: 'top/right/bottom/left', type: 'number', req: false, desc: 'Crop in points' }] },
    { path: '/edit-pdf', desc: 'Apply annotations to PDF', input: 'Single PDF', curl: 'curl -X POST /api/v1/edit-pdf \\\n  -F "files=@doc.pdf" \\\n  -F \'annotations=[{"type":"text","pageIndex":0,"x":100,"y":100,"content":"Hello"}]\' \\\n  -o edited.pdf', params: [{ name: 'annotations', type: 'JSON array', req: true, desc: 'Annotation objects' }] },
  ]},
  { cat: 'PDF Security', items: [
    { path: '/unlock-pdf', desc: 'Remove PDF password protection', input: 'Single PDF', curl: 'curl -X POST /api/v1/unlock-pdf \\\n  -F "files=@locked.pdf" \\\n  -F "password=mypass" -o unlocked.pdf', params: [{ name: 'password', type: 'string', req: false, desc: 'PDF password' }] },
    { path: '/lock-pdf', desc: 'Password-protect a PDF', input: 'Single PDF', curl: 'curl -X POST /api/v1/lock-pdf \\\n  -F "files=@doc.pdf" \\\n  -F "password=secret123" -o locked.pdf', params: [{ name: 'password', type: 'string', req: true, desc: 'Password to set' }] },
    { path: '/sign-pdf', desc: 'Add signature image to PDF', input: 'PDF + signature image', curl: 'curl -X POST /api/v1/sign-pdf \\\n  -F "files=@doc.pdf" \\\n  -F "files=@signature.png" \\\n  -F "page=1" -o signed.pdf', params: [{ name: 'page', type: 'number', req: false, desc: 'Page number (default: last)' }, { name: 'x/y/width/height', type: 'number', req: false, desc: 'Signature position' }] },
    { path: '/redact-pdf', desc: 'Redact sensitive regions', input: 'Single PDF', curl: 'curl -X POST /api/v1/redact-pdf \\\n  -F "files=@doc.pdf" \\\n  -F \'regions=[{"page":1,"x":100,"y":200,"w":300,"h":50}]\' \\\n  -o redacted.pdf', params: [{ name: 'regions', type: 'JSON array', req: true, desc: '{page, x, y, w, h} objects' }] },
    { path: '/compare-pdf', desc: 'Visual PDF comparison', input: 'Two PDF files', curl: 'curl -X POST /api/v1/compare-pdf \\\n  -F "files=@v1.pdf" \\\n  -F "files=@v2.pdf" -o diff.zip', params: [] },
  ]},
  { cat: 'Image Conversion', items: [
    { path: '/jpg-to-png', desc: 'JPG to PNG', input: 'Image', curl: 'curl -X POST /api/v1/jpg-to-png \\\n  -F "files=@photo.jpg" \\\n  -F "quality=90" -o photo.png', params: [{ name: 'quality', type: 'number', req: false, desc: '1-100 (default: 90)' }] },
    { path: '/png-to-jpg', desc: 'PNG to JPG', input: 'Image', curl: 'curl -X POST /api/v1/png-to-jpg \\\n  -F "files=@image.png" \\\n  -F "quality=90" -o image.jpg', params: [{ name: 'quality', type: 'number', req: false, desc: '1-100 (default: 90)' }] },
    { path: '/webp-to-jpg', desc: 'WebP to JPG', input: 'Image', curl: 'curl -X POST /api/v1/webp-to-jpg \\\n  -F "files=@image.webp" \\\n  -F "quality=90" -o image.jpg', params: [{ name: 'quality', type: 'number', req: false, desc: '1-100 (default: 90)' }] },
    { path: '/heic-to-jpg', desc: 'HEIC to JPG', input: 'Image', curl: 'curl -X POST /api/v1/heic-to-jpg \\\n  -F "files=@photo.heic" \\\n  -F "quality=90" -o photo.jpg', params: [{ name: 'quality', type: 'number', req: false, desc: '1-100 (default: 90)' }] },
    { path: '/bmp-to-png', desc: 'BMP to PNG', input: 'Image', curl: 'curl -X POST /api/v1/bmp-to-png \\\n  -F "files=@image.bmp" -o image.png', params: [] },
    { path: '/photo-to-markdown', desc: 'OCR image to Markdown', input: 'Image', curl: 'curl -X POST /api/v1/photo-to-markdown \\\n  -F "files=@photo.jpg" \\\n  -F "lang=eng" -o result.md', params: [{ name: 'lang', type: 'string', req: false, desc: 'Language (default: eng)' }] },
  ]},
  { cat: 'Media', items: [
    { path: '/convert', desc: 'Universal format converter', input: 'Any supported file', curl: 'curl -X POST /api/v1/convert \\\n  -F "files=@image.jpg" \\\n  -F "to=png" -o result.png', params: [{ name: 'to', type: 'string', req: true, desc: 'Target format (jpg, png, pdf, docx...)' }] },
    { path: '/gif', desc: 'Create animated GIF', input: 'Multiple images', curl: 'curl -X POST /api/v1/gif \\\n  -F "files=@frame1.jpg" \\\n  -F "files=@frame2.jpg" \\\n  -F "delay=300" -o anim.gif', params: [{ name: 'delay', type: 'number', req: false, desc: 'Frame delay ms (default: 500)' }, { name: 'loop', type: 'boolean', req: false, desc: 'Loop (default: true)' }] },
  ]},
];

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="api-code-block">
      <button
        className="api-code-copy"
        onClick={handleCopy}
        aria-label="Copy code"
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
      <pre><code>{code}</code></pre>
    </div>
  );
}

function EndpointCard({ item }) {
  const [open, setOpen] = useState(false);
  const panelId = `endpoint-body-${item.path.replace(/\//g, '-')}`;
  return (
    <div className={`api-endpoint-card${open ? ' open' : ''}`}>
      <button
        className="api-endpoint-header"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="api-method">POST</span>
        <span className="api-path">/api/v1{item.path}</span>
        <span className="api-desc-short">{item.desc}</span>
        <span className="api-toggle" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div id={panelId} className="api-endpoint-body">
          <div className="api-endpoint-meta">
            <span>Input: <strong>{item.input}</strong></span>
          </div>
          <CodeBlock code={item.curl} />
          {item.params.length > 0 && (
            <div className="api-params">
              <h4>Parameters</h4>
              <table>
                <thead>
                  <tr><th>Name</th><th>Type</th><th></th><th>Description</th></tr>
                </thead>
                <tbody>
                  {item.params.map((p, i) => (
                    <tr key={i}>
                      <td className="api-param-name">{p.name}</td>
                      <td className="api-param-type">{p.type}</td>
                      <td><span className={`api-badge ${p.req ? 'required' : 'optional'}`}>{p.req ? 'required' : 'optional'}</span></td>
                      <td>{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const ApiDocs = () => {
  const [search, setSearch] = useState('');

  const filtered = TOOLS.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      item.path.includes(search.toLowerCase()) ||
      item.desc.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0);

  return (
    <section className="api-docs-page">
      <div className="container">
        {/* Hero */}
        <div className="api-hero fade-in">
          <div className="api-hero-badge">Open Source API</div>
          <h1 className="api-hero-title">
            PixConvert <span className="text-gradient">API</span>
          </h1>
          <p className="api-hero-subtitle">
            35 endpoints for PDF & image processing. No authentication. Works with curl, Postman, n8n, and any HTTP client.
          </p>
          <div className="api-hero-stats">
            <div className="api-stat">
              <span className="api-stat-value">35</span>
              <span className="api-stat-label">Endpoints</span>
            </div>
            <div className="api-stat">
              <span className="api-stat-value">50MB</span>
              <span className="api-stat-label">Max File</span>
            </div>
            <div className="api-stat">
              <span className="api-stat-value">10/s</span>
              <span className="api-stat-label">Rate Limit</span>
            </div>
            <div className="api-stat">
              <span className="api-stat-value">Free</span>
              <span className="api-stat-label">No Auth</span>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="api-section fade-in delay-1">
          <h2 className="api-section-title">Quick Start</h2>
          <div className="api-quickstart-grid">
            <div className="api-quickstart-card">
              <h3>File Upload</h3>
              <CodeBlock code={`curl -X POST /api/v1/compress-pdf \\
  -F "files=@document.pdf" \\
  -F "quality=medium" \\
  -o compressed.pdf`} />
            </div>
            <div className="api-quickstart-card">
              <h3>URL Input</h3>
              <CodeBlock code={`curl -X POST /api/v1/compress-pdf \\
  -H "Content-Type: application/json" \\
  -d '{"urls":["https://example.com/doc.pdf"],
       "quality":"medium"}' \\
  -o result.pdf`} />
            </div>
            <div className="api-quickstart-card">
              <h3>Get Download URL</h3>
              <CodeBlock code={`curl -X POST "/api/v1/compress-pdf?output=url" \\
  -F "files=@document.pdf" \\
  -F "quality=low"

# Returns: {"success":true,"url":"/downloads/abc.pdf",...}`} />
            </div>
          </div>
        </div>

        {/* Integration */}
        <div className="api-section fade-in delay-2">
          <h2 className="api-section-title">Integrations</h2>
          <div className="api-integrations-grid">
            <div className="api-integration-card">
              <div className="api-integration-icon">⚡</div>
              <h3>n8n</h3>
              <p>Use HTTP Request node with Form-Data body type. Set response format to File.</p>
            </div>
            <div className="api-integration-card">
              <div className="api-integration-icon">🔧</div>
              <h3>Postman</h3>
              <p>POST with form-data body. Add files under "files" key. Binary response auto-downloads.</p>
            </div>
            <div className="api-integration-card">
              <div className="api-integration-icon">💻</div>
              <h3>curl</h3>
              <p>All examples on this page are copy-paste curl commands. Pipe output with -o flag.</p>
            </div>
            <div className="api-integration-card">
              <div className="api-integration-icon">🐍</div>
              <h3>Python</h3>
              <p>Use requests library with files parameter. Response content is the processed file.</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="api-section fade-in delay-2">
          <h2 className="api-section-title">All Endpoints</h2>
          <div className="api-search-bar">
            <input
              id="endpoint-search"
              type="text"
              aria-label="Search API endpoints"
              placeholder="Search endpoints... (e.g. merge, compress, jpg)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="api-search-input"
            />
          </div>

          {filtered.map((cat, i) => (
            <div key={i} className="api-category">
              <h3 className="api-category-title">{cat.cat}</h3>
              {cat.items.map((item, j) => (
                <EndpointCard key={j} item={item} />
              ))}
            </div>
          ))}

          {/* aria-live announces search result count to screen readers */}
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {search.trim()
              ? filtered.length === 0
                ? `No endpoints match "${search}"`
                : `${filtered.reduce((n, c) => n + c.items.length, 0)} endpoint${filtered.reduce((n, c) => n + c.items.length, 0) === 1 ? '' : 's'} found`
              : ''}
          </p>

          {filtered.length === 0 && (
            <p className="api-no-results">No endpoints match "{search}"</p>
          )}
        </div>

        {/* Error Codes */}
        <div className="api-section fade-in delay-3">
          <h2 className="api-section-title">Error Responses</h2>
          <div className="api-error-grid">
            {[
              { code: '400', label: 'Bad Request', desc: 'Missing file or invalid parameters' },
              { code: '413', label: 'Too Large', desc: 'File exceeds 50MB limit' },
              { code: '415', label: 'Unsupported', desc: 'File type not supported for this tool' },
              { code: '429', label: 'Rate Limited', desc: 'Exceeded 10 requests per second' },
              { code: '500', label: 'Server Error', desc: 'Processing failed unexpectedly' },
              { code: '502', label: 'Tool Error', desc: 'External tool (Ghostscript, etc.) failed' },
            ].map((err) => (
              <div key={err.code} className="api-error-card">
                <span className="api-error-code">{err.code}</span>
                <span className="api-error-label">{err.label}</span>
                <span className="api-error-desc">{err.desc}</span>
              </div>
            ))}
          </div>
          <CodeBlock code={`// All errors follow this format:
{
  "success": false,
  "error": "Human-readable error message"
}`} />
        </div>
      </div>
    </section>
  );
};

export default ApiDocs;
