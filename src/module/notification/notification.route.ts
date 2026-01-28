import { authMiddleware } from '@/middlewares/auth.middleware';
import express from 'express';
import {
  deleteNotificationById,
  getNotifications,
  getUnreadNotificationCount,
  markAllAsRead,
  markAsRead,
} from './notification.controller';

const notificationRouter = express.Router();

notificationRouter.use(authMiddleware);

notificationRouter.get('/', getNotifications);
notificationRouter.get('/unread-count', getUnreadNotificationCount);
notificationRouter.patch('/:notificationId/read', markAsRead);
notificationRouter.patch('/read-all', markAllAsRead);
notificationRouter.delete('/:notificationId', deleteNotificationById);

export default notificationRouter;
