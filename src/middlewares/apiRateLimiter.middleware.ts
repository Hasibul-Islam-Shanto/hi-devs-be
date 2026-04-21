import envs from '@/config/envs';
import redis from '@/config/redis';
import rateLimit, { Store } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';

// Use Redis store in non-test environments; fall back to in-memory store during tests
const store: Store | undefined =
  envs.env !== 'test'
    ? new RedisStore({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sendCommand: (command: string, ...args: string[]) =>
          redis.call(command, ...args) as any,
      })
    : undefined;

export const apiRateLimiter = rateLimit({
  windowMs: envs.apiRateLimit.windowMs,
  max: envs.apiRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
  store,
});
