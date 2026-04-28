import dns from 'dns/promises';
import net from 'net';

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
    return parsed;
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

  return parsed;
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
