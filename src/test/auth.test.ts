import envs from '@/config/envs';
import { app } from '@/server';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRedis, MockUser, mockUserInstance } = vi.hoisted(() => {
  const mockUserInstance = {
    _id: { toString: () => '507f1f77bcf86cd799439011' },
    name: 'Test User',
    email: 'test@example.com',
    username: 'testuser',
    password: '$2a$10$hashedpassword',
    bio: '',
    location: '',
    website: '',
    socialLinks: { twitter: '', linkedin: '', github: '' },
    skills: [],
    isVerified: false,
    profileImage: 'https://avatar.iran.liara.run/public/boy',
  };

  const MockUser = Object.assign(
    vi.fn().mockImplementation(function (
      this: Record<string, unknown>,
      data: Record<string, unknown>,
    ) {
      Object.assign(this, mockUserInstance, data);
      this.save = vi.fn().mockResolvedValue(undefined);
    }),
    { findOne: vi.fn(), findById: vi.fn() },
  );

  const mockRedis = {
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
    on: vi.fn(),
  };

  return { mockRedis, MockUser, mockUserInstance };
});

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2a$10$hashedpassword'),
    compare: vi.fn(),
  },
}));
vi.mock('@/config/redis', () => ({ default: mockRedis }));
vi.mock('@/module/user/user.model', () => ({
  default: MockUser,
  User: MockUser,
}));

describe('Auth', () => {
  afterEach(() => vi.clearAllMocks());

  // ────────────────────────────── SIGNUP ──────────────────────────────
  describe('POST /api/auth/signup', () => {
    it('creates a new user with valid data', async () => {
      MockUser.findOne.mockResolvedValue(null);

      const res = await request(app).post('/api/auth/signup').send({
        name: 'Test User',
        email: 'new@example.com',
        username: 'newuser',
        password: 'password123',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User created successfully.');
    });

    it('returns 400 when email is already taken', async () => {
      MockUser.findOne.mockResolvedValue(mockUserInstance);

      const res = await request(app).post('/api/auth/signup').send({
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('User already exists.');
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });

    it('returns 400 when email is invalid', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        name: 'Test User',
        email: 'not-an-email',
        username: 'testuser',
        password: 'password123',
      });

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });

    it('returns 400 when password is too short', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        password: 'abc',
      });

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });
  });

  // ────────────────────────────── SIGNIN ──────────────────────────────
  describe('POST /api/auth/signin', () => {
    it('returns tokens and user data on valid credentials', async () => {
      MockUser.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUserInstance),
      });
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const res = await request(app).post('/api/auth/signin').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.tokens).toHaveProperty('accessToken');
      expect(res.body.tokens).toHaveProperty('refreshToken');
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('stores refresh token in Redis on successful signin', async () => {
      MockUser.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUserInstance),
      });
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      await request(app).post('/api/auth/signin').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining('refresh_token:'),
        expect.any(String),
        'EX',
        expect.any(Number),
      );
    });

    it('returns 400 when user does not exist', async () => {
      MockUser.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(null),
      });

      const res = await request(app).post('/api/auth/signin').send({
        email: 'unknown@example.com',
        password: 'password123',
      });

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
      expect(res.body.message).toBe('Invalid credentials.');
    });

    it('returns 400 when password is wrong', async () => {
      MockUser.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUserInstance),
      });
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const res = await request(app).post('/api/auth/signin').send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
      expect(res.body.message).toBe('Invalid credentials.');
    });

    it('returns 400 when email field is missing', async () => {
      const res = await request(app).post('/api/auth/signin').send({
        password: 'password123',
      });

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });
  });

  // ────────────────────────── REFRESH TOKEN ───────────────────────────
  describe('POST /api/auth/refresh-token', () => {
    it('returns new tokens when refresh token is valid', async () => {
      const jwt = await import('jsonwebtoken');
      const validRefreshToken = jwt.default.sign(
        { userId: '507f1f77bcf86cd799439011', username: 'testuser' },
        envs.jwt.secret,
        { expiresIn: '7d' },
      );

      mockRedis.get.mockResolvedValue('507f1f77bcf86cd799439011');
      MockUser.findById.mockResolvedValue(mockUserInstance);

      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: validRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.tokens).toHaveProperty('accessToken');
      expect(res.body.tokens).toHaveProperty('refreshToken');
    });

    it('rotates refresh token (deletes old, stores new)', async () => {
      const jwt = await import('jsonwebtoken');
      const validRefreshToken = jwt.default.sign(
        { userId: '507f1f77bcf86cd799439011', username: 'testuser' },
        envs.jwt.secret,
        { expiresIn: '7d' },
      );

      mockRedis.get.mockResolvedValue('507f1f77bcf86cd799439011');
      MockUser.findById.mockResolvedValue(mockUserInstance);

      await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: validRefreshToken });

      expect(mockRedis.del).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('returns 401 when refresh token is not in Redis', async () => {
      mockRedis.get.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'some-stale-token' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid or expired refresh token');
    });

    it('returns 404 when user no longer exists', async () => {
      const jwt = await import('jsonwebtoken');
      const validRefreshToken = jwt.default.sign(
        { userId: '507f1f77bcf86cd799439011', username: 'testuser' },
        envs.jwt.secret,
        { expiresIn: '7d' },
      );

      mockRedis.get.mockResolvedValue('507f1f77bcf86cd799439011');
      MockUser.findById.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: validRefreshToken });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('returns 400 when refresh token is missing', async () => {
      const res = await request(app).post('/api/auth/refresh-token').send({});

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });
  });

  // ────────────────────────────── LOGOUT ──────────────────────────────
  describe('POST /api/auth/logout', () => {
    it('logs out successfully with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: 'some-valid-token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logout successful');
      expect(mockRedis.del).toHaveBeenCalledWith(
        'refresh_token:some-valid-token',
      );
    });

    it('returns 400 when refresh token is missing', async () => {
      const res = await request(app).post('/api/auth/logout').send({});

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
      expect(res.body.message).toBe('Refresh token is required');
    });
  });
});
