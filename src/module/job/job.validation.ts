import { z } from 'zod';

export const jobSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    company: z.string().min(1, 'Company name is required'),
    location: z.enum(['Remote', 'On-site', 'Hybrid']),
    salaryRange: z.string().min(1, 'Salary range is required'),
    employmentType: z.enum([
      'Full-time',
      'Part-time',
      'Contract',
      'Internship',
    ]),
    requiredSkills: z
      .array(z.string())
      .min(1, 'At least one skill is required'),
  }),
});

export const getAllJobsSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    search: z.string().optional(),
    sortBy: z
      .enum(['title', 'location', 'salaryRange', 'createdAt'])
      .optional()
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  }),
});

export const updateJobSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    company: z.string().optional(),
    location: z.enum(['Remote', 'On-site', 'Hybrid']).optional(),
    salaryRange: z.string().optional(),
    employmentType: z
      .enum(['Full-time', 'Part-time', 'Contract', 'Internship'])
      .optional(),
    requiredSkills: z
      .array(z.string())
      .min(1, 'At least one skill is required')
      .optional(),
    status: z.enum(['Open', 'Closed']).optional(),
  }),
  params: z.object({
    jobId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Job ID format'),
  }),
});

export const jobIdSchema = z.object({
  params: z.object({
    jobId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Job ID format'),
  }),
});
