import { INotification } from '@/module/notification/notification.model';
import { getIO } from '@/socket/socket';
import { isUserOnline } from '@/socket/socket.handlers';

export const sendNotificationToUser = async (
  userId: string,
  notification: INotification,
) => {
  const io = getIO();

  if (!io) {
    console.error('❌ Socket.IO not initialized');
    return false;
  }

  console.log(`📤 Attempting to send notification to user: ${userId}`);
  console.log(`🔍 User online status: ${await isUserOnline(userId)}`);
  console.log(`📧 Notification:`, JSON.stringify(notification, null, 2));

  // Emit to user's personal room
  io.to(`user:${userId}`).emit('notification', notification);

  console.log(`✅ Notification emitted to room: user:${userId}`);
  return true;
};

export const broadcastNotification = (event: string, data: INotification) => {
  const io = getIO();

  if (!io) {
    console.error('❌ Socket.IO not initialized');
    return false;
  }

  io.emit(event, data);
  console.log(`📡 Broadcast: ${event}`);
  return true;
};

export const checkUserOnlineStatus = async (
  userId: string,
): Promise<boolean> => {
  return isUserOnline(userId);
};
