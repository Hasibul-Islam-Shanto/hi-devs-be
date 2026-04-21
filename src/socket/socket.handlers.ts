import redis from '@/config/redis';
import Notification from '@/module/notification/notification.model';
import { AuthenticatedSocket } from './socket.types';

const ONLINE_USER_TTL = 24 * 60 * 60; // 24 hours in seconds
const onlineKey = (userId: string) => `online:${userId}`;

export const handleConnection = async (socket: AuthenticatedSocket) => {
  const userId = socket.userId;

  if (userId) {
    await redis.set(onlineKey(userId), socket.id, 'EX', ONLINE_USER_TTL);
    socket.join(`user:${userId}`);
    console.log(`✅ User ${userId} connected (socket: ${socket.id})`);
  } else {
    console.warn('⚠️ Socket connected without userId');
  }
};

export const handleDisconnect = (socket: AuthenticatedSocket) => {
  socket.on('disconnect', async () => {
    const userId = socket.userId;
    if (userId) {
      await redis.del(onlineKey(userId));
      console.log(`❌ User ${userId} disconnected`);
    }
  });
};

export const handleMarkAsRead = (socket: AuthenticatedSocket) => {
  socket.on('notification:read', async (notificationId: string) => {
    console.log(`📖 Mark as read request: ${notificationId}`);
    try {
      await Notification.findByIdAndUpdate(notificationId, { isRead: true });
      if (socket.userId) {
        await redis.del(`unread_count:${socket.userId}`);
      }
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
      await redis.del(`unread_count:${userId}`);

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

export const getSocketId = (userId: string): Promise<string | null> =>
  redis.get(onlineKey(userId));

export const isUserOnline = async (userId: string): Promise<boolean> => {
  const result = await redis.exists(onlineKey(userId));
  return result === 1;
};
