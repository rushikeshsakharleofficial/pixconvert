# n8n-nodes-pixconvert

Community node package for PixConvert.

## What It Supports

The node is generated against the current PixConvert API in this repository:

- `/api/v1/health`
- `/api/v1/tools`
- `/api/upload`
- `/api/files`
- `/api/metrics/track`
- `/api/metrics/stats`
- `/api/contact`
- All current `/api/v1/*` conversion, PDF, image, OCR, GIF, and security tool endpoints.

## Build

```bash
cd integrations/n8n-nodes-pixconvert
npm install
npm run build
```

## Install Locally in n8n

From this package directory:

```bash
npm pack
```

Then install the generated `.tgz` in your self-hosted n8n instance, or use n8n's community-node installation UI after publishing to npm.

## Credentials

Create PixConvert API credentials in n8n:

- `Base URL`: your Express PixConvert API origin, for example `http://localhost:3000`
- `Admin API Key`: optional, required only for list/delete uploaded files
- `Extra Header Name/Value`: optional proxy/API-gateway auth

Do not use the static-only Vercel frontend URL for server-side conversion operations unless that deployment also routes `/api` to a running PixConvert backend.

## Binary Usage

For most tool operations:

1. Put the input file in an n8n binary property, usually `data`.
2. Select `Resource: Tool`.
3. Pick the operation.
4. Set `Input Mode: Binary`.
5. Set `Binary Property`.
6. For multi-file operations, add comma-separated `Additional Binary Properties`.
7. Keep `Return Mode: Binary` to receive the converted file as n8n binary data.

For URL input, choose `Input Mode: Remote URL` and provide one URL per line. PixConvert's server-side SSRF protections still apply.

## Notes

Some PixConvert endpoints require native tools on the server, such as Ghostscript, LibreOffice, Tesseract, and Playwright browsers. The n8n node calls the API; it does not run those tools locally.
