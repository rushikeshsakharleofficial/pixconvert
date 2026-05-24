/**
 * Post-build SEO prerender script.
 *
 * Reads the built dist/index.html and writes a per-route copy with correct
 * <title>, meta description, canonical, og:url, og:title, og:description,
 * twitter:title, twitter:description, robots (noindex), and a BreadcrumbList
 * JSON-LD schema injected into <head>.
 *
 * Usage: node scripts/prerender-seo.mjs
 * Runs automatically as part of "npm run build".
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGE_TITLES, PAGE_META, BASE_URL, NOINDEX_ROUTES } from '../src/seo/page-meta.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');

/** Escape text content (inside tags, not attributes) */
function escText(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Escape attribute values */
function escAttr(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Build a BreadcrumbList schema for a given route */
function buildBreadcrumb(route, title) {
  if (route === '/') return null;

  const crumbs = [{ name: 'Home', item: BASE_URL + '/' }];

  if (route.startsWith('/tools/')) {
    crumbs.push({ name: 'Tools', item: BASE_URL + '/tools' });
    // Use the part before " | PixConvert" or " — " as the leaf name
    const leafName = title.replace(/ \| PixConvert$/, '').replace(/ — .*/, '').trim();
    crumbs.push({ name: leafName, item: BASE_URL + route });
  } else {
    const leafName = title.replace(/ \| PixConvert$/, '').replace(/ — .*/, '').trim();
    crumbs.push({ name: leafName, item: BASE_URL + route });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: crumb.name,
      item: crumb.item,
    })),
  };
}

/** Inject route-specific SEO tags into the template HTML */
function injectSeo(template, { title, desc, canonical, noindex, schemaJson }) {
  let html = template;

  // -- Replace <title> text content --
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escText(title)}</title>`);

  // -- Replace meta description --
  html = html.replace(
    /(<meta\s[^>]*name="description"[^>]*content=")[^"]*(")/,
    `$1${escAttr(desc)}$2`
  );
  // Also handle reversed attribute order
  html = html.replace(
    /(<meta\s[^>]*content=")[^"]*("[^>]*name="description"[^>]*)/,
    `$1${escAttr(desc)}$2`
  );

  // -- Replace og:title --
  html = html.replace(
    /(<meta\s[^>]*property="og:title"[^>]*content=")[^"]*(")/,
    `$1${escAttr(title)}$2`
  );

  // -- Replace og:description --
  html = html.replace(
    /(<meta\s[^>]*property="og:description"[^>]*content=")[^"]*(")/,
    `$1${escAttr(desc)}$2`
  );

  // -- Replace twitter:title --
  html = html.replace(
    /(<meta\s[^>]*name="twitter:title"[^>]*content=")[^"]*(")/,
    `$1${escAttr(title)}$2`
  );

  // -- Replace twitter:description --
  html = html.replace(
    /(<meta\s[^>]*name="twitter:description"[^>]*content=")[^"]*(")/,
    `$1${escAttr(desc)}$2`
  );

  // -- Build extra tags to inject before </head> --
  const extras = [
    `<meta property="og:url" content="${escAttr(canonical)}" />`,
    `<link rel="canonical" href="${escAttr(canonical)}" />`,
  ];

  if (noindex) {
    extras.push(`<meta name="robots" content="noindex, follow" />`);
  }

  if (schemaJson) {
    extras.push(`<script type="application/ld+json">${schemaJson}</script>`);
  }

  html = html.replace('</head>', `    ${extras.join('\n    ')}\n  </head>`);

  return html;
}

// -- Read dist/index.html produced by vite build --
let template;
try {
  template = readFileSync(join(DIST, 'index.html'), 'utf8');
} catch (err) {
  console.error('ERROR: dist/index.html not found. Run "vite build" first.');
  process.exit(1);
}

let count = 0;

for (const [route, title] of Object.entries(PAGE_TITLES)) {
  const desc = PAGE_META[route] || PAGE_META['/'];
  const canonical = BASE_URL + route;
  const noindex = NOINDEX_ROUTES.has(route);
  const breadcrumb = buildBreadcrumb(route, title);
  const schemaJson = breadcrumb ? JSON.stringify(breadcrumb) : null;

  const html = injectSeo(template, { title, desc, canonical, noindex, schemaJson });

  if (route === '/') {
    // Homepage: overwrite dist/index.html in place
    writeFileSync(join(DIST, 'index.html'), html, 'utf8');
  } else {
    // All other routes: create dist/<route>/index.html
    const outDir = join(DIST, route);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'index.html'), html, 'utf8');
  }

  count++;
}

console.log(`✓ prerender-seo: wrote ${count} routes to dist/`);
