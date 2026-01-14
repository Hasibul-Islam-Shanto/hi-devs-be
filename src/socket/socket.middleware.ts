import envs from '@/config/envs';
import jwt from 'jsonwebtoken';
import { AuthenticatedSocket, SocketAuthPayload } from './socket.types';

export const authenticateSocket = (
  socket: AuthenticatedSocket,
  next: (err?: Error) => void,
) => {
  try {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, envs.jwt.secret) as SocketAuthPayload;
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};
