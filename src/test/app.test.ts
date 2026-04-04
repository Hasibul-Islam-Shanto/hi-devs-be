import { app } from '@/app'; // Instead of "@/server"
import request from 'supertest';
import { describe, expect, it } from 'vitest';

describe('GET /api-docs', () => {
  it('should return Swagger UI (following redirect)', async () => {
    const response = await request(app).get('/api-docs').redirects(1);

    expect(response.status).toBe(200);
    expect(response.text.toLowerCase()).toContain('swagger');
  });
});
