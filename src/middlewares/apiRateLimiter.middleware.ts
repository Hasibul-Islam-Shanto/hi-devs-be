import envs from '@/config/envs';
import redis from '@/config/redis';
import rateLimit, { Store } from 'express-rate-limit';
import { RedisStore, type RedisReply } from 'rate-limit-redis';

// Use Redis store in non-test environments; fall back to in-memory store during tests
const store: Store | undefined =
  envs.env !== 'test'
    ? new RedisStore({
        sendCommand: (command: string, ...args: string[]) =>
          redis.call(command, ...args) as Promise<RedisReply>,
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
