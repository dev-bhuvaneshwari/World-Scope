import rateLimit from 'express-rate-limit';
import config from '../config/env.js';

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    error: 'AI summary rate limit reached. Please wait before requesting another summary.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export { apiLimiter, aiLimiter };
