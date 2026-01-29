import Notification from '@/module/notification/notification.model';
import { AuthenticatedSocket } from './socket.types';

const userSockets = new Map<string, string>();

export const handleConnection = (socket: AuthenticatedSocket) => {
  const userId = socket.userId;

  if (userId) {
    userSockets.set(userId, socket.id);
    socket.join(`user:${userId}`);
    console.log(`✅ User ${userId} connected (socket: ${socket.id})`);
    console.log(`📊 Total connected users: ${userSockets.size}`);
  } else {
    console.warn('⚠️ Socket connected without userId');
  }
};

export const handleDisconnect = (socket: AuthenticatedSocket) => {
  socket.on('disconnect', () => {
    const userId = socket.userId;
    if (userId) {
      userSockets.delete(userId);
      console.log(`❌ User ${userId} disconnected`);
      console.log(`📊 Total connected users: ${userSockets.size}`);
    }
  });
};

export const handleMarkAsRead = (socket: AuthenticatedSocket) => {
  socket.on('notification:read', async (notificationId: string) => {
    console.log(`📖 Mark as read request: ${notificationId}`);
    try {
      await Notification.findByIdAndUpdate(notificationId, { isRead: true });
      socket.emit('notification:read:success', { notificationId });
      console.log(`✅ Marked as read: ${notificationId}`);
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      socket.emit('notification:read:error', {
        error: 'Failed to mark as read',
      });
    }
  });
};

export const handleMarkAllAsRead = (socket: AuthenticatedSocket) => {
  socket.on('notification:read-all', async () => {
    console.log('📖 Mark all as read request');
    try {
      const userId = socket.userId;
      if (!userId) {
        return socket.emit('notification:read-all:error', {
          error: 'Unauthorized',
        });
      }

      await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true },
      );

      socket.emit('notification:read-all:success', {
        message: 'All notifications marked as read',
      });
      console.log(`✅ Marked all as read for user: ${userId}`);
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
      socket.emit('notification:read-all:error', {
        error: 'Failed to mark all as read',
      });
    }
  });
};

export const getUserSockets = () => userSockets;

export const isUserOnline = (userId: string): boolean => {
  return userSockets.has(userId);
};
