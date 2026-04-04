import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

describe('API rate limiting', () => {
  let app: Express;
  const prevMax = process.env.API_RATE_LIMIT_MAX;
  const prevWindow = process.env.API_RATE_LIMIT_WINDOW_MS;

  beforeAll(async () => {
    process.env.API_RATE_LIMIT_MAX = '5';
    process.env.API_RATE_LIMIT_WINDOW_MS = '60000';
    vi.resetModules();
    const mod = await import('../server');
    app = mod.app;
  });

  afterAll(() => {
    if (prevMax === undefined) delete process.env.API_RATE_LIMIT_MAX;
    else process.env.API_RATE_LIMIT_MAX = prevMax;
    if (prevWindow === undefined) delete process.env.API_RATE_LIMIT_WINDOW_MS;
    else process.env.API_RATE_LIMIT_WINDOW_MS = prevWindow;
  });

  it('exposes RateLimit headers and returns 429 after exceeding the limit', async () => {
    const path = '/api/___rate_limit_probe___';

    const first = await request(app).get(path);
    expect(first.status).not.toBe(429);
    expect(first.headers['ratelimit-limit']).toBe('5');
    expect(first.headers['ratelimit-remaining']).toBe('4');

    for (let i = 0; i < 4; i++) {
      const res = await request(app).get(path);
      expect(res.status).not.toBe(429);
    }

    const res = await request(app).get(path);
    expect(res.status).toBe(429);
    expect(res.body).toEqual({
      message: 'Too many requests, please try again later.',
    });
  });
});
