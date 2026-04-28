import rateLimit from 'express-rate-limit';

// In-memory store for process limiting
const processRequests = new Map();

const API_RATE_LIMIT = parseInt(process.env.API_RATE_LIMIT || '10', 10);
const PROCESS_LIMIT = parseInt(process.env.PROCESS_LIMIT || '10', 10);
const PROCESS_WINDOW_MS = 30 * 1000; // 30 seconds

/**
 * Check if process limit is exceeded
 * Returns true if under limit, false if exceeded
 */
const checkProcessLimit = (ip) => {
  const now = Date.now();
  const windowStart = now - PROCESS_WINDOW_MS;
  
  // Clean old entries
  const timestamps = processRequests.get(ip) || [];
  const recentTimestamps = timestamps.filter(ts => ts > windowStart);
  
  if (recentTimestamps.length >= PROCESS_LIMIT) {
    return false;
  }
  
  // Add current timestamp
  recentTimestamps.push(now);
  processRequests.set(ip, recentTimestamps);
  
  return true;
};

export const apiRateLimiter = rateLimit({
  windowMs: 1000,
  max: API_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check and tools list
    return req.path === '/health' || req.path === '/tools';
  },
  message: { success: false, error: `Rate limit exceeded. Max ${API_RATE_LIMIT} requests per second.` },
});

export const processLimiter = rateLimit({
  windowMs: PROCESS_WINDOW_MS,
  max: PROCESS_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting check but still count the request
    return false;
  },
  message: { success: false, error: `Process limit exceeded. Max ${PROCESS_LIMIT} conversions per 30 seconds. Please wait.` },
  // Custom handler to use our custom check
  handler: (req, res) => {
    res.status(429).json({ 
      success: false, 
      error: `Process limit exceeded. Max ${PROCESS_LIMIT} conversions per 30 seconds. Please wait.` 
    });
  },
});
