import { authMiddleware } from '@/middlewares/auth.middleware';
import express, { RequestHandler } from 'express';
import {
  deleteComment,
  getCommentsByQuestionId,
  postNewComment,
} from './comments.controller';

const commentsRouter = express.Router();

commentsRouter
  .post('/', authMiddleware as RequestHandler, postNewComment as RequestHandler)
  .get(
    '/:questionId',
    authMiddleware as RequestHandler,
    getCommentsByQuestionId as RequestHandler,
  )
  .delete(
    '/:commentId',
    authMiddleware as RequestHandler,
    deleteComment as RequestHandler,
  );

export default commentsRouter;
