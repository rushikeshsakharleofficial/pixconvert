<div align="center">
  <img src="./docs/screenshots/home-dark.png" width="800" alt="PixConvert — home screen (dark mode)" />
</div>

# PixConvert

<div align="center">

Privacy-first, open-source file conversion — 40+ PDF &amp; image tools, all client-side.

[![npm version](https://img.shields.io/npm/v/pixconvert.svg)](https://www.npmjs.com/package/pixconvert)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](#license)

</div>

---

PixConvert is a self-hostable web application, REST API, and CLI for converting, editing, and managing PDF and image files. Heavy processing runs in the browser via Web Workers; the Express backend handles transient file storage and live analytics.

## Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [API](#api)
- [Docker](#docker)
- [n8n Integration](#n8n-integration)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)
- [License](#license)

---

## Quick Start

```bash
# No install — try it immediately
npx pixconvert
# → API server at http://localhost:3000
```

Or with Docker:

```bash
git clone https://github.com/rushikeshsakharleofficial/pixconvert.git
cd pixconvert
cp .env.example .env
docker compose up -d
# → http://localhost:80
```

---

## Features

**PDF Tools**

| Category | Tools |
|----------|-------|
| Organize | Merge, Split, Remove Pages, Extract Pages, Organize, Scan to PDF |
| Optimize | Compress, Repair, OCR |
| Convert to PDF | JPG, Word, PowerPoint, Excel, HTML → PDF |
| Convert from PDF | PDF → JPG, Word, PowerPoint, Excel, PDF/A |
| Edit | Rotate, Add Page Numbers, Add Watermark, Crop, Edit |
| Security | Unlock, Lock, Sign, Redact, Compare |

**Image & Media Tools**

| Category | Tools |
|----------|-------|
| Image | JPG↔PNG, WebP→JPG, HEIC→JPG, BMP→PNG, Photo→Markdown |
| Media | Universal converter, GIF maker |

**Platform Features**
- Real-time analytics dashboard (SSE-powered with animated charts)
- Dual dark / light theme
- REST API with optional key authentication
- Auto-scaling Docker setup with Nginx load balancing
- n8n community node for workflow automation

---

## Requirements

| Dependency | Version | Purpose |
|------------|---------|---------|
| Node.js | 20+ | Runtime (matches Docker base image) |
| Ghostscript | any | PDF compression and repair |
| LibreOffice | any (headless) | Office ↔ PDF conversions |
| Tesseract OCR | any | OCR tool |

Install system dependencies on Ubuntu/Debian:

```bash
sudo apt install ghostscript libreoffice tesseract-ocr
```

---

## Installation

### Option 1 — npx (zero install, quick test)

```bash
npx pixconvert
```

Server starts at `http://localhost:3000` by default.

---

### Option 2 — npm global install + systemd service

**Install globally:**

```bash
sudo npm install -g pixconvert
```

**Install systemd service:**

```bash
sudo /usr/local/bin/pixconvert --install
```

> Always use the full path `/usr/local/bin/pixconvert` with `sudo` — `sudo pixconvert` resets `PATH` and may resolve the wrong binary.

This creates `/var/log/pixconvert/`, writes `/etc/systemd/system/pixconvert.service`, and enables auto-start on boot.

**Manage the service:**

```bash
sudo systemctl start pixconvert
sudo systemctl stop pixconvert
sudo systemctl restart pixconvert
sudo systemctl status pixconvert
sudo systemctl enable pixconvert    # persist across reboots
sudo systemctl disable pixconvert
```

**View logs:**

```bash
tail -f /var/log/pixconvert/pixconvert_access.log   # stdout
tail -f /var/log/pixconvert/pixconvert_error.log    # stderr
```

**Uninstall service:**

```bash
sudo pixconvert --uninstall
```

---

### Option 3 — Clone from source

```bash
git clone https://github.com/rushikeshsakharleofficial/pixconvert.git
cd pixconvert
npm install
```

Copy the environment template and fill in your values:

```bash
cp .env.example .env
```

**Development (frontend + API separately):**

```bash
npm run dev      # Vite dev server (frontend)
npm run server   # Express API server
```

**Production build:**

```bash
npm run build   # vite build + SEO prerender → dist/
npm run server
```

**Install as systemd service from source:**

```bash
sudo node bin/pixconvert.js --install
```

---

## Configuration

Copy `.env.example` to `.env` and set values before starting.

### Server

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | API server port (used by Docker; overrides `API_PORT`) |
| `API_PORT` | `3000` | API port when running without Docker |
| `FRONTEND_PORT` | `8080` | Frontend port (only when running frontend separately) |
| `TRUST_PROXY` | — | Set `1` when behind a reverse proxy |

### File Uploads

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_FILE_SIZE_MB` | `50` | Maximum upload size in MB |
| `MAX_FILES_PER_UPLOAD` | `50` | Maximum files per request |

### CORS

| Variable | Default | Description |
|----------|---------|-------------|
| `ALLOWED_ORIGINS` | — | Comma-separated allowed origins (e.g. `http://localhost:5173,https://example.com`) |

### Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_API_KEY` | — | **Required** for `/api/files` list and delete endpoints |
| `API_KEY_REQUIRED` | `false` | Set `true` to require API key authentication on all `/api/v1` routes |
| `API_KEYS` | — | Comma-separated valid API keys (e.g. `key1,key2`) |

### Job Queue

| Variable | Default | Description |
|----------|---------|-------------|
| `JOB_CONCURRENCY` | `4` | Max concurrent heavy processes (Ghostscript, LibreOffice, Tesseract, Playwright) |
| `JOB_TIMEOUT_MS` | `120000` | Job timeout in milliseconds |

### Auto-scaling (Docker)

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_MIN_REPLICAS` | `1` | Minimum container replicas |
| `APP_MAX_REPLICAS` | `10` | Maximum container replicas |
| `AUTOSCALE_CPU_SCALE_UP` | `75` | CPU % threshold to scale up |
| `AUTOSCALE_CPU_SCALE_DOWN` | `25` | CPU % threshold to scale down |
| `AUTOSCALE_MEM_SCALE_UP` | `80` | Memory % threshold to scale up |
| `AUTOSCALE_MEM_SCALE_DOWN` | `35` | Memory % threshold to scale down |
| `AUTOSCALE_POLL_MS` | `30000` | Polling interval in milliseconds |
| `AUTOSCALE_COOLDOWN_MS` | `120000` | Cooldown between scale events |

### SMTP (contact form)

| Variable | Default | Description |
|----------|---------|-------------|
| `SMTP_HOST` | — | SMTP server hostname |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_SECURE` | `false` | Use TLS (`true` / `false`) |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASS` | — | SMTP password |
| `ADMIN_EMAIL` | — | Destination address for contact form submissions |
| `FROM_EMAIL` | — | Sender address |

---

## Scripts

```bash
npm run dev              # Vite dev server (hot reload)
npm run build            # Production build: vite build + SEO prerender (dist/)
npm run server           # Express API server
npm run preview          # Preview production build locally
npm run lint             # ESLint
npm run autoscale:docker # Docker auto-scaler daemon
npm run sync-memory      # Sync analytics memory store
npm run test:security    # DDoS / rate-limit smoke test
```

`npm run build` runs two steps in sequence:

1. `vite build` — compiles the React app into `dist/`.
2. `node scripts/prerender-seo.mjs` — writes a route-specific `index.html` into every URL path (e.g. `dist/tools/merge-pdf/index.html`) with the correct `<title>`, meta description, canonical, Open Graph, and `BreadcrumbList` JSON-LD baked into `<head>`. Vercel serves these static files on first load; React hydrates and handles subsequent navigation.

SEO metadata (titles, descriptions, noindex routes) is centralized in **`src/seo/page-meta.js`** — imported by both the React app (runtime updates) and the prerender script (build-time injection).

---

## API

The REST API is available at `http://localhost:3000/api/v1`.

Full documentation: [API.md](./API.md)

**Key endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health` | Health check |
| `GET` | `/api/v1/tools` | List all available tools |
| `POST` | `/api/upload` | Upload files (multipart/form-data, field: `files`) |
| `GET` | `/api/files` | List uploaded files (requires `x-admin-key` header) |
| `DELETE` | `/api/files/:id` | Delete uploaded file (requires `x-admin-key` header) |
| `POST` | `/api/metrics/track` | Track tool usage |
| `GET` | `/api/metrics/stats` | Retrieve analytics stats |
| `POST` | `/api/contact` | Submit contact form |
| `POST` | `/api/v1/merge-pdf` | Merge PDFs |
| `POST` | `/api/v1/split-pdf` | Split PDF |
| `POST` | `/api/v1/compress-pdf` | Compress PDF |
| `POST` | `/api/v1/ocr-pdf` | OCR a PDF |
| `POST` | `/api/v1/convert` | Universal file converter |
| `POST` | `/api/v1/gif` | Create GIF from images |

All conversion endpoints accept `multipart/form-data` and return a binary file or a JSON error.

---

## Docker

The repo ships a multi-stage `Dockerfile` and a `docker-compose.yml` with Nginx for load balancing.

```bash
cp .env.example .env      # configure environment
docker compose up -d      # start app + nginx
```

- App container exposes port `4000` internally; Nginx listens on port `80`.
- Persistent volumes: `uploads-data` (temp files), `metrics-data` (analytics).
- `nginx.scaling.conf` is configured for SSE keep-alive and upstream load balancing.

**Auto-scale replicas (requires Docker socket access):**

```bash
npm run autoscale:docker
```

---

## n8n Integration

A community node package for [n8n](https://n8n.io) is included in `integrations/n8n-nodes-pixconvert/`.

**Build:**

```bash
cd integrations/n8n-nodes-pixconvert
npm install
npm run build
```

**Pack for local n8n install:**

```bash
npm pack
```

Then install the generated `.tgz` in your self-hosted n8n instance, or publish to npm and install via n8n's community-node UI.

**n8n credentials:**

| Field | Value |
|-------|-------|
| Base URL | Your PixConvert API origin, e.g. `http://localhost:3000` |
| Admin API Key | Optional; required for file list/delete operations |
| Extra Header | Optional proxy/gateway auth |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, TailwindCSS 3, Framer Motion 12 |
| UI components | Radix UI, shadcn/ui, Lucide React |
| Charts | Recharts 3 with custom SVG filters |
| PDF (client) | pdf-lib, pdfjs-dist, Tesseract.js |
| Image (client) | heic2any, gif.js |
| Backend | Node.js 20, Express 5 |
| File processing | sharp, Ghostscript, LibreOffice, Tesseract OCR, Playwright |
| Real-time | Server-Sent Events (SSE) |
| Analytics | Atomic JSON local storage with 2-year data purging |
| Infrastructure | Docker, Nginx, p-queue job queue |

---

## Screenshots

<p align="center">
  <img src="./docs/screenshots/analytics-final-dark.png" width="800" alt="Real-time analytics dashboard" />
  <br><em>Real-time analytics — Glowing Line Charts &amp; Animated Donut Charts</em>
</p>

<p align="center">
  <img src="./docs/screenshots/home-light.png" width="800" alt="Home screen — light mode" />
  <br><em>Light mode</em>
</p>

<p align="center">
  <img src="./docs/screenshots/dropdown-dark.png" width="600" alt="Tools navigation dropdown" />
  <br><em>40+ tools organized in a compact navigation dropdown</em>
</p>

---

## Contributing

1. Fork the repository and create a branch from `master`.
2. Run `npm install` and copy `.env.example` to `.env`.
3. Start the stack: `npm run dev` (frontend) + `npm run server` (API).
4. Make changes. Run `npm run lint` before committing.
5. Open a pull request against `master` with a clear description of what changed and why.

Bug reports and feature requests: open a [GitHub issue](https://github.com/rushikeshsakharleofficial/pixconvert/issues).

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
