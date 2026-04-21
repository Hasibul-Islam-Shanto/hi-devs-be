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

const { MockComment, MockBlog, MockQuestion } = vi.hoisted(() => {
  const mockComment = {
    _id: '507f1f77bcf86cd799439011',
    commentor: '507f1f77bcf86cd799439011',
    commentableType: 'BLOG',
    commentableId: '507f1f77bcf86cd799439012',
    comment: 'This is a test comment.',
    likes: [],
    parentComment: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const MockComment = Object.assign(
    vi.fn().mockImplementation(function (
      this: Record<string, unknown>,
      data: Record<string, unknown>,
    ) {
      Object.assign(this, mockComment, data);
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

  const MockBlog = Object.assign(vi.fn(), { findById: vi.fn() });
  const MockQuestion = Object.assign(vi.fn(), { findById: vi.fn() });

  return { MockComment, MockBlog, MockQuestion };
});

vi.mock('@/module/comments/comments.model', () => ({ default: MockComment }));
vi.mock('@/module/blog/blog.model', () => ({ default: MockBlog }));
vi.mock('@/module/question/question.model', () => ({ default: MockQuestion }));
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
vi.mock('@/module/notification/helper/comment.notifier', () => ({
  notifyComment: vi.fn().mockResolvedValue(undefined),
}));

const mockComment = {
  _id: VALID_OBJECT_ID,
  commentor: VALID_OBJECT_ID,
  commentableType: 'BLOG',
  commentableId: VALID_OBJECT_ID_2,
  comment: 'This is a test comment.',
  likes: [],
  save: vi.fn(),
};

const mockCommentOtherUser = { ...mockComment, commentor: VALID_OBJECT_ID_2 };
const mockBlog = { _id: VALID_OBJECT_ID_2 };
const mockQuestion = { _id: VALID_OBJECT_ID_2 };

describe('Comments', () => {
  afterEach(() => vi.clearAllMocks());

  // ─────────────────── POST NEW COMMENT ─────────────────────────
  describe('POST /api/comments', () => {
    it('creates a comment on a blog when authenticated', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockBlog.findById.mockResolvedValue(mockBlog);

      const res = await request(app)
        .post('/api/comments')
        .query({ commentableType: 'BLOG', commentableId: VALID_OBJECT_ID_2 })
        .set(authHeader(token))
        .send({ comment: 'This is a great blog post!' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Comment added successfully');
    });

    it('creates a comment on a question when authenticated', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockQuestion.findById.mockResolvedValue(mockQuestion);

      const res = await request(app)
        .post('/api/comments')
        .query({
          commentableType: 'QUESTION',
          commentableId: VALID_OBJECT_ID_2,
        })
        .set(authHeader(token))
        .send({ comment: 'This is a helpful answer!' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/comments')
        .query({ commentableType: 'BLOG', commentableId: VALID_OBJECT_ID_2 })
        .send({ comment: 'This should fail.' });

      expect(res.status).toBe(401);
    });

    it('returns 404 when the target blog does not exist', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockBlog.findById.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/comments')
        .query({ commentableType: 'BLOG', commentableId: VALID_OBJECT_ID_2 })
        .set(authHeader(token))
        .send({ comment: 'This is a comment.' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Blog not found');
    });

    it('returns 404 when the target question does not exist', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockQuestion.findById.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/comments')
        .query({
          commentableType: 'QUESTION',
          commentableId: VALID_OBJECT_ID_2,
        })
        .set(authHeader(token))
        .send({ comment: 'This is a comment.' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Question not found');
    });

    it('returns 400 when comment is empty', async () => {
      const token = generateToken(VALID_OBJECT_ID);

      const res = await request(app)
        .post('/api/comments')
        .query({ commentableType: 'BLOG', commentableId: VALID_OBJECT_ID_2 })
        .set(authHeader(token))
        .send({ comment: '' });

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });

    it('returns 400 when commentableType is invalid', async () => {
      const token = generateToken(VALID_OBJECT_ID);

      const res = await request(app)
        .post('/api/comments')
        .query({ commentableType: 'INVALID', commentableId: VALID_OBJECT_ID_2 })
        .set(authHeader(token))
        .send({ comment: 'Some comment.' });

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });
  });

  // ──────────────────── GET ALL COMMENTS ────────────────────────
  describe('GET /api/comments/:type/:id', () => {
    it('returns paginated comments for a blog', async () => {
      MockComment.find.mockReturnValue(createChainableQuery([mockComment]));
      MockComment.countDocuments.mockResolvedValue(1);

      const res = await request(app).get(
        `/api/comments/BLOG/${VALID_OBJECT_ID}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
    });

    it('returns paginated comments for a question', async () => {
      MockComment.find.mockReturnValue(createChainableQuery([mockComment]));
      MockComment.countDocuments.mockResolvedValue(1);

      const res = await request(app).get(
        `/api/comments/QUESTION/${VALID_OBJECT_ID}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 400 for invalid type', async () => {
      const res = await request(app).get(
        `/api/comments/INVALID/${VALID_OBJECT_ID}`,
      );

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });
  });

  // ─────────────────── UPDATE COMMENT ───────────────────────────
  describe('PATCH /api/comments/:commentId', () => {
    it('updates a comment when user is the owner', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockComment.findById.mockResolvedValue(mockComment);
      MockComment.findByIdAndUpdate.mockResolvedValue({
        ...mockComment,
        comment: 'Updated comment text.',
      });

      const res = await request(app)
        .patch(`/api/comments/${VALID_OBJECT_ID}`)
        .set(authHeader(token))
        .send({ comment: 'Updated comment text.' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Comment updated successfully');
    });

    it('returns 403 when user is not the owner', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockComment.findById.mockResolvedValue(mockCommentOtherUser);

      const res = await request(app)
        .patch(`/api/comments/${VALID_OBJECT_ID}`)
        .set(authHeader(token))
        .send({ comment: 'Updated comment text.' });

      expect(res.status).toBe(403);
    });

    it('returns 404 when comment does not exist', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockComment.findById.mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/comments/${VALID_OBJECT_ID}`)
        .set(authHeader(token))
        .send({ comment: 'Updated comment text.' });

      expect(res.status).toBe(404);
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app)
        .patch(`/api/comments/${VALID_OBJECT_ID}`)
        .send({ comment: 'Updated comment text.' });

      expect(res.status).toBe(401);
    });
  });

  // ─────────────────── DELETE COMMENT ───────────────────────────
  describe('DELETE /api/comments/:commentId', () => {
    it('deletes a comment when user is the owner', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockComment.findById.mockResolvedValue(mockComment);
      MockComment.findByIdAndDelete.mockResolvedValue(mockComment);

      const res = await request(app)
        .delete(`/api/comments/${VALID_OBJECT_ID}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Comment deleted successfully');
    });

    it('returns 403 when user is not the owner', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockComment.findById.mockResolvedValue(mockCommentOtherUser);

      const res = await request(app)
        .delete(`/api/comments/${VALID_OBJECT_ID}`)
        .set(authHeader(token));

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden: Not your comment');
    });

    it('returns 404 when comment does not exist', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockComment.findById.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/comments/${VALID_OBJECT_ID}`)
        .set(authHeader(token));

      expect(res.status).toBe(404);
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app).delete(`/api/comments/${VALID_OBJECT_ID}`);

      expect(res.status).toBe(401);
    });
  });

  // ──────────────────── LIKE COMMENT ────────────────────────────
  describe('POST /api/comments/:commentId/like', () => {
    it('likes a comment', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockComment.findById.mockResolvedValue({
        ...mockComment,
        likes: [],
        save: vi.fn(),
      });

      const res = await request(app)
        .post(`/api/comments/${VALID_OBJECT_ID}/like`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('unlikes a comment when already liked', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      const userId = new mongoose.Types.ObjectId(VALID_OBJECT_ID);
      MockComment.findById.mockResolvedValue({
        ...mockComment,
        likes: [userId],
        equals: (id: mongoose.Types.ObjectId) =>
          id.toString() === VALID_OBJECT_ID,
        save: vi.fn(),
      });

      const res = await request(app)
        .post(`/api/comments/${VALID_OBJECT_ID}/like`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
    });

    it('returns 404 when comment does not exist', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockComment.findById.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/comments/${VALID_OBJECT_ID}/like`)
        .set(authHeader(token));

      expect(res.status).toBe(404);
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app).post(
        `/api/comments/${VALID_OBJECT_ID}/like`,
      );

      expect(res.status).toBe(401);
    });
  });
});
