import { z } from 'zod';

export const jobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  company: z.string().min(1, 'Company name is required'),
  location: z.enum(['Remote', 'On-site', 'Hybrid']),
  salaryRange: z.string().min(1, 'Salary range is required'),
  employmentType: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship']),
  requiredSkills: z.array(z.string()).min(1, 'At least one skill is required'),
});

export const updateJobSchema = z.object({
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
});
