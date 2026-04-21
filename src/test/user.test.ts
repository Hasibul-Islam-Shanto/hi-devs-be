import { app } from '@/server';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  authHeader,
  createChainableQuery,
  createMockUser,
  generateToken,
  VALID_OBJECT_ID,
} from './helpers';

const { MockUser } = vi.hoisted(() => {
  const mockUser = {
    _id: { toString: () => '507f1f77bcf86cd799439011' },
    name: 'Test User',
    email: 'test@example.com',
    username: 'testuser',
    bio: '',
    location: '',
    website: '',
    socialLinks: { twitter: '', linkedin: '', github: '' },
    skills: [],
    isVerified: false,
    profileImage: 'https://avatar.iran.liara.run/public/boy',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const MockUser = Object.assign(
    vi.fn().mockImplementation(function (
      this: Record<string, unknown>,
      data: Record<string, unknown>,
    ) {
      Object.assign(this, mockUser, data);
      this.save = vi.fn().mockResolvedValue(undefined);
    }),
    {
      findOne: vi.fn(),
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      find: vi.fn(),
      countDocuments: vi.fn(),
    },
  );

  return { MockUser };
});

vi.mock('@/module/user/user.model', () => ({
  default: MockUser,
  User: MockUser,
}));
vi.mock('@/config/redis', () => ({
  default: {
    set: vi.fn(),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn(),
    on: vi.fn(),
  },
}));

const mockUser = createMockUser();

describe('Users', () => {
  afterEach(() => vi.clearAllMocks());

  // ─────────────────────── GET ALL USERS ───────────────────────────
  describe('GET /api/users', () => {
    it('returns paginated list of users when authenticated', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockUser.find.mockReturnValue(createChainableQuery([mockUser]));
      MockUser.countDocuments.mockResolvedValue(1);

      const res = await request(app).get('/api/users').set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('users');
      expect(res.body).toHaveProperty('pagination');
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app).get('/api/users');

      expect(res.status).toBe(401);
    });

    it('supports search query parameter', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockUser.find.mockReturnValue(createChainableQuery([mockUser]));
      MockUser.countDocuments.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/users?search=test')
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(MockUser.find).toHaveBeenCalledWith(
        expect.objectContaining({ $or: expect.any(Array) }),
      );
    });

    it('supports pagination parameters', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockUser.find.mockReturnValue(createChainableQuery([]));
      MockUser.countDocuments.mockResolvedValue(0);

      const res = await request(app)
        .get('/api/users?page=2&limit=5')
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.pagination.currentPage).toBe(2);
      expect(res.body.pagination.limit).toBe(5);
    });
  });

  // ────────────────────── GET USER PROFILE ─────────────────────────
  describe('GET /api/users/profile', () => {
    it('returns authenticated user profile', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockUser.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      });

      const res = await request(app)
        .get('/api/users/profile')
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toHaveProperty('email', mockUser.email);
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app).get('/api/users/profile');

      expect(res.status).toBe(401);
    });

    it('returns 404 when user does not exist', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockUser.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .get('/api/users/profile')
        .set(authHeader(token));

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });
  });

  // ────────────────────── UPDATE USER PROFILE ──────────────────────
  describe('PATCH /api/users/profile/:id', () => {
    it('updates user profile successfully', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      const updatedUser = { ...mockUser, bio: 'Updated bio' };
      MockUser.findById.mockResolvedValue(mockUser);
      MockUser.findByIdAndUpdate.mockReturnValue({
        select: vi.fn().mockResolvedValue(updatedUser),
      });

      const res = await request(app)
        .patch(`/api/users/profile/${VALID_OBJECT_ID}`)
        .set(authHeader(token))
        .send({ bio: 'Updated bio' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app)
        .patch(`/api/users/profile/${VALID_OBJECT_ID}`)
        .send({ bio: 'Updated bio' });

      expect(res.status).toBe(401);
    });

    it('returns 404 when user does not exist', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockUser.findById.mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/users/profile/${VALID_OBJECT_ID}`)
        .set(authHeader(token))
        .send({ bio: 'Updated bio' });

      expect(res.status).toBe(404);
    });
  });

  // ────────────────────── GET USER BY ID ───────────────────────────
  describe('GET /api/users/:id', () => {
    it('returns a user by ID when authenticated', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockUser.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      });

      const res = await request(app)
        .get(`/api/users/${VALID_OBJECT_ID}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('user');
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app).get(`/api/users/${VALID_OBJECT_ID}`);

      expect(res.status).toBe(401);
    });
  });
});
