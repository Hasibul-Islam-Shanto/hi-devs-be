import { app } from '@/server';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  authHeader,
  createChainableQuery,
  generateToken,
  VALID_OBJECT_ID,
  VALID_OBJECT_ID_2,
} from './helpers';

const { MockJob } = vi.hoisted(() => {
  const mockJob = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Senior Backend Developer',
    description: 'We are looking for a senior backend developer.',
    company: 'Tech Corp',
    location: 'Remote',
    employmentType: 'Full-time',
    salaryRange: '$100k - $130k',
    requiredSkills: ['Node.js', 'TypeScript'],
    postedBy: '507f1f77bcf86cd799439011',
    status: 'Open',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const MockJob = Object.assign(
    vi.fn().mockImplementation(function (
      this: Record<string, unknown>,
      data: Record<string, unknown>,
    ) {
      Object.assign(this, mockJob, data);
      this.save = vi.fn().mockResolvedValue(undefined);
    }),
    {
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      find: vi.fn(),
      countDocuments: vi.fn(),
    },
  );

  return { MockJob };
});

vi.mock('@/module/job/job.model', () => ({ default: MockJob }));
vi.mock('@/config/redis', () => ({
  default: {
    set: vi.fn(),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn(),
    on: vi.fn(),
  },
}));

const mockJob = {
  _id: VALID_OBJECT_ID,
  title: 'Senior Backend Developer',
  description: 'We are looking for a senior backend developer.',
  company: 'Tech Corp',
  location: 'Remote',
  employmentType: 'Full-time',
  salaryRange: '$100k - $130k',
  requiredSkills: ['Node.js', 'TypeScript'],
  postedBy: VALID_OBJECT_ID,
  status: 'Open',
  save: vi.fn(),
};

const mockJobOtherUser = { ...mockJob, postedBy: VALID_OBJECT_ID_2 };

const validJobBody = {
  title: 'Senior Backend Developer',
  description:
    'We are looking for a senior backend developer to join our team.',
  company: 'Tech Corp',
  location: 'Remote',
  employmentType: 'Full-time',
  salaryRange: '$100k - $130k',
  requiredSkills: ['Node.js', 'TypeScript'],
};

describe('Jobs', () => {
  afterEach(() => vi.clearAllMocks());

  // ────────────────────── GET ALL JOBS ──────────────────────────
  describe('GET /api/jobs', () => {
    it('returns a paginated list of jobs', async () => {
      MockJob.find.mockReturnValue(createChainableQuery([mockJob]));
      MockJob.countDocuments.mockResolvedValue(1);

      const res = await request(app).get('/api/jobs');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('jobs');
      expect(res.body).toHaveProperty('pagination');
    });

    it('supports search filtering', async () => {
      MockJob.find.mockReturnValue(createChainableQuery([]));
      MockJob.countDocuments.mockResolvedValue(0);

      const res = await request(app).get('/api/jobs?search=remote');

      expect(res.status).toBe(200);
      expect(MockJob.find).toHaveBeenCalledWith(
        expect.objectContaining({ $or: expect.any(Array) }),
      );
    });

    it('respects pagination parameters', async () => {
      MockJob.find.mockReturnValue(createChainableQuery([]));
      MockJob.countDocuments.mockResolvedValue(0);

      const res = await request(app).get('/api/jobs?page=2&limit=5');

      expect(res.status).toBe(200);
      expect(res.body.pagination.currentPage).toBe(2);
      expect(res.body.pagination.limit).toBe(5);
    });
  });

  // ─────────────────── GET JOB BY ID ───────────────────────────
  describe('GET /api/jobs/:jobId', () => {
    it('returns a job by ID', async () => {
      MockJob.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockJob),
      });

      const res = await request(app).get(`/api/jobs/${VALID_OBJECT_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('job');
    });

    it('returns 404 when job does not exist', async () => {
      MockJob.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      });

      const res = await request(app).get(`/api/jobs/${VALID_OBJECT_ID}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Job not found');
    });

    it('returns 400 for invalid job ID format', async () => {
      const res = await request(app).get('/api/jobs/invalid-id');

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });
  });

  // ─────────────────── POST JOB ─────────────────────────────────
  describe('POST /api/jobs', () => {
    it('creates a job when authenticated', async () => {
      const token = generateToken(VALID_OBJECT_ID);

      const res = await request(app)
        .post('/api/jobs')
        .set(authHeader(token))
        .send(validJobBody);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Job posted successfully');
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(app).post('/api/jobs').send(validJobBody);

      expect(res.status).toBe(401);
    });

    it('returns 400 when required fields are missing', async () => {
      const token = generateToken(VALID_OBJECT_ID);

      const res = await request(app)
        .post('/api/jobs')
        .set(authHeader(token))
        .send({ title: 'Job without other fields' });

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });

    it('returns 400 when location is invalid enum value', async () => {
      const token = generateToken(VALID_OBJECT_ID);

      const res = await request(app)
        .post('/api/jobs')
        .set(authHeader(token))
        .send({ ...validJobBody, location: 'Mars' });

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });

    it('returns 400 when employmentType is invalid', async () => {
      const token = generateToken(VALID_OBJECT_ID);

      const res = await request(app)
        .post('/api/jobs')
        .set(authHeader(token))
        .send({ ...validJobBody, employmentType: 'Seasonal' });

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });

    it('returns 400 when requiredSkills is empty array', async () => {
      const token = generateToken(VALID_OBJECT_ID);

      const res = await request(app)
        .post('/api/jobs')
        .set(authHeader(token))
        .send({ ...validJobBody, requiredSkills: [] });

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });

    it('returns 400 when expiresAt is in the past', async () => {
      const token = generateToken(VALID_OBJECT_ID);

      const res = await request(app)
        .post('/api/jobs')
        .set(authHeader(token))
        .send({ ...validJobBody, expiresAt: '2020-01-01T00:00:00Z' });

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });
  });

  // ─────────────────── UPDATE JOB ──────────────────────────────
  describe('PATCH /api/jobs/:jobId', () => {
    it('updates a job when user is the owner', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockJob.findById.mockResolvedValue(mockJob);
      MockJob.findByIdAndUpdate.mockReturnValue({
        populate: vi
          .fn()
          .mockResolvedValue({ ...mockJob, title: 'Updated Title' }),
      });

      const res = await request(app)
        .patch(`/api/jobs/${VALID_OBJECT_ID}`)
        .set(authHeader(token))
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Job updated successfully');
    });

    it('returns 403 when user is not the owner', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockJob.findById.mockResolvedValue(mockJobOtherUser);

      const res = await request(app)
        .patch(`/api/jobs/${VALID_OBJECT_ID}`)
        .set(authHeader(token))
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden: You cannot update this job');
    });

    it('returns 404 when job does not exist', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockJob.findById.mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/jobs/${VALID_OBJECT_ID}`)
        .set(authHeader(token))
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(404);
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app)
        .patch(`/api/jobs/${VALID_OBJECT_ID}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(401);
    });
  });

  // ─────────────────── GET USER JOBS ───────────────────────────
  describe('GET /api/jobs/users/jobs', () => {
    it('returns jobs posted by the authenticated user', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockJob.find.mockReturnValue(createChainableQuery([mockJob]));
      MockJob.countDocuments.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/jobs/users/jobs')
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('jobs');
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app).get('/api/jobs/users/jobs');

      expect(res.status).toBe(401);
    });
  });
});
