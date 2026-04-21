import { vi } from 'vitest';

// Mock ioredis before any module imports it
vi.mock('ioredis', () => {
  const Redis = vi.fn().mockImplementation(() => ({
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
    on: vi.fn(),
  }));
  return { default: Redis };
});

// Mock database connection to prevent actual MongoDB connections in tests
vi.mock('@/database', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

// Silence console output during tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
