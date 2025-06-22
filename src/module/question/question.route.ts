import { authMiddleware } from '@/middlewares/auth.middleware';
import express, { RequestHandler } from 'express';
import {
  deleteQuestion,
  getAllQuestions,
  getQuestionById,
  likeQuestion,
  postNewQuestion,
  updateQuestion,
} from './question.controller';

export const questionRouter = express.Router();

questionRouter.post(
  '/post-question',
  authMiddleware as RequestHandler,
  postNewQuestion as RequestHandler,
);

questionRouter.get(
  '/all-questions',
  authMiddleware as RequestHandler,
  getAllQuestions as RequestHandler,
);

questionRouter
  .get(
    '/:id',
    authMiddleware as RequestHandler,
    getQuestionById as RequestHandler,
  )
  .patch(
    '/:id',
    authMiddleware as RequestHandler,
    updateQuestion as RequestHandler,
  )
  .delete(
    '/:id',
    authMiddleware as RequestHandler,
    deleteQuestion as RequestHandler,
  );

questionRouter.post(
  '/likes/:id',
  authMiddleware as RequestHandler,
  likeQuestion as RequestHandler,
);
