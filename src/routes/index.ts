import { questionRouter } from '@/module/question/question.route';
import express from 'express';
import { authRouter } from '../module/auth/auth.route';
import { userRouter } from '../module/user/user.route';

const router = express.Router();

interface RouterConfig {
  path: string;
  router: express.Router;
}

const routes: RouterConfig[] = [
  {
    path: '/auth',
    router: authRouter,
  },
  {
    path: '/users',
    router: userRouter,
  },
  {
    path: '/questions',
    router: questionRouter,
  },
];

routes.forEach(({ path, router: routeHandler }) => {
  router.use(path, routeHandler);
});

export default router;
