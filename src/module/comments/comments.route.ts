import { authMiddleware } from '@/middlewares/auth.middleware';
import express, { RequestHandler } from 'express';
import {
  deleteComment,
  getAllComments,
  likeComment,
  postNewComment,
  updateComment,
} from './comments.controller';

const commentsRouter = express.Router();

commentsRouter
  .post('/', authMiddleware, postNewComment)
  .get('/:type/:id', getAllComments)
  .delete('/:commentId', authMiddleware, deleteComment)
  .patch('/:commentId', authMiddleware, updateComment)
  .post('/:commentId/like', authMiddleware, likeComment);

export default commentsRouter;
