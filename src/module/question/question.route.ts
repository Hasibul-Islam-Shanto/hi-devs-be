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
  .post('/', authMiddleware, postNewQuestion)
  .get('/', getAllQuestions)
  .get('/:id', getQuestionById)
  .patch('/:id', authMiddleware, updateQuestion)
  .delete('/:id', authMiddleware, deleteQuestion);

questionRouter.post('/likes/:id', authMiddleware, likeQuestion);
