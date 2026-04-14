# PixConvert Server-Side API — Design Spec

**Date:** 2026-04-14
**Status:** Approved
**Branch:** beta-testing

## Overview

Server-side REST API for all PixConvert PDF and image tools. Stateless, no auth, rate-limited. Compatible with curl, Postman, n8n HTTP node, and any HTTP client.

## Architecture

```
Client / curl / Postman / n8n
        │
        ▼
  Express API (server.js)
  ├─ Rate limiter (10 req/sec per IP)
  ├─ File size guard (50MB)
  ├─ Input: multipart upload OR JSON { urls } OR mixed
  ├─ Route to tool handler
  │   ├─ Node.js handlers (lightweight)
  │   └─ System binary handlers (heavy processing)
  ├─ Output: binary stream (default) OR download URL (?output=url)
  └─ Cleanup: FILE_TTL_HOURS (default 1h)
```

## Base URL

```
POST /api/v1/<tool-name>
```

Versioned API. All endpoints under `/api/v1/`.

## Input Contract

### Method 1: File Upload (multipart/form-data)
```bash
curl -X POST /api/v1/merge-pdf -F "files=@doc1.pdf" -F "files=@doc2.pdf"
```

### Method 2: URL Input (application/json)
```bash
curl -X POST /api/v1/compress-pdf \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://example.com/doc.pdf"]}'
```

### Method 3: Mixed (multipart + urls field)
```bash
curl -X POST /api/v1/merge-pdf \
  -F "files=@local.pdf" -F "urls=https://example.com/remote.pdf"
```

## Output Contract

### Default: Binary stream
```bash
curl -X POST /api/v1/compress-pdf -F "files=@doc.pdf" -o result.pdf
```
Response headers: `Content-Type`, `Content-Disposition`, `Content-Length`

### URL mode: `?output=url`
```json
{
  "success": true,
  "url": "/downloads/abc123.pdf",
  "filename": "compressed-document.pdf",
  "size": 42000,
  "expiresAt": "2026-04-14T15:00:00.000Z"
}
```

### Error
```json
{
  "success": false,
  "error": "File too large (max 50MB)"
}
```

## Rate Limiting & Guards

| Guard | Value | Configurable |
|-------|-------|-------------|
| Rate limit | 10 req/sec per IP | `API_RATE_LIMIT=10` |
| Max file size | 50MB | `MAX_FILE_SIZE_MB=50` |
| Max files per request | 50 | `MAX_FILES_PER_UPLOAD=50` |
| File TTL | 1 hour | `FILE_TTL_HOURS=1` |
| URL fetch timeout | 30s | `URL_FETCH_TIMEOUT_MS=30000` |
| Max URL file size | 50MB | Same as max file size |

Rate limit response:
```json
{ "success": false, "error": "Rate limit exceeded. Max 10 requests per second." }
```

## Authentication

None. Open API. Rate limiting is the only guard.

## Tool Endpoints

### Organize PDF

| Endpoint | Input | Options | Engine |
|----------|-------|---------|--------|
| `POST /api/v1/merge-pdf` | Multiple PDFs | `order` (array of indices) | pdf-lib |
| `POST /api/v1/split-pdf` | Single PDF | `pages` (e.g. "1-3,5,8") | pdf-lib |
| `POST /api/v1/remove-pages` | Single PDF | `pages` (e.g. "2,4,6") | pdf-lib |
| `POST /api/v1/extract-pages` | Single PDF | `pages` (e.g. "1-3") | pdf-lib |
| `POST /api/v1/organize-pdf` | Single PDF | `order` (array of page indices) | pdf-lib |
| `POST /api/v1/scan-to-pdf` | Image(s) | `quality` (low/medium/high) | sharp + pdf-lib |

### Optimize PDF

| Endpoint | Input | Options | Engine |
|----------|-------|---------|--------|
| `POST /api/v1/compress-pdf` | Single PDF | `quality` (low/medium/high) | Ghostscript |
| `POST /api/v1/repair-pdf` | Single PDF | — | Ghostscript |
| `POST /api/v1/ocr-pdf` | Single PDF | `lang` (eng/fra/deu/spa/...) | Tesseract CLI |

### Convert to PDF

| Endpoint | Input | Options | Engine |
|----------|-------|---------|--------|
| `POST /api/v1/jpg-to-pdf` | Image(s) | `orientation` (portrait/landscape), `margin` (px) | sharp + pdf-lib |
| `POST /api/v1/word-to-pdf` | .doc/.docx | — | LibreOffice headless |
| `POST /api/v1/powerpoint-to-pdf` | .ppt/.pptx | — | LibreOffice headless |
| `POST /api/v1/excel-to-pdf` | .xls/.xlsx | — | LibreOffice headless |
| `POST /api/v1/html-to-pdf` | HTML file or URL | `format` (A4/Letter), `landscape` (bool) | Puppeteer |

### Convert from PDF

| Endpoint | Input | Options | Engine |
|----------|-------|---------|--------|
| `POST /api/v1/pdf-to-jpg` | Single PDF | `quality` (1-100), `dpi` (72-600) | pdfjs-dist + sharp |
| `POST /api/v1/pdf-to-word` | Single PDF | — | LibreOffice headless |
| `POST /api/v1/pdf-to-powerpoint` | Single PDF | — | LibreOffice headless |
| `POST /api/v1/pdf-to-excel` | Single PDF | — | LibreOffice headless |
| `POST /api/v1/pdf-to-pdfa` | Single PDF | — | Ghostscript |

### Edit PDF

| Endpoint | Input | Options | Engine |
|----------|-------|---------|--------|
| `POST /api/v1/rotate-pdf` | Single PDF | `angle` (90/180/270), `pages` (all or specific) | pdf-lib |
| `POST /api/v1/add-page-numbers` | Single PDF | `position` (top-left/.../bottom-right), `startFrom` (int), `format` (Page {n}/{total}) | pdf-lib |
| `POST /api/v1/add-watermark` | Single PDF | `text` or `image` (file), `opacity` (0-1), `position`, `rotation` | pdf-lib |
| `POST /api/v1/crop-pdf` | Single PDF | `margins` ({top,right,bottom,left} in pt) | pdf-lib |
| `POST /api/v1/edit-pdf` | Single PDF | `annotations` (JSON array of annotation objects) | pdf-lib |

### PDF Security

| Endpoint | Input | Options | Engine |
|----------|-------|---------|--------|
| `POST /api/v1/unlock-pdf` | Single PDF | `password` | pdf-lib |
| `POST /api/v1/lock-pdf` | Single PDF | `password`, `permissions` | pdf-lib |
| `POST /api/v1/sign-pdf` | Single PDF + signature image | `position` ({x,y,width,height,page}) | pdf-lib |
| `POST /api/v1/redact-pdf` | Single PDF | `regions` (array of {page,x,y,w,h}) | pdf-lib |
| `POST /api/v1/compare-pdf` | Two PDFs | `mode` (visual/text) | pdfjs-dist + pixelmatch |

### Image Conversion

| Endpoint | Input | Options | Engine |
|----------|-------|---------|--------|
| `POST /api/v1/jpg-to-png` | Image | `quality` (1-100) | sharp |
| `POST /api/v1/png-to-jpg` | Image | `quality` (1-100) | sharp |
| `POST /api/v1/webp-to-jpg` | Image | `quality` (1-100) | sharp |
| `POST /api/v1/heic-to-jpg` | Image | `quality` (1-100) | sharp |
| `POST /api/v1/bmp-to-png` | Image | — | sharp |
| `POST /api/v1/photo-to-markdown` | Image | `lang` (eng/...) | Tesseract CLI |

### Media

| Endpoint | Input | Options | Engine |
|----------|-------|---------|--------|
| `POST /api/v1/convert` | Any supported file | `to` (target format) | auto-detect engine |
| `POST /api/v1/gif` | Multiple images | `delay` (ms), `loop` (bool) | sharp/gif-encoder |

## File Structure

```
server.js                    (existing — add v1 router mount)
src/
  api/
    v1/
      index.js               (v1 router — mounts all tool routes)
      middleware/
        rateLimiter.js        (10 req/sec rate limiter)
        fileGuard.js          (50MB limit, multer config)
        urlFetcher.js         (download files from URLs)
        outputHandler.js      (binary vs URL response)
      tools/
        organize/
          mergePdf.js
          splitPdf.js
          removePages.js
          extractPages.js
          organizePdf.js
          scanToPdf.js
        optimize/
          compressPdf.js
          repairPdf.js
          ocrPdf.js
        convert-to-pdf/
          jpgToPdf.js
          wordToPdf.js
          powerpointToPdf.js
          excelToPdf.js
          htmlToPdf.js
        convert-from-pdf/
          pdfToJpg.js
          pdfToWord.js
          pdfToPowerpoint.js
          pdfToExcel.js
          pdfToPdfa.js
        edit/
          rotatePdf.js
          addPageNumbers.js
          addWatermark.js
          cropPdf.js
          editPdf.js
        security/
          unlockPdf.js
          lockPdf.js
          signPdf.js
          redactPdf.js
          comparePdf.js
        image/
          imageConvert.js     (handles all image format conversions)
          photoToMarkdown.js
        media/
          universalConvert.js
          gifMaker.js
      utils/
        fileHelpers.js        (temp file management, cleanup)
        binaryRunner.js       (exec Ghostscript, LibreOffice, Tesseract)
        validators.js         (input validation schemas)
```

## System Binary Dependencies

```bash
# Required on server
apt-get install -y ghostscript tesseract-ocr libreoffice-core imagemagick

# Node dependencies to add
npm install sharp puppeteer pixelmatch pngjs
```

## Environment Variables

```env
# API config
API_RATE_LIMIT=10              # requests per second per IP
MAX_FILE_SIZE_MB=50            # max upload size
MAX_FILES_PER_UPLOAD=50        # max files in one request
FILE_TTL_HOURS=1               # processed file retention
URL_FETCH_TIMEOUT_MS=30000     # timeout for URL downloads
DOWNLOADS_DIR=./downloads      # output file storage

# Binary paths (override if not in PATH)
GS_PATH=gs
SOFFICE_PATH=soffice
TESSERACT_PATH=tesseract
```

## API Documentation Page

`/api/docs` — static HTML page served by Express showing:
- All endpoints with curl examples
- Input/output format
- Rate limits and file size limits
- Tool-specific options
- Interactive "Try it" forms (optional, Phase 2)

## Metrics Integration

Every API call fires existing metrics tracking:
```js
metricsEvents.push({ tool: 'api:compress-pdf', ts: Date.now() });
```
Prefixed with `api:` to distinguish from frontend usage.

## Error Codes

| HTTP Status | Meaning |
|-------------|---------|
| 200 | Success |
| 400 | Bad request (missing file, invalid params) |
| 413 | File too large |
| 415 | Unsupported file type |
| 429 | Rate limited |
| 500 | Processing error |
| 502 | Binary tool failed (Ghostscript, LibreOffice, etc.) |
