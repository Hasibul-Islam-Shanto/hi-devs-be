import { blogRouter } from '@/module/blog/blog.route';
import commentsRouter from '@/module/comments/comments.route';
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
  {
    path: '/comments',
    router: commentsRouter,
  },
  {
    path: '/blogs',
    router: blogRouter,
  },
];

routes.forEach(({ path, router: routeHandler }) => {
  router.use(path, routeHandler);
});

export default router;
