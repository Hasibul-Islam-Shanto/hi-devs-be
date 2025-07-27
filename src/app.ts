import {
  globalErrorHandler,
  globalNotFoundHandler,
} from '@/middlewares/common';
import envs from './config/envs';
import connectDB from './database';
import { app } from './server';

app.use(globalNotFoundHandler);
app.use(globalErrorHandler);

connectDB()
  .then(() => {
    console.log('Database connected successfully.');
    app.listen(envs.port, () => {
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
