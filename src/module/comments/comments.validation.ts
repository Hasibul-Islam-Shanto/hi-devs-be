import z from 'zod';

export const addCommentSchema = z.object({
  body: z.object({
    comment: z.string().min(1, 'Comments cannot be empty!').max(1000),
  }),
  query: z.object({
    commentableType: z.enum(['Question', 'Blog', 'Job']),
    commentableId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
  }),
});

export const getAllCommentsSchema = z.object({
  params: z.object({
    type: z.enum(['Question', 'Blog', 'Job']),
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
  }),
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
  }),
});

export const commentIdParamSchema = z.object({
  params: z.object({
    commentId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Comment ID format'),
  }),
});

export const updateCommentSchema = z.object({
  params: z.object({
    commentId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Comment ID format'),
  }),
  body: z.object({
    comment: z.string().min(1, 'Comments cannot be empty!').max(1000),
  }),
});
