import { z } from 'zod';

export const postApplicationSchema = z.object({
  jobId: z.string().nonempty('Job ID is required'),
  coverLetter: z.string().nonempty('Cover letter is required'),
  portfolioUrl: z.string().url('Portfolio URL must be a valid URL').optional(),
  resumeUrl: z.string().url('Resume URL must be a valid URL'),
  status: z.enum(['pending', 'accepted', 'rejected']).default('pending'),
});

export const updateApplicationSchema = z.object({
  jobId: z.string().optional(),
  converLetter: z.string().optional(),
  portfolioUrl: z.string().url('Portfolio URL must be a valid URL').optional(),
  resumeUrl: z.string().url('Resume URL must be a valid URL').optional(),
  status: z.enum(['pending', 'accepted', 'rejected']).optional(),
});
