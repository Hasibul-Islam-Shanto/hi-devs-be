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

questionRouter
  .post(
    '/',
    authMiddleware as RequestHandler,
    postNewQuestion as RequestHandler,
  )
  .get('/', getAllQuestions as RequestHandler)
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
