import { z } from 'zod';

export const getNotificationsSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('20'),
  }),
});

export const notificationIdSchema = z.object({
  params: z.object({
    notificationId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid notification ID'),
  }),
});
