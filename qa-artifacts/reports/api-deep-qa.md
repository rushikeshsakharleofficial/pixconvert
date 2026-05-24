# API Deep QA Report — PixConvert Express Backend

**Date:** 2026-05-24  
**Tester:** Claude Code (automated static + live testing)  
**Base URL tested:** `http://localhost:8080` (production server: `node server.js`)  
**API type:** REST  
**Auth mechanism:** Optional API key (`API_KEY_REQUIRED=false` by default); admin endpoints via `x-admin-key` header  
**Source code:** Available — full static analysis performed  
**Framework:** Express 5 + multer + nodemailer + helmet  
**OpenAPI/Swagger:** None (no spec file found)  
**Environment:** Unauthenticated (no SMTP, no admin key set)  
**Destructive actions:** Skipped (no payment, no real email, no production DB)

---

## Initial Assumptions

- No OpenAPI spec → contract testing skipped
- SMTP not configured → contact form returns 500 (`"Email service not configured"`) before email path can execute
- ADMIN_API_KEY unset → `/api/files` returns 403 for all callers (secure fail-closed)
- `API_KEY_REQUIRED=false` → all v1 tool endpoints are publicly accessible
- gRPC/GraphQL checks: not applicable

---

## Summary Table

| # | Severity | Domain | Finding |
|---|----------|--------|---------|
| 1 | 🔴 HIGH | OWASP: File Upload | Legacy `/api/upload` accepts any file type with forged MIME; saves with original extension |
| 2 | 🔴 HIGH | OWASP: Rate Limiting | `trust proxy: 1` with no upstream — X-Forwarded-For header bypasses all rate limiters |
| 3 | 🟡 MEDIUM | OWASP: Misconfiguration | CORS rejection returns HTTP 500 (should be 403); `X-Powered-By: Express` leaks in error response |
| 4 | 🟡 MEDIUM | OWASP: Misconfiguration | SSE `/api/metrics/stream` has no max-connection limit — DoS via connection exhaustion |
| 5 | 🟡 MEDIUM | Security: HTML-to-PDF | TOCTOU window in SSRF protection — Playwright TCP uses own DNS after route-handler validation |
| 6 | 🟡 MEDIUM | Response Quality | No gzip/brotli compression on any response |
| 7 | 🟡 MEDIUM | Observability | `/api/metrics/stats` publicly accessible — tool usage data exposed without auth |
| 8 | 🟡 MEDIUM | URL/Contract | `/api/contact`, `/api/metrics/*`, `/api/upload` have no API versioning |
| 9 | 🟡 MEDIUM | Correctness | Wrong method returns 404, not 405; unversioned routes return HTML error, not JSON |
| 10 | 🟢 LOW | Security: Contact | `name` field in email `replyTo` strips `<>"` but not `\r\n` (CRLF injection) |
| 11 | 🟢 LOW | Security: Contact | `message` and `name` fields appear unescaped in email plain-text body |
| 12 | 🟢 INFO | Architecture | v1 tool endpoints are unauthenticated by default (`API_KEY_REQUIRED=false`) |
| 13 | 🟢 INFO | Architecture | `ADMIN_API_KEY` unset defaults to fail-closed (all /api/files calls return 403) |

---

## Check 1 — Endpoint Correctness

### HTTP status codes

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| `GET /api/v1/health` | 200 | 200 | ✅ |
| `GET /api/v1/nonexistent` | 404 | 404 | ✅ |
| `DELETE /api/v1/health` | 405 | 404 | ❌ |
| `POST /api/v1/health` | 405 | 404 | ❌ |
| `POST /api/upload` (no file) | 400 | 400 | ✅ |
| `POST /api/metrics/track` (missing `tool`) | 400 | 400 | ✅ |
| `POST /api/contact` (missing fields) | 400 | 400 | ✅ |
| `GET /api/files` (no key) | 403 | 403 | ✅ |
| `POST /api/contact` (SMTP not configured) | 500 | 500 | ✅ (expected) |

**FINDING 9:** Wrong method on any route returns `404 Not Found` instead of `405 Method Not Allowed`. Express default — no `app.use` catch-all for method mismatch. Minor, but misleading for API clients.

### Error response format

```
404 on unknown route → HTML: <pre>Cannot GET /api/v1/nonexistent</pre>
400 on /api/upload  → JSON: {"error":"No files uploaded"}
400 on /api/metrics → JSON: {"error":"Invalid tool name"}
```

**Inconsistent:** unversioned 404s return Express HTML; v1/API errors return JSON. No consistent error envelope.

### Content-Type

All JSON endpoints return `Content-Type: application/json; charset=utf-8` ✅  
Security headers (helmet): ✅ CSP, HSTS, X-Content-Type-Options, X-Frame-Options all present  

---

## Check 2 — Security (OWASP API Top 10)

### FINDING 1 — HIGH: File Upload MIME Bypass

**Endpoint:** `POST /api/upload`  
**Evidence:**

```bash
# Upload PHP file as image/jpeg — succeeds
curl -X POST http://localhost:8080/api/upload \
  -F "files=@evil.php;type=image/jpeg"
# → {"files":[{"id":"99a3...ebf5.php","name":"evil.php","size":40,...}]}  HTTP:200

# Upload HTML file as image/png — succeeds
curl -X POST http://localhost:8080/api/upload \
  -F "files=@evil.html;type=image/png"
# → {"files":[{"id":"dca0...095.html","name":"evil.html",...}]}  HTTP:200

# Polyglot JPEG magic bytes + PHP payload — succeeds
# → file stored as .php on disk
```

**Root cause** (`server.js:174-178`):
```js
fileFilter: (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);  // ← client-controlled
  else cb(new Error('Only image files are allowed'));
},
```

The `file.mimetype` is the `Content-Type` from the multipart form — fully attacker-controlled. The v1 API routes use `fileGuard.js` (magic bytes via `file-type` package) but this legacy endpoint does not.

The filename is also derived from `path.extname(file.originalname)`, so `.php`, `.html`, `.svg` extensions are preserved on disk.

**Impact:**  
- SVG with `<script>` stored server-side. If `/uploads/` is ever served as static files, stored XSS becomes trivially exploitable.
- Polyglot files with executable extensions stored.
- In a PHP environment, `.php` upload + static serving = RCE.

**Fix:**
1. Apply `fileGuard.js` to `/api/upload` the same way v1 routes do.
2. Force a safe extension regardless of input: `path.basename` is used for filename but extension comes from original name — override with a whitelist.

```js
// Replace multer fileFilter with magic byte check
// In filename cb: only allow extension if it matches detected MIME
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.tiff', '.bmp'];
filename: (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const safeExt = ALLOWED_EXTS.includes(ext) ? ext : '.bin';
  cb(null, `${crypto.randomBytes(16).toString('hex')}${safeExt}`);
},
```

---

### FINDING 2 — HIGH: Rate Limit Bypass via X-Forwarded-For

**Evidence:**

```bash
# Normal rate limit kicks in at ~55 requests from same real IP
# With forged X-Forwarded-For: different IP per request, bypasses entirely
for i in $(seq 1 70); do
  curl -H "X-Forwarded-For: 5.5.5.$i" http://localhost:8080/api/v1/health
done
# Result: all 70 return 200 — no 429 ever
```

**Root cause** (`server.js:181`):
```js
app.set('trust proxy', process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : 1);
```

`trust proxy: 1` means Express trusts the first `X-Forwarded-For` header value as the real client IP. Without a real reverse proxy that strips/rewrites the header before it reaches Express, any client can forge any IP.

**Impact:**  
Rate limits on all endpoints (`generalLimiter`, `apiRateLimiter`, `uploadLimiter`, `contactLimiter`) can be entirely bypassed. An attacker can send unlimited requests to brute-force, spam contact form, or overload processing endpoints.

**Fix options:**  
1. **If deployed behind a reverse proxy** (nginx, Cloudflare, Caddy): set `TRUST_PROXY` to the proxy's hop count or IP. The current default of `1` is safe only if the reverse proxy is enforced.
2. **If directly exposed**: set `trust proxy: false` — use real TCP IP for rate limiting.
3. **Hardening**: add per-IP rate limit + global rate limit (fail-whale style) so even with forged IPs, total volume is capped.

---

### FINDING 3 — MEDIUM: CORS Error Returns 500 + X-Powered-By Leak

**Evidence:**

```bash
curl -si -H "Origin: https://evil.com" http://localhost:8080/api/v1/health
# HTTP/1.1 500 Internal Server Error
# X-Powered-By: Express   ← framework version leak
# Content-Type: text/html
# <pre>Internal Server Error</pre>
```

**Issues:**
1. CORS rejection should return **403 Forbidden** or **204 No Content** on preflight, not 500.
2. `X-Powered-By: Express` header appears on error responses even though Helmet's `hidePoweredBy()` is presumably active. This leaks framework name to attackers scoping the server.
3. The CORS error bypasses Helmet's error handling (the 500 path doesn't have `X-Powered-By` removal).

**Fix:**  
```js
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) callback(null, true);
    else callback(null, false);  // ← return false not an Error for proper 403/204
  },
}));
// Also: ensure error handler middleware runs helmet headers
```

---

### FINDING 4 — MEDIUM: SSE Endpoint — Unbounded Connections

**Endpoint:** `GET /api/metrics/stream`  
**Source:** `server.js` — `sseClients = new Set()` with no maximum size check

```js
const sseClients = new Set();
// On new connection:
sseClients.add(res);
// On close:
req.on('close', () => sseClients.delete(res));
```

No check: `if (sseClients.size >= MAX_CONNECTIONS) { res.status(503)... }`.

**Impact:** An attacker can open thousands of SSE connections, exhausting file descriptors and memory. Each connection holds a live HTTP response object.

**Fix:**
```js
const MAX_SSE_CLIENTS = parseInt(process.env.MAX_SSE_CLIENTS || '100', 10);
// ...
if (sseClients.size >= MAX_SSE_CLIENTS) {
  return res.status(503).json({ error: 'Too many clients' });
}
sseClients.add(res);
```

---

### FINDING 5 — MEDIUM: SSRF TOCTOU in HTML-to-PDF

**Source:** `src/api/v1/tools/convert-to-pdf/htmlToPdf.js`

```js
// Route handler: resolves DNS, checks IP, returns pinned IP
const { pinnedIp } = await assertPublicHttpUrl(htmlUrl);  // ← DNS resolution #1
// Playwright: intercepts all sub-requests
page.route('**/*', async (route) => {
  await assertPublicHttpUrl(route.request().url());  // ← DNS resolution #2
  await route.continue();
});
// Playwright: TCP connect uses its own DNS at connection time  ← DNS resolution #3
```

Between validation and TCP connection, a DNS rebinding attack can change the resolved IP to a private address. The `pinnedFetch` pattern (used in `urlFetcher.js`) prevents this for URL-fetching, but Playwright's `route.continue()` does NOT use the pinned IP — it performs its own DNS resolution at TCP time.

**Live test:** SSRF protection confirmed working against direct attempts:
```
http://localhost:8080 → 403 "Private or local URLs are not allowed"
http://169.254.169.254 → 403
file:///etc/passwd → 400
http://2130706433 (decimal 127.0.0.1) → 403 ✅
http://0x7f000001 → 403 ✅
http://[::1] → 400 "URL host could not be resolved" ✅
```

The rebinding attack requires DNS infrastructure to execute. Medium severity given the deployment context (public SaaS).

**Fix:** Use Playwright's `request.abort()` inside the route handler instead of `continue()` for disallowed hosts, and ensure the pinned IP is used (e.g., by overriding the `Host` header and connecting to the IP directly).

---

### FINDING 10 — LOW: Contact Form CRLF in replyTo

**Source:** `server.js:376`
```js
replyTo: `"${name.replace(/[<>"]/g, '')}" <${email}>`,
```

The `name` field strips `<`, `>`, `"` but NOT `\r\n`. An attacker can inject CRLF sequences to add extra email headers:

```json
{"name": "Legit Name\r\nBcc: attacker@evil.com\r\nX-Injected: 1", ...}
```

**Impact:** Header injection into outgoing email (Bcc, extra headers). Severity is LOW because (a) email service is disabled in current deployment, (b) nodemailer's underlying library may sanitize, (c) requires email to be configured.

**Fix:**
```js
name.replace(/[\r\n<>"]/g, '')
```

---

### FINDING 11 — LOW: Plain-Text Email Body — Unescaped User Content

**Source:** `server.js:379`
```js
text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
```

`message` is inserted verbatim. In the plain-text context this is lower risk than HTML email, but if the SMTP server or recipient client renders HTML in plain-text mode, script injection is possible. Length limits protect against overflow.

**Recommended:** Escape `<>&` in all user-provided fields when building email body.

---

## Check 3 — Performance

| Endpoint | Response Time | Status |
|----------|--------------|--------|
| `GET /api/v1/health` | 2ms | ✅ |
| `GET /api/metrics/stats` | 5ms | ✅ |
| `GET /api/v1/tools` | 2ms | ✅ |

Response times are excellent. No N+1 queries (in-memory data store).

### FINDING 6 — MEDIUM: No Response Compression

```bash
curl -si -H "Accept-Encoding: gzip,deflate,br" http://localhost:8080/api/v1/tools
# Content-Length: 4811
# No Content-Encoding header
```

No `compression` middleware is installed. Tool list (4.8KB) and metrics stats (large JSON array) are served uncompressed.

**Fix:**
```bash
npm install compression
```
```js
import compression from 'compression';
app.use(compression());
```

---

## Check 4 — Response Quality

### Pagination

`GET /api/v1/tools` returns 8 tools — no pagination needed at current scale. ✅  
`GET /api/metrics/stats` returns 30-day buckets with full event data — no pagination ✅ (bounded by period).

### Error shape consistency

**Inconsistency:** Express HTML errors (unknown route, CORS error, method not allowed) vs. JSON error objects from application code. Clients cannot parse error shapes uniformly.

**Recommended:** Add global error handler that returns JSON for all 4xx/5xx:
```js
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});
```

---

## Check 5 — URL Structure and Hygiene

### Versioning

| Endpoint | Versioned | Note |
|----------|-----------|------|
| `/api/v1/*` (tools) | ✅ | All tool routes under v1 |
| `/api/contact` | ❌ | No versioning — breaking changes affect all clients |
| `/api/metrics/stats` | ❌ | No versioning |
| `/api/metrics/track` | ❌ | No versioning |
| `/api/metrics/stream` | ❌ | No versioning |
| `/api/upload` | ❌ | No versioning (legacy endpoint) |

### FINDING 8 — MEDIUM: Unversioned Endpoints

`/api/contact`, `/api/metrics/*`, and `/api/upload` have no versioning. Any breaking change (field rename, status code change, schema change) immediately breaks all existing integrations.

**Recommended:** Move to `/api/v1/contact`, `/api/v1/metrics/*`, `/api/v1/upload` and add redirects from legacy paths.

### Path hygiene — PASS

- Lowercase paths ✅  
- No sensitive data in URLs ✅  
- No tokens in query strings ✅  

### Path traversal — `/downloads`

```bash
curl http://localhost:8080/downloads/../../etc/passwd
# → HTTP 200 (returns SPA index.html, not the file)
```

Express `express.static` with `root` path correctly blocks traversal above root. The 200 response is the SPA fallback, not the traversed file. ✅

---

## Check 6 — Contract Integrity

No OpenAPI spec — contract testing skipped.  
Idempotency: `GET /api/v1/health` is idempotent ✅.  
`POST /api/metrics/track` has no idempotency key — duplicate tracking events possible if client retries. Low business impact.

---

## Check 7 — SSRF (Summary)

All direct SSRF vectors blocked:
- `http://localhost/` → 403 ✅
- `http://169.254.169.254/` → 403 ✅
- `file:///etc/passwd` → 400 ✅
- `http://2130706433/` (decimal) → 403 ✅
- `http://0x7f000001/` (hex) → 403 ✅
- `http://[::1]/` → 400 ✅

Residual TOCTOU risk documented in FINDING 5.

---

## Check 8 — Injection

| Vector | Result | Status |
|--------|--------|--------|
| SQL injection in query params | Passed through (no SQL DB) | N/A |
| Path traversal in tool name | `Invalid tool name` (allowlist) | ✅ |
| `../../../etc/passwd` as tool name | 400 | ✅ |
| Template injection in metrics period | Falls back to `monthly` | ✅ |
| `__proto__` pollution in period param | Returns default (safe) | ✅ |

---

## Check 9 — Authentication / Authorization

| Test | Result |
|------|--------|
| `/api/files` without key | 403 ✅ |
| `/api/files` with wrong key | 403 ✅ |
| `ADMIN_API_KEY` unset → fail-closed | 403 ✅ |
| v1 tool routes without API key | 200 (by design, `API_KEY_REQUIRED=false`) |
| No BOLA surface (no user IDs in routes) | N/A |

### FINDING 12 — INFO: Tool Endpoints Publicly Accessible

All 40+ v1 tool endpoints (`/api/v1/compress-pdf`, `/api/v1/html-to-pdf`, etc.) are publicly accessible without any authentication by default. This is documented behavior (`API_KEY_REQUIRED=false` in `.env.example`).

For a public tool, this is intentional. For metered commercial use, `API_KEY_REQUIRED=true` is the right path.

---

## Check 10 — Rate Limiting

| Endpoint | Limiter | Limit | Bypass Status |
|----------|---------|-------|---------------|
| All routes | `generalLimiter` | 60/min | ❌ Bypassed via X-FF |
| v1 tools | `apiRateLimiter` | 10/sec | ❌ Bypassed via X-FF |
| `/api/upload` | `uploadLimiter` | 10/min | ❌ Bypassed via X-FF |
| `/api/contact` | `contactLimiter` | 5/hr | ❌ Bypassed via X-FF |
| `/api/metrics/track` | `metricsTrackLimiter` | 60/min | ❌ Bypassed via X-FF |

All rate limiters are bypassed by FINDING 2.

---

## Check 11 — Observability

### FINDING 7 — MEDIUM: Metrics Stats Publicly Exposed

`GET /api/metrics/stats` returns aggregated tool usage data (which tools are used, when, how often) with no authentication. This leaks business metrics to competitors/bots.

**Fix options:**  
1. Protect with `ADMIN_API_KEY` header check.
2. Serve from an internal-only endpoint.
3. Accept the exposure if metrics are intentionally public (e.g., for a public usage counter widget).

---

## Checks Skipped

| Check | Reason |
|-------|--------|
| JWT/OAuth2 attacks | No JWT auth implemented |
| GraphQL checks | REST only |
| gRPC checks | Not applicable |
| Payment/booking endpoints | None present |
| Webhook security | None present |
| Load testing | Out of scope for this audit |
| Contract testing (schema drift) | No OpenAPI spec |
| Broken Object Level Authorization | No user accounts / resource ownership model |
| Mass assignment | No user model / no PATCHable user resource |

---

## Prioritized Fix Plan

| Priority | Finding | Effort | Impact |
|----------|---------|--------|--------|
| 🔴 1 | Fix `/api/upload` to use `fileGuard.js` + safe extension | Low | High |
| 🔴 2 | Document `trust proxy` requirement + fix for direct-expose | Low | High |
| 🟡 3 | Cap SSE connections with `MAX_SSE_CLIENTS` | Low | Medium |
| 🟡 4 | Fix CORS error → return 403 not 500; suppress `X-Powered-By` | Low | Medium |
| 🟡 5 | Add `compression()` middleware | Trivial | Medium |
| 🟡 6 | Add versioning to `/api/contact`, `/api/metrics/*`, `/api/upload` | Medium | Medium |
| 🟡 7 | Protect `/api/metrics/stats` behind admin key (or document intent) | Low | Medium |
| 🟢 8 | Fix CRLF in contact form `name` | Trivial | Low |
| 🟢 9 | Return 405 for wrong method (add `methodNotAllowed` handler) | Low | Low |
| 🟢 10 | Consistent JSON error envelope for all routes | Medium | Low |
