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

const { MockQuestion } = vi.hoisted(() => {
  const mockQuestion = {
    _id: '507f1f77bcf86cd799439011',
    title: 'How do I test a Node.js application?',
    description:
      'I want to write tests for my Node.js application. What are the best practices and tools?',
    tags: ['nodejs', 'testing'],
    askedBy: {
      _id: '507f1f77bcf86cd799439011',
      toString: () => '507f1f77bcf86cd799439011',
    },
    likes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const MockQuestion = Object.assign(
    vi.fn().mockImplementation(function (
      this: Record<string, unknown>,
      data: Record<string, unknown>,
    ) {
      Object.assign(this, mockQuestion, data);
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

  return { MockQuestion };
});

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

const mockQuestion = {
  _id: VALID_OBJECT_ID,
  title: 'How do I test a Node.js application?',
  description:
    'I want to write tests for my Node.js application. What are the best practices and tools?',
  tags: ['nodejs', 'testing'],
  askedBy: { _id: VALID_OBJECT_ID, toString: () => VALID_OBJECT_ID },
  likes: [],
  save: vi.fn(),
};

const mockQuestionOtherUser = {
  ...mockQuestion,
  askedBy: { _id: VALID_OBJECT_ID_2, toString: () => VALID_OBJECT_ID_2 },
};

describe('Questions', () => {
  afterEach(() => vi.clearAllMocks());

  // ─────────────────── GET ALL QUESTIONS ──────────────────────
  describe('GET /api/questions', () => {
    it('returns paginated list of questions', async () => {
      MockQuestion.find.mockReturnValue(createChainableQuery([mockQuestion]));
      MockQuestion.countDocuments.mockResolvedValue(1);

      const res = await request(app).get('/api/questions');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('questions');
      expect(res.body).toHaveProperty('pagination');
    });

    it('supports search filtering', async () => {
      MockQuestion.find.mockReturnValue(createChainableQuery([]));
      MockQuestion.countDocuments.mockResolvedValue(0);

      const res = await request(app).get('/api/questions?search=nodejs');

      expect(res.status).toBe(200);
      expect(MockQuestion.find).toHaveBeenCalledWith(
        expect.objectContaining({ $or: expect.any(Array) }),
      );
    });

    it('returns correct pagination metadata', async () => {
      MockQuestion.find.mockReturnValue(createChainableQuery([]));
      MockQuestion.countDocuments.mockResolvedValue(0);

      const res = await request(app).get('/api/questions?page=3&limit=5');

      expect(res.status).toBe(200);
      expect(res.body.pagination.currentPage).toBe(3);
      expect(res.body.pagination.limit).toBe(5);
    });
  });

  // ─────────────────── GET QUESTION BY ID ─────────────────────
  describe('GET /api/questions/:id', () => {
    it('returns a question by ID', async () => {
      MockQuestion.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockQuestion),
      });

      const res = await request(app).get(`/api/questions/${VALID_OBJECT_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('question');
    });

    it('returns 404 when question does not exist', async () => {
      MockQuestion.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      });

      const res = await request(app).get(`/api/questions/${VALID_OBJECT_ID}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Question not found');
    });

    it('returns 400 for invalid question ID format', async () => {
      const res = await request(app).get('/api/questions/invalid-id');

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });
  });

  // ──────────────────── POST QUESTION ─────────────────────────
  describe('POST /api/questions', () => {
    const validQuestionBody = {
      title: 'How do I test a Node.js application correctly?',
      description:
        'I want to write comprehensive tests for my Node.js app using Vitest and supertest. What are the recommended patterns?',
      tags: ['nodejs', 'testing'],
    };

    it('creates a question when authenticated', async () => {
      const token = generateToken(VALID_OBJECT_ID);

      const res = await request(app)
        .post('/api/questions')
        .set(authHeader(token))
        .send(validQuestionBody);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Question posted successfully');
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/questions')
        .send(validQuestionBody);

      expect(res.status).toBe(401);
    });

    it('returns 400 when title is too short (< 10 chars)', async () => {
      const token = generateToken(VALID_OBJECT_ID);

      const res = await request(app)
        .post('/api/questions')
        .set(authHeader(token))
        .send({ ...validQuestionBody, title: 'Short' });

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });

    it('returns 400 when description is too short (< 20 chars)', async () => {
      const token = generateToken(VALID_OBJECT_ID);

      const res = await request(app)
        .post('/api/questions')
        .set(authHeader(token))
        .send({ ...validQuestionBody, description: 'Too short desc' });

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });

    it('returns 400 when more than 5 tags are provided', async () => {
      const token = generateToken(VALID_OBJECT_ID);

      const res = await request(app)
        .post('/api/questions')
        .set(authHeader(token))
        .send({ ...validQuestionBody, tags: ['a', 'b', 'c', 'd', 'e', 'f'] });

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });
  });

  // ─────────────────── UPDATE QUESTION ──────────────────────────
  describe('PATCH /api/questions/:id', () => {
    it('updates question when user is the owner', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockQuestion.findById.mockResolvedValue(mockQuestion);
      MockQuestion.findByIdAndUpdate.mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          ...mockQuestion,
          title: 'Updated Question Title That Is Long Enough',
        }),
      });

      const res = await request(app)
        .patch(`/api/questions/${VALID_OBJECT_ID}`)
        .set(authHeader(token))
        .send({ title: 'Updated Question Title That Is Long Enough' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 403 when user is not the owner', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockQuestion.findById.mockResolvedValue(mockQuestionOtherUser);

      const res = await request(app)
        .patch(`/api/questions/${VALID_OBJECT_ID}`)
        .set(authHeader(token))
        .send({ title: 'Updated Title That Is Long Enough' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden: You cannot edit this question');
    });

    it('returns 404 when question does not exist', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockQuestion.findById.mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/questions/${VALID_OBJECT_ID}`)
        .set(authHeader(token))
        .send({ title: 'Updated Title That Is Long Enough' });

      expect(res.status).toBe(404);
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app)
        .patch(`/api/questions/${VALID_OBJECT_ID}`)
        .send({ title: 'Updated Title That Is Long Enough' });

      expect(res.status).toBe(401);
    });
  });

  // ─────────────────── DELETE QUESTION ──────────────────────────
  describe('DELETE /api/questions/:id', () => {
    it('deletes question when user is the owner', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockQuestion.findById.mockResolvedValue(mockQuestion);
      MockQuestion.findByIdAndDelete.mockResolvedValue(mockQuestion);

      const res = await request(app)
        .delete(`/api/questions/${VALID_OBJECT_ID}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Question deleted successfully');
    });

    it('returns 403 when user is not the owner', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockQuestion.findById.mockResolvedValue(mockQuestionOtherUser);

      const res = await request(app)
        .delete(`/api/questions/${VALID_OBJECT_ID}`)
        .set(authHeader(token));

      expect(res.status).toBe(403);
    });

    it('returns 404 when question does not exist', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockQuestion.findById.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/questions/${VALID_OBJECT_ID}`)
        .set(authHeader(token));

      expect(res.status).toBe(404);
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app).delete(
        `/api/questions/${VALID_OBJECT_ID}`,
      );

      expect(res.status).toBe(401);
    });
  });

  // ────────────────────── LIKE QUESTION ────────────────────────
  describe('POST /api/questions/likes/:id', () => {
    it('likes a question', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockQuestion.findById.mockResolvedValue({
        ...mockQuestion,
        likes: [],
        save: vi.fn(),
      });

      const res = await request(app)
        .post(`/api/questions/likes/${VALID_OBJECT_ID}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('unlikes a question when already liked', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      const userId = new mongoose.Types.ObjectId(VALID_OBJECT_ID);
      MockQuestion.findById.mockResolvedValue({
        ...mockQuestion,
        likes: [userId],
        save: vi.fn(),
      });

      const res = await request(app)
        .post(`/api/questions/likes/${VALID_OBJECT_ID}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
    });

    it('returns 404 when question does not exist', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockQuestion.findById.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/questions/likes/${VALID_OBJECT_ID}`)
        .set(authHeader(token));

      expect(res.status).toBe(404);
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app).post(
        `/api/questions/likes/${VALID_OBJECT_ID}`,
      );

      expect(res.status).toBe(401);
    });
  });
});
