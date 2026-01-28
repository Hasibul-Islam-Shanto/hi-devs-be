import { sendNotificationToUser } from '@/utils/notification-sender';
import Notification from './notification.model';
import {
  CreateNotificationData,
  NotificationResponse,
} from './notification.type';

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
    sendNotificationToUser(data.recipient, populatedNotification);
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
    Notification.countDocuments({ recipient: userId, isRead: false }),
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
  return notification;
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId: string) => {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true },
  );
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
  return result;
};

// Get unread count
export const getUnreadCount = async (userId: string): Promise<number> => {
  const count = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });
  return count;
};
