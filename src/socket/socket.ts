import { Server as HTTPServer } from 'http';
import { socketConfig } from '@/config/socket';
import { Server } from 'socket.io';
import {
  handleConnection,
  handleDisconnect,
  handleMarkAllAsRead,
  handleMarkAsRead,
} from './socket.handlers';
import { authenticateSocket } from './socket.middleware';
import { AuthenticatedSocket } from './socket.types';

let io: Server | null = null;

export const initializeSocket = (httpServer: HTTPServer) => {
  io = new Server(httpServer, socketConfig);
  io.use(authenticateSocket);

  io.on('connection', (socket: AuthenticatedSocket) => {
    handleConnection(socket);
    handleMarkAsRead(socket);
    handleMarkAllAsRead(socket);
    handleDisconnect(socket);
  });
  console.log('Socket.io initialized');
  return io;
};

export const getIO = (): Server | null => {
  return io;
};
