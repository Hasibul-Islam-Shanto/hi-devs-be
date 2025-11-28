import z from 'zod';

export const updateUserProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    username: z.string().min(2).max(50).optional(),
    bio: z.string().max(500).optional(),
    skills: z.array(z.string()).optional(),
    location: z.string().max(100).optional(),
    website: z.string().url().optional(),
    socialLinks: z
      .object({
        twitter: z.string().url().optional(),
        linkedin: z.string().url().optional(),
        github: z.string().url().optional(),
        facebook: z.string().url().optional(),
      })
      .optional(),
    profileImage: z.string().url().optional(),
  }),
});

export const getAllUsersSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    search: z.string().optional(),
    sortBy: z
      .enum(['name', 'username', 'createdAt'])
      .optional()
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  }),
});
