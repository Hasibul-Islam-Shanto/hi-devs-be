import redis from '@/config/redis';
import { sendNotificationToUser } from '@/utils/notification-sender';
import Notification from './notification.model';
import {
  CreateNotificationData,
  NotificationResponse,
} from './notification.type';

const unreadKey = (userId: string) => `unread_count:${userId}`;
const UNREAD_COUNT_TTL = 300; // 5 minutes

const invalidateUnreadCount = (userId: string) => redis.del(unreadKey(userId));

export const createNotification = async (data: CreateNotificationData) => {
  const notification = await Notification.create(data);
  return notification;
};

export const populateNotification = async (notificationId: string) => {
  const notification = await Notification.findById(notificationId)
    .populate('sender', 'name username profileImage')
    .populate('recipient', 'name username')
    .lean();
  return notification;
};

export const createAndSendNotification = async (
  data: CreateNotificationData,
) => {
  if (data.recipient === data.sender) {
    return null;
  }

  const notification = await createNotification(data);
  const populatedNotification = await populateNotification(
    notification._id as string,
  );

  if (populatedNotification) {
    await sendNotificationToUser(data.recipient, populatedNotification);
    await invalidateUnreadCount(data.recipient);
  }

  return populatedNotification;
};

export const getUserNotifications = async (
  userId: string,
  page = 1,
  limit = 20,
): Promise<NotificationResponse> => {
  const skip = (page - 1) * limit;

  const [notifications, totalCount, unreadCount] = await Promise.all([
    Notification.find({ recipient: userId })
      .populate('sender', 'name username profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ recipient: userId }),
    getUnreadCount(userId),
  ]);

  return {
    notifications,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalItems: totalCount,
      limit,
      unreadCount,
    },
  };
};

export const markNotificationAsRead = async (
  notificationId: string,
  userId: string,
) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true },
    { new: true },
  );
  if (notification) {
    await invalidateUnreadCount(userId);
  }
  return notification;
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId: string) => {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true },
  );
  await invalidateUnreadCount(userId);
  return result;
};

// Delete notification
export const deleteNotification = async (
  notificationId: string,
  userId: string,
) => {
  const result = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });
  if (result) {
    await invalidateUnreadCount(userId);
  }
  return result;
};

// Get unread count — Redis cache-aside, 5-min TTL
export const getUnreadCount = async (userId: string): Promise<number> => {
  const cached = await redis.get(unreadKey(userId));
  if (cached !== null) return parseInt(cached);

  const count = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });
  await redis.set(unreadKey(userId), count, 'EX', UNREAD_COUNT_TTL);
  return count;
};
