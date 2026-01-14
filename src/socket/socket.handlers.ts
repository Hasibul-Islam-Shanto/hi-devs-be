import Notification from '@/module/notification/notification.model.js';
import { AuthenticatedSocket } from './socket.types.js';

const userSockets = new Map<string, string>();

export const handleConnection = (socket: AuthenticatedSocket) => {
  const userId = socket.userId;
  if (userId) {
    userSockets.set(userId, socket.id);
    socket.join(`user_${userId}`);
    console.log(`User ${userId} connected with socket ID ${socket.id}`);
  }
};

export const handleDisconnect = (socket: AuthenticatedSocket) => {
  socket.on('disconnect', () => {
    const userId = socket.userId;
    if (userId) {
      userSockets.delete(userId);
      console.log(`User ${userId} disconnected from socket ID ${socket.id}`);
    }
  });
};

export const handleMarkAsRead = (socket: AuthenticatedSocket) => {
  socket.on('notification:read', async (notificationId: string) => {
    try {
      await Notification.findByIdAndUpdate(notificationId, {
        isRead: true,
      });
      socket.emit('notification:read:success', { notificationId });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      socket.emit('notification:read:error', {
        error: 'Failed to mark as read',
      });
    }
  });
};

export const handleMarkAllAsRead = (socket: AuthenticatedSocket) => {
  socket.on('notification:readAll', async (userId: string) => {
    try {
      const userId = socket.userId;
      if (!userId) {
        return socket.emit('notification:readAll:error', {
          error: 'User not authenticated',
        });
      }

      await Notification.updateMany(
        { recipientId: userId, isRead: false },
        { isRead: true },
      );
      socket.emit('notification:readAll:success');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      socket.emit('notification:readAll:error', {
        error: 'Failed to mark all as read',
      });
    }
  });
};

export const getUserSockets = () => userSockets;

export const isUserOnline = (userId: string): boolean => {
  return userSockets.has(userId);
};
