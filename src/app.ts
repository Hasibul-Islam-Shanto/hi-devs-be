import {
  globalErrorHandler,
  globalNotFoundHandler,
} from '@/middlewares/common';
import envs from './config/envs';
import connectDB from './database';
import { scheduleJobCronJobs } from './module/job/job.cron';
import { app, httpServer } from './server';
import { initializeSocket } from './socket/socket';

app.use(globalNotFoundHandler);
app.use(globalErrorHandler);

connectDB()
  .then(() => {
    console.log('Database connected successfully.');
    initializeSocket(httpServer);
    scheduleJobCronJobs();
    httpServer.listen(envs.port, () => {
      console.log(`Server running at http://localhost:${envs.port}`);
      console.log(
        `Swagger docs available at http://localhost:${envs.port}/api-docs`,
      );
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
  });

export { app };
