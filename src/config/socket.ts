import envs from './envs';

export const socketConfig = {
  cors: {
    origin: envs.clientUrl || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
};
