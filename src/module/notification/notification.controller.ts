import catchAsync from '@/utils/catch-async';
import { zParse } from '@/utils/z-parse';
import {
  deleteNotification,
  getUnreadCount,
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from './notification.service';
import {
  getNotificationsSchema,
  notificationIdSchema,
} from './notification.validation';

export const getNotifications = catchAsync(async (req, res) => {
  const { query } = await zParse(getNotificationsSchema, req);
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const page = parseInt(query.page);
  const limit = parseInt(query.limit);

  const result = await getUserNotifications(userId, page, limit);

  res.json({
    success: true,
    ...result,
  });
});

export const markAsRead = catchAsync(async (req, res) => {
  const { params } = await zParse(notificationIdSchema, req);
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const notification = await markNotificationAsRead(
    params.notificationId,
    userId,
  );

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  res.json({
    success: true,
    message: 'Notification marked as read',
  });
});

export const markAllAsRead = catchAsync(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await markAllNotificationsAsRead(userId);

  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
});

export const deleteNotificationById = catchAsync(async (req, res) => {
  const { params } = await zParse(notificationIdSchema, req);
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const notification = await deleteNotification(params.notificationId, userId);

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  res.json({
    success: true,
    message: 'Notification deleted',
  });
});

export const getUnreadNotificationCount = catchAsync(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const count = await getUnreadCount(userId);

  res.json({
    success: true,
    unreadCount: count,
  });
});
