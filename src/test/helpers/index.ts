import envs from '@/config/envs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { vi } from 'vitest';

export const VALID_OBJECT_ID = '507f1f77bcf86cd799439011';
export const VALID_OBJECT_ID_2 = '507f1f77bcf86cd799439012';
export const VALID_OBJECT_ID_3 = '507f1f77bcf86cd799439013';

/**
 * Generate a JWT token using the same secret as the running app (from envs).
 * This ensures tokens are always valid regardless of the configured JWT_SECRET.
 */
export function generateToken(
  userId: string = VALID_OBJECT_ID,
  username: string = 'testuser',
): string {
  return jwt.sign({ userId, username }, envs.jwt.secret, { expiresIn: '1h' });
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function makeObjectId(hex?: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(hex ?? VALID_OBJECT_ID);
}

export function createMockUser(overrides: Record<string, unknown> = {}) {
  return {
    _id: makeObjectId(VALID_OBJECT_ID),
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
    createdAt: new Date(),
    updatedAt: new Date(),
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export function createMockBlog(overrides: Record<string, unknown> = {}) {
  return {
    _id: makeObjectId(VALID_OBJECT_ID),
    title: 'Test Blog Post Title',
    description: 'This is a test blog post description that is long enough.',
    cover: 'https://example.com/cover.jpg',
    tags: ['typescript', 'nodejs'],
    postedBy: makeObjectId(VALID_OBJECT_ID),
    likes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export function createMockQuestion(overrides: Record<string, unknown> = {}) {
  return {
    _id: makeObjectId(VALID_OBJECT_ID),
    title: 'How do I test a Node.js application?',
    description:
      'I want to write tests for my Node.js application. What are the best practices and tools?',
    tags: ['nodejs', 'testing'],
    askedBy: {
      _id: makeObjectId(VALID_OBJECT_ID),
      toString: () => VALID_OBJECT_ID,
    },
    likes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export function createMockJob(overrides: Record<string, unknown> = {}) {
  return {
    _id: makeObjectId(VALID_OBJECT_ID),
    title: 'Senior Backend Developer',
    description: 'We are looking for a senior backend developer.',
    company: 'Tech Corp',
    location: 'Remote',
    employmentType: 'Full-time',
    salaryRange: '$100k - $130k',
    requiredSkills: ['Node.js', 'TypeScript'],
    postedBy: makeObjectId(VALID_OBJECT_ID),
    status: 'Open',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export function createMockApplication(overrides: Record<string, unknown> = {}) {
  return {
    _id: makeObjectId(VALID_OBJECT_ID),
    jobId: makeObjectId(VALID_OBJECT_ID_2),
    applicantId: {
      _id: makeObjectId(VALID_OBJECT_ID),
      toString: () => VALID_OBJECT_ID,
    },
    coverLetter: 'I am a great candidate for this position.',
    resumeUrl: 'https://example.com/resume.pdf',
    portfolioUrl: 'https://example.com/portfolio',
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export function createMockNotification(
  overrides: Record<string, unknown> = {},
) {
  return {
    _id: makeObjectId(VALID_OBJECT_ID),
    recipient: makeObjectId(VALID_OBJECT_ID),
    sender: makeObjectId(VALID_OBJECT_ID_2),
    type: 'LIKE',
    resourceType: 'BLOG',
    resourceId: makeObjectId(VALID_OBJECT_ID_3),
    message: 'Someone liked your blog post.',
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export function createMockComment(overrides: Record<string, unknown> = {}) {
  return {
    _id: makeObjectId(VALID_OBJECT_ID),
    commentor: makeObjectId(VALID_OBJECT_ID),
    commentableType: 'BLOG',
    commentableId: makeObjectId(VALID_OBJECT_ID_2),
    comment: 'This is a test comment.',
    likes: [],
    parentComment: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// Build a chainable query mock used by paginate()
export function createChainableQuery(resolvedData: unknown[], count = 0) {
  const query = {
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    populate: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    lean: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue(resolvedData),
  };
  return query;
}
