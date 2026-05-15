import dns from 'dns/promises';
import net from 'net';
import https from 'node:https';
import http from 'node:http';

const MAX_REDIRECTS = parseInt(process.env.URL_FETCH_MAX_REDIRECTS || '3', 10);
const ALLOW_PRIVATE_URLS = process.env.ALLOW_PRIVATE_URLS === 'true';

const BLOCKED_HOSTS = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
]);

function normalizeHost(hostname) {
  return hostname.toLowerCase().replace(/\.$/, '');
}

function ipv4ToInt(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

function isPrivateIpv4(ip) {
  const n = ipv4ToInt(ip);
  return (
    (n >= ipv4ToInt('0.0.0.0') && n <= ipv4ToInt('0.255.255.255')) ||
    (n >= ipv4ToInt('10.0.0.0') && n <= ipv4ToInt('10.255.255.255')) ||
    (n >= ipv4ToInt('127.0.0.0') && n <= ipv4ToInt('127.255.255.255')) ||
    (n >= ipv4ToInt('169.254.0.0') && n <= ipv4ToInt('169.254.255.255')) ||
    (n >= ipv4ToInt('172.16.0.0') && n <= ipv4ToInt('172.31.255.255')) ||
    (n >= ipv4ToInt('192.168.0.0') && n <= ipv4ToInt('192.168.255.255')) ||
    (n >= ipv4ToInt('224.0.0.0') && n <= ipv4ToInt('255.255.255.255'))
  );
}

function isPrivateIpv6(ip) {
  const value = ip.toLowerCase();
  return (
    value === '::' ||
    value === '::1' ||
    value.startsWith('fc') ||
    value.startsWith('fd') ||
    value.startsWith('fe80:') ||
    value.startsWith('ff')
  );
}

export function isBlockedIp(address) {
  if (ALLOW_PRIVATE_URLS) return false;

  const version = net.isIP(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version === 6) return isPrivateIpv6(address);
  return true;
}

/**
 * Validate and resolve a URL to a specific public IP.
 * Returns { parsed, pinnedIp } — use pinnedIp with pinnedFetch() to prevent DNS rebinding.
 */
export async function assertPublicHttpUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    const err = new Error('Invalid URL');
    err.statusCode = 400;
    throw err;
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    const err = new Error('Only HTTP and HTTPS URLs are allowed');
    err.statusCode = 400;
    throw err;
  }

  const hostname = normalizeHost(parsed.hostname);
  if (!hostname || BLOCKED_HOSTS.has(hostname) || hostname.endsWith('.localhost')) {
    const err = new Error('Private or local URLs are not allowed');
    err.statusCode = 403;
    throw err;
  }

  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) {
      const err = new Error('Private or local URLs are not allowed');
      err.statusCode = 403;
      throw err;
    }
    return { parsed, pinnedIp: hostname };
  }

  let records;
  try {
    records = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    const err = new Error('URL host could not be resolved');
    err.statusCode = 400;
    throw err;
  }

  if (records.length === 0 || records.some((record) => isBlockedIp(record.address))) {
    const err = new Error('Private or local URLs are not allowed');
    err.statusCode = 403;
    throw err;
  }

  // Pin to the first validated public IP to prevent DNS rebinding (TOCTOU)
  const pinnedIp = records[0].address;
  return { parsed, pinnedIp };
}

/**
 * Fetch a URL using a pinned IP to prevent DNS rebinding attacks.
 * The TCP connection goes to pinnedIp; Host header and TLS SNI use the original hostname.
 */
export function pinnedFetch(urlString, pinnedIp, options = {}) {
  return new Promise((resolve, reject) => {
    let parsed;
    try { parsed = new URL(urlString); } catch (e) { return reject(e); }

    const isHttps = parsed.protocol === 'https:';
    const port = parsed.port ? Number(parsed.port) : (isHttps ? 443 : 80);
    const path = (parsed.pathname || '/') + (parsed.search || '');

    const reqOptions = {
      hostname: pinnedIp,       // connect to pinned IP — no DNS re-lookup
      port,
      path,
      method: options.method || 'GET',
      headers: {
        ...(options.headers || {}),
        'Host': parsed.hostname, // correct Host header for virtual hosting
      },
      servername: parsed.hostname, // TLS SNI — certificate validates against real hostname
      rejectUnauthorized: true,
      signal: options.signal,
    };

    const req = (isHttps ? https : http).request(reqOptions, resolve);
    req.on('error', reject);

    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        const err = new Error('AbortError');
        err.name = 'AbortError';
        req.destroy(err);
      });
    }

    req.end();
  });
}

export function resolveRedirectUrl(currentUrl, location) {
  try {
    return new URL(location, currentUrl).toString();
  } catch {
    const err = new Error('Invalid redirect URL');
    err.statusCode = 400;
    throw err;
  }
}

export { MAX_REDIRECTS };
