import z from 'zod';

export const blogIdParamSchema = z.object({
  params: z.object({
    blogId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid blog ID format'),
  }),
});

export const getAllBlogPostsSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    search: z.string().optional(),
    sortBy: z
      .enum(['title', 'createdAt', 'tags'])
      .optional()
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  }),
});

export const createBlogPostSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters long'),
    description: z
      .string()
      .min(20, 'Content must be at least 20 characters long'),
    cover: z.string().url('Cover must be a valid URL').optional(),
    tags: z
      .array(z.string().min(1, 'Tag cannot be empty'))
      .max(5, 'You can add up to 5 tags only'),
  }),
});

export const updateBlogPostSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(5, 'Title must be at least 5 characters long')
      .optional(),
    content: z
      .string()
      .min(20, 'Content must be at least 20 characters long')
      .optional(),
    cover: z.string().url('Cover must be a valid URL').optional(),
    tags: z
      .array(z.string().min(1, 'Tag cannot be empty'))
      .max(5, 'You can add up to 5 tags only')
      .optional(),
  }),
  params: z.object({
    blogId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid blog ID format'),
  }),
});
