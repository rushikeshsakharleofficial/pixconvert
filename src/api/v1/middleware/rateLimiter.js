import rateLimit from 'express-rate-limit';

const API_RATE_LIMIT = parseInt(process.env.API_RATE_LIMIT || '10', 10);

export const apiRateLimiter = rateLimit({
  windowMs: 1000,
  max: API_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: `Rate limit exceeded. Max ${API_RATE_LIMIT} requests per second.` },
});
