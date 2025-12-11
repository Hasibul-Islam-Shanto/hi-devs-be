import { z } from 'zod';

export const applicationIdParamSchema = z.object({
  params: z.object({
    applicationId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid application ID'),
  }),
});

export const getAllApplicationsSchema = z.object({
  params: z.object({
    jobId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid job ID'),
  }),
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    search: z.string().optional(),
    sortBy: z.enum(['createdAt']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  }),
});

export const postApplicationSchema = z.object({
  body: z.object({
    jobId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid job ID'),
    coverLetter: z.string().nonempty('Cover letter is required'),
    portfolioUrl: z
      .string()
      .url('Portfolio URL must be a valid URL')
      .optional(),
    resumeUrl: z.string().url('Resume URL must be a valid URL'),
    status: z.enum(['pending', 'accepted', 'rejected']).default('pending'),
  }),
});

export const applicantApplicationUpdate = z.object({
  body: z.object({
    coverLetter: z.string().optional(),
    portfolioUrl: z
      .string()
      .url('Portfolio URL must be a valid URL')
      .optional(),
    resumeUrl: z.string().url('Resume URL must be a valid URL').optional(),
  }),
});

export const jobCreatorApplicationUpdate = z.object({
  body: z.object({
    status: z.enum(['pending', 'accepted', 'rejected']),
  }),
  params: z.object({
    applicationId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid application ID'),
  }),
});
