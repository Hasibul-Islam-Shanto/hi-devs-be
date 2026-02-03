import { authMiddleware } from '@/middlewares/auth.middleware';
import express, { RequestHandler } from 'express';
import {
  deleteQuestion,
  getAllQuestions,
  getQuestionById,
  getUsersQuestions,
  likeQuestion,
  postNewQuestion,
  updateQuestion,
} from './question.controller';

export const questionRouter = express.Router();

questionRouter
  .post('/', authMiddleware, postNewQuestion)
  .get('/', getAllQuestions)
  .get('/:id', getQuestionById)
  .get('/users/questions', authMiddleware, getUsersQuestions)
  .patch('/:id', authMiddleware, updateQuestion)
  .delete('/:id', authMiddleware, deleteQuestion);

questionRouter.post('/likes/:id', authMiddleware, likeQuestion);
