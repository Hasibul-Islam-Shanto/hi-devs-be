import envs from '@/config/envs';
import rateLimit from 'express-rate-limit';

export const apiRateLimiter = rateLimit({
  windowMs: envs.apiRateLimit.windowMs,
  max: envs.apiRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
