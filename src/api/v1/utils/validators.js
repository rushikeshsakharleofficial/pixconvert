/**
 * Parse and validate page range strings like "1-3,5,8".
 * Returns array of 0-based page indices or null on error.
 */
export function parsePages(pagesStr, totalPages) {
  if (!pagesStr) return null;

  const indices = new Set();
  const parts = pagesStr.split(',').map((s) => s.trim());

  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
        return null;
      }
      for (let i = start; i <= end; i++) indices.add(i - 1);
    } else {
      const num = Number(part);
      if (isNaN(num) || num < 1 || num > totalPages) return null;
      indices.add(num - 1);
    }
  }

  return [...indices].sort((a, b) => a - b);
}

/**
 * Validate angle parameter for rotation.
 */
export function parseAngle(angleStr) {
  const angle = parseInt(angleStr, 10);
  if (![90, 180, 270].includes(angle)) return null;
  return angle;
}

/**
 * Validate quality parameter.
 */
export function parseQuality(qualityStr, defaultVal = 'medium') {
  const valid = ['low', 'medium', 'high'];
  if (!qualityStr) return defaultVal;
  return valid.includes(qualityStr) ? qualityStr : defaultVal;
}

/**
 * Validate numeric parameter within range.
 */
export function parseNumber(val, min, max, defaultVal) {
  const num = Number(val);
  if (isNaN(num)) return defaultVal;
  return Math.max(min, Math.min(max, num));
}

/**
 * Validate position parameter.
 */
export function parsePosition(posStr, defaultVal = 'bottom-center') {
  const valid = [
    'top-left', 'top-center', 'top-right',
    'center-left', 'center', 'center-right',
    'bottom-left', 'bottom-center', 'bottom-right',
  ];
  if (!posStr) return defaultVal;
  return valid.includes(posStr) ? posStr : defaultVal;
}
