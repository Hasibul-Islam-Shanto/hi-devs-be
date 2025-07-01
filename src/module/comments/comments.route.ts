import { authMiddleware } from '@/middlewares/auth.middleware';
import express, { RequestHandler } from 'express';
import {
  deleteComment,
  getCommentsByQuestionId,
  likeComment,
  postNewComment,
  updateComment,
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
  )
  .patch(
    '/:commentId',
    authMiddleware as RequestHandler,
    updateComment as RequestHandler,
  );

commentsRouter.post(
  '/:commentId/like',
  authMiddleware as RequestHandler,
  likeComment as RequestHandler,
);

export default commentsRouter;
