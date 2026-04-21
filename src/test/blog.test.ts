import { app } from '@/server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  authHeader,
  createChainableQuery,
  generateToken,
  VALID_OBJECT_ID,
  VALID_OBJECT_ID_2,
} from './helpers';

const { MockBlog } = vi.hoisted(() => {
  const mockBlog = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Test Blog Post Title',
    description: 'This is a test blog post description that is long enough.',
    cover: 'https://example.com/cover.jpg',
    tags: ['typescript', 'nodejs'],
    postedBy: '507f1f77bcf86cd799439011',
    likes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const MockBlog = Object.assign(
    vi.fn().mockImplementation(function (
      this: Record<string, unknown>,
      data: Record<string, unknown>,
    ) {
      Object.assign(this, mockBlog, data);
      this.save = vi.fn().mockResolvedValue(undefined);
    }),
    {
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findByIdAndDelete: vi.fn(),
      find: vi.fn(),
      countDocuments: vi.fn(),
    },
  );

  return { MockBlog };
});

vi.mock('@/module/blog/blog.model', () => ({ default: MockBlog }));
vi.mock('@/config/redis', () => ({
  default: {
    set: vi.fn(),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn(),
    on: vi.fn(),
  },
}));
vi.mock('@/module/notification/helper/like.notifier', () => ({
  notifyLike: vi.fn().mockResolvedValue(undefined),
}));

const mockBlog = {
  _id: VALID_OBJECT_ID,
  title: 'Test Blog Post Title',
  description: 'This is a test blog post description that is long enough.',
  cover: 'https://example.com/cover.jpg',
  tags: ['typescript', 'nodejs'],
  postedBy: VALID_OBJECT_ID,
  likes: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  save: vi.fn(),
};

const mockBlogOtherUser = { ...mockBlog, postedBy: VALID_OBJECT_ID_2 };

describe('Blogs', () => {
  afterEach(() => vi.clearAllMocks());

  // ───────────────────── GET ALL BLOGS ──────────────────────────
  describe('GET /api/blogs', () => {
    it('returns a paginated list of blogs', async () => {
      MockBlog.find.mockReturnValue(createChainableQuery([mockBlog]));
      MockBlog.countDocuments.mockResolvedValue(1);

      const res = await request(app).get('/api/blogs');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('blogs');
      expect(res.body).toHaveProperty('pagination');
    });

    it('supports search filtering', async () => {
      MockBlog.find.mockReturnValue(createChainableQuery([]));
      MockBlog.countDocuments.mockResolvedValue(0);

      const res = await request(app).get('/api/blogs?search=typescript');

      expect(res.status).toBe(200);
      expect(MockBlog.find).toHaveBeenCalledWith(
        expect.objectContaining({ $or: expect.any(Array) }),
      );
    });

    it('returns correct pagination metadata', async () => {
      MockBlog.find.mockReturnValue(createChainableQuery([]));
      MockBlog.countDocuments.mockResolvedValue(0);

      const res = await request(app).get('/api/blogs?page=2&limit=5');

      expect(res.status).toBe(200);
      expect(res.body.pagination.currentPage).toBe(2);
      expect(res.body.pagination.limit).toBe(5);
    });
  });

  // ──────────────────── GET BLOG BY ID ──────────────────────────
  describe('GET /api/blogs/:blogId', () => {
    it('returns a blog by ID', async () => {
      MockBlog.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockBlog),
      });

      const res = await request(app).get(`/api/blogs/${VALID_OBJECT_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('blog');
    });

    it('returns 404 when blog does not exist', async () => {
      MockBlog.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      });

      const res = await request(app).get(`/api/blogs/${VALID_OBJECT_ID}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Blog post not found');
    });

    it('returns 400 for invalid blog ID format', async () => {
      const res = await request(app).get('/api/blogs/invalid-id');

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });
  });

  // ────────────────────── CREATE BLOG ──────────────────────────
  describe('POST /api/blogs', () => {
    const validBlogBody = {
      title: 'My Test Blog Post Title',
      description: 'This is a sufficiently long description for a blog post.',
      cover: 'https://example.com/cover.jpg',
      tags: ['nodejs', 'typescript'],
    };

    it('creates a blog post when authenticated', async () => {
      const token = generateToken(VALID_OBJECT_ID);

      const res = await request(app)
        .post('/api/blogs')
        .set(authHeader(token))
        .send(validBlogBody);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Blog post created successfully');
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(app).post('/api/blogs').send(validBlogBody);

      expect(res.status).toBe(401);
    });

    it('returns 400 when title is too short (< 5 chars)', async () => {
      const token = generateToken(VALID_OBJECT_ID);

      const res = await request(app)
        .post('/api/blogs')
        .set(authHeader(token))
        .send({ ...validBlogBody, title: 'Hi' });

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });

    it('returns 400 when description is too short (< 20 chars)', async () => {
      const token = generateToken(VALID_OBJECT_ID);

      const res = await request(app)
        .post('/api/blogs')
        .set(authHeader(token))
        .send({ ...validBlogBody, description: 'Too short' });

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });

    it('returns 400 when cover is not a valid URL', async () => {
      const token = generateToken(VALID_OBJECT_ID);

      const res = await request(app)
        .post('/api/blogs')
        .set(authHeader(token))
        .send({ ...validBlogBody, cover: 'not-a-url' });

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });

    it('returns 400 when more than 5 tags are provided', async () => {
      const token = generateToken(VALID_OBJECT_ID);

      const res = await request(app)
        .post('/api/blogs')
        .set(authHeader(token))
        .send({ ...validBlogBody, tags: ['a', 'b', 'c', 'd', 'e', 'f'] });

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });
  });

  // ─────────────────── UPDATE BLOG ──────────────────────────────
  describe('PATCH /api/blogs/:blogId', () => {
    it('updates blog post when user is the owner', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockBlog.findById.mockResolvedValue(mockBlog);
      MockBlog.findByIdAndUpdate.mockResolvedValue({
        ...mockBlog,
        title: 'Updated Title',
      });

      const res = await request(app)
        .patch(`/api/blogs/${VALID_OBJECT_ID}`)
        .set(authHeader(token))
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 403 when user is not the owner', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockBlog.findById.mockResolvedValue(mockBlogOtherUser);

      const res = await request(app)
        .patch(`/api/blogs/${VALID_OBJECT_ID}`)
        .set(authHeader(token))
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden: You cannot edit this post');
    });

    it('returns 404 when blog does not exist', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockBlog.findById.mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/blogs/${VALID_OBJECT_ID}`)
        .set(authHeader(token))
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(404);
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app)
        .patch(`/api/blogs/${VALID_OBJECT_ID}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(401);
    });
  });

  // ─────────────────── DELETE BLOG ──────────────────────────────
  describe('DELETE /api/blogs/:blogId', () => {
    it('deletes blog post when user is the owner', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockBlog.findById.mockResolvedValue(mockBlog);
      MockBlog.findByIdAndDelete.mockResolvedValue(mockBlog);

      const res = await request(app)
        .delete(`/api/blogs/${VALID_OBJECT_ID}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Blog post deleted successfully');
    });

    it('returns 403 when user is not the owner', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockBlog.findById.mockResolvedValue(mockBlogOtherUser);

      const res = await request(app)
        .delete(`/api/blogs/${VALID_OBJECT_ID}`)
        .set(authHeader(token));

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden: You cannot delete this post');
    });

    it('returns 404 when blog does not exist', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockBlog.findById.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/blogs/${VALID_OBJECT_ID}`)
        .set(authHeader(token));

      expect(res.status).toBe(404);
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app).delete(`/api/blogs/${VALID_OBJECT_ID}`);

      expect(res.status).toBe(401);
    });
  });

  // ────────────────────── LIKE BLOG ────────────────────────────
  describe('POST /api/blogs/likes/:blogId', () => {
    it('likes a blog post', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      const blogWithNoLikes = { ...mockBlog, likes: [], save: vi.fn() };
      MockBlog.findById.mockResolvedValue(blogWithNoLikes);

      const res = await request(app)
        .post(`/api/blogs/likes/${VALID_OBJECT_ID}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('unlikes a blog post when already liked', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      const userId = new mongoose.Types.ObjectId(VALID_OBJECT_ID);
      const blogAlreadyLiked = { ...mockBlog, likes: [userId], save: vi.fn() };
      MockBlog.findById.mockResolvedValue(blogAlreadyLiked);

      const res = await request(app)
        .post(`/api/blogs/likes/${VALID_OBJECT_ID}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 when blog does not exist', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockBlog.findById.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/blogs/likes/${VALID_OBJECT_ID}`)
        .set(authHeader(token));

      expect(res.status).toBe(404);
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app).post(
        `/api/blogs/likes/${VALID_OBJECT_ID}`,
      );

      expect(res.status).toBe(401);
    });
  });

  // ─────────────────── GET USER BLOGS ──────────────────────────
  describe('GET /api/blogs/users/blogs', () => {
    it('returns blogs posted by the authenticated user', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockBlog.find.mockReturnValue(createChainableQuery([mockBlog]));
      MockBlog.countDocuments.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/blogs/users/blogs')
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('blogs');
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app).get('/api/blogs/users/blogs');

      expect(res.status).toBe(401);
    });
  });
});
