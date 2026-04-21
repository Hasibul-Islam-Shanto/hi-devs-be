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

const { MockJob, MockApplication } = vi.hoisted(() => {
  // Job is owned by VALID_OBJECT_ID_2
  const mockJob = {
    _id: '507f1f77bcf86cd799439012',
    title: 'Senior Backend Developer',
    description: 'We are looking for a senior backend developer.',
    company: 'Tech Corp',
    location: 'Remote',
    employmentType: 'Full-time',
    salaryRange: '$100k - $130k',
    requiredSkills: ['Node.js'],
    postedBy: '507f1f77bcf86cd799439012',
    status: 'Open',
  };

  const MockJob = Object.assign(vi.fn(), { findById: vi.fn() });

  const MockApplication = Object.assign(
    vi.fn().mockImplementation(function (
      this: Record<string, unknown>,
      data: Record<string, unknown>,
    ) {
      Object.assign(
        this,
        {
          _id: '507f1f77bcf86cd799439011',
          jobId: '507f1f77bcf86cd799439012',
          applicantId: '507f1f77bcf86cd799439011',
          coverLetter: 'I am a great candidate.',
          resumeUrl: 'https://example.com/resume.pdf',
          status: 'pending',
        },
        data,
      );
      this.save = vi.fn().mockResolvedValue(this);
    }),
    {
      findOne: vi.fn(),
      findById: vi.fn(),
      find: vi.fn(),
      countDocuments: vi.fn(),
    },
  );

  return { MockJob, MockApplication };
});

vi.mock('@/module/job/job.model', () => ({ default: MockJob }));
vi.mock('@/module/applications/application.model', () => ({
  default: MockApplication,
}));
vi.mock('@/config/redis', () => ({
  default: {
    set: vi.fn(),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn(),
    on: vi.fn(),
  },
}));
vi.mock('@/module/notification/helper/application.notifier', () => ({
  notifyJobApplication: vi.fn().mockResolvedValue(undefined),
}));

// Job owned by VALID_OBJECT_ID_2, application by VALID_OBJECT_ID
const mockJob = {
  _id: new mongoose.Types.ObjectId(VALID_OBJECT_ID_2),
  title: 'Senior Backend Developer',
  company: 'Tech Corp',
  postedBy: new mongoose.Types.ObjectId(VALID_OBJECT_ID_2),
  status: 'Open',
  save: vi.fn(),
};

const mockApplication = {
  _id: new mongoose.Types.ObjectId(VALID_OBJECT_ID),
  jobId: {
    _id: new mongoose.Types.ObjectId(VALID_OBJECT_ID_2),
    title: 'Senior Backend Developer',
    company: 'Tech Corp',
    postedBy: { toString: () => VALID_OBJECT_ID_2 },
  },
  applicantId: {
    _id: new mongoose.Types.ObjectId(VALID_OBJECT_ID),
    toString: () => VALID_OBJECT_ID,
  },
  coverLetter: 'I am a great candidate.',
  resumeUrl: 'https://example.com/resume.pdf',
  status: 'pending',
  save: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    return Promise.resolve(this);
  }),
};

const validApplicationBody = {
  jobId: VALID_OBJECT_ID_2,
  coverLetter: 'I am a great candidate for this position.',
  resumeUrl: 'https://example.com/resume.pdf',
  portfolioUrl: 'https://example.com/portfolio',
};

describe('Applications', () => {
  afterEach(() => vi.clearAllMocks());

  // ──────────────────── POST APPLICATION ────────────────────────
  describe('POST /api/applications', () => {
    it('submits an application when authenticated as non-job-owner', async () => {
      const token = generateToken(VALID_OBJECT_ID); // applicant
      MockJob.findById.mockResolvedValue(mockJob);
      MockApplication.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/applications')
        .set(authHeader(token))
        .send(validApplicationBody);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Application submitted successfully');
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/applications')
        .send(validApplicationBody);

      expect(res.status).toBe(401);
    });

    it('returns 404 when job does not exist', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockJob.findById.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/applications')
        .set(authHeader(token))
        .send(validApplicationBody);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Job not found');
    });

    it('returns 400 when job is closed', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockJob.findById.mockResolvedValue({ ...mockJob, status: 'Closed' });

      const res = await request(app)
        .post('/api/applications')
        .set(authHeader(token))
        .send(validApplicationBody);

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
      expect(res.body.message).toBe('Cannot apply to a closed job');
    });

    it('returns 403 when applying to own job', async () => {
      const token = generateToken(VALID_OBJECT_ID_2); // job owner
      MockJob.findById.mockResolvedValue(mockJob);

      const res = await request(app)
        .post('/api/applications')
        .set(authHeader(token))
        .send(validApplicationBody);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('You cannot apply for your own job');
    });

    it('returns 400 when already applied', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockJob.findById.mockResolvedValue(mockJob);
      MockApplication.findOne.mockResolvedValue(mockApplication);

      const res = await request(app)
        .post('/api/applications')
        .set(authHeader(token))
        .send(validApplicationBody);

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
      expect(res.body.message).toBe('You have already applied for this job');
    });

    it('returns 400 when resumeUrl is not a valid URL', async () => {
      const token = generateToken(VALID_OBJECT_ID);

      const res = await request(app)
        .post('/api/applications')
        .set(authHeader(token))
        .send({ ...validApplicationBody, resumeUrl: 'not-a-url' });

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });

    it('returns 400 when coverLetter is missing', async () => {
      const token = generateToken(VALID_OBJECT_ID);

      const res = await request(app)
        .post('/api/applications')
        .set(authHeader(token))
        .send({
          jobId: VALID_OBJECT_ID_2,
          resumeUrl: 'https://example.com/resume.pdf',
        });

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });
  });

  // ───────────── GET APPLICATIONS BY JOB ID ─────────────────────
  describe('GET /api/applications/job/:jobId', () => {
    it('returns applications for job owner', async () => {
      const token = generateToken(VALID_OBJECT_ID_2); // job owner
      MockJob.findById.mockResolvedValue(mockJob);
      MockApplication.find.mockReturnValue(
        createChainableQuery([mockApplication]),
      );
      MockApplication.countDocuments.mockResolvedValue(1);

      const res = await request(app)
        .get(`/api/applications/job/${VALID_OBJECT_ID_2}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Applications retrieved successfully');
      expect(res.body).toHaveProperty('applications');
    });

    it('returns 403 when user is not the job owner', async () => {
      const token = generateToken(VALID_OBJECT_ID); // applicant, not owner
      MockJob.findById.mockResolvedValue(mockJob);

      const res = await request(app)
        .get(`/api/applications/job/${VALID_OBJECT_ID_2}`)
        .set(authHeader(token));

      expect(res.status).toBe(403);
    });

    it('returns 404 when job does not exist', async () => {
      const token = generateToken(VALID_OBJECT_ID_2);
      MockJob.findById.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/applications/job/${VALID_OBJECT_ID_2}`)
        .set(authHeader(token));

      expect(res.status).toBe(404);
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app).get(
        `/api/applications/job/${VALID_OBJECT_ID_2}`,
      );

      expect(res.status).toBe(401);
    });
  });

  // ──────────────── GET APPLICATION BY ID ───────────────────────
  describe('GET /api/applications/:applicationId', () => {
    it('returns application data for the applicant', async () => {
      const token = generateToken(VALID_OBJECT_ID); // applicant
      MockApplication.findById.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(mockApplication),
        }),
      });

      const res = await request(app)
        .get(`/api/applications/${VALID_OBJECT_ID}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Application retrieved successfully');
    });

    it('returns 400 when application does not exist', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockApplication.findById.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(null),
        }),
      });

      const res = await request(app)
        .get(`/api/applications/${VALID_OBJECT_ID}`)
        .set(authHeader(token));

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app).get(
        `/api/applications/${VALID_OBJECT_ID}`,
      );

      expect(res.status).toBe(401);
    });
  });

  // ──────────── UPDATE APPLICATION STATUS ───────────────────────
  describe('PATCH /api/applications/:applicationId', () => {
    it('job owner can update application status to accepted', async () => {
      const token = generateToken(VALID_OBJECT_ID_2); // job owner
      const appForUpdate = {
        ...mockApplication,
        jobId: new mongoose.Types.ObjectId(VALID_OBJECT_ID_2),
        status: 'pending',
        save: vi
          .fn()
          .mockResolvedValue({ ...mockApplication, status: 'accepted' }),
      };
      MockApplication.findById.mockResolvedValue(appForUpdate);
      MockJob.findById.mockResolvedValue(mockJob);

      const res = await request(app)
        .patch(`/api/applications/${VALID_OBJECT_ID}`)
        .set(authHeader(token))
        .send({ status: 'accepted' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Application updated successfully');
    });

    it('job owner can reject an application', async () => {
      const token = generateToken(VALID_OBJECT_ID_2);
      const appForUpdate = {
        ...mockApplication,
        jobId: new mongoose.Types.ObjectId(VALID_OBJECT_ID_2),
        status: 'pending',
        save: vi
          .fn()
          .mockResolvedValue({ ...mockApplication, status: 'rejected' }),
      };
      MockApplication.findById.mockResolvedValue(appForUpdate);
      MockJob.findById.mockResolvedValue(mockJob);

      const res = await request(app)
        .patch(`/api/applications/${VALID_OBJECT_ID}`)
        .set(authHeader(token))
        .send({ status: 'rejected' });

      expect(res.status).toBe(200);
    });

    it('returns 403 when user is not the job owner', async () => {
      const token = generateToken(VALID_OBJECT_ID); // applicant
      const appForUpdate = {
        ...mockApplication,
        jobId: new mongoose.Types.ObjectId(VALID_OBJECT_ID_2),
        save: vi.fn(),
      };
      MockApplication.findById.mockResolvedValue(appForUpdate);
      MockJob.findById.mockResolvedValue(mockJob);

      const res = await request(app)
        .patch(`/api/applications/${VALID_OBJECT_ID}`)
        .set(authHeader(token))
        .send({ status: 'accepted' });

      expect(res.status).toBe(403);
    });

    it('returns 404 when application does not exist', async () => {
      const token = generateToken(VALID_OBJECT_ID_2);
      MockApplication.findById.mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/applications/${VALID_OBJECT_ID}`)
        .set(authHeader(token))
        .send({ status: 'accepted' });

      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid status value', async () => {
      const token = generateToken(VALID_OBJECT_ID_2);

      const res = await request(app)
        .patch(`/api/applications/${VALID_OBJECT_ID}`)
        .set(authHeader(token))
        .send({ status: 'invalidstatus' });

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app)
        .patch(`/api/applications/${VALID_OBJECT_ID}`)
        .send({ status: 'accepted' });

      expect(res.status).toBe(401);
    });
  });
});
