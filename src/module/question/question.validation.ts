import z from 'zod';

export const postQuestionSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(10, 'Title must be at least 10 characters long')
      .max(150, 'Title must be at most 150 characters long'),
    description: z
      .string()
      .min(20, 'Description must be at least 20 characters long')
      .max(5000, 'Description must be at most 5000 characters long'),
    tags: z
      .array(z.string().min(1, 'Tag cannot be empty'))
      .max(5, 'You can add up to 5 tags only'),
  }),
});

export const updateQuestionSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(10, 'Title must be at least 10 characters long')
      .max(150, 'Title must be at most 150 characters long')
      .optional(),
    description: z
      .string()
      .min(20, 'Description must be at least 20 characters long')
      .max(5000, 'Description must be at most 5000 characters long')
      .optional(),
    tags: z
      .array(z.string().min(1, 'Tag cannot be empty'))
      .max(5, 'You can add up to 5 tags only')
      .optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid question ID format'),
  }),
});

export const getAllQuestionsSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    search: z.string().optional(),
    sortBy: z
      .enum(['title', 'description', 'tags', 'createdAt'])
      .optional()
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  }),
});

export const questionIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid question ID format'),
  }),
});
