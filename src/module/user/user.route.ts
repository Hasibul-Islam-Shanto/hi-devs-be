import express, { RequestHandler } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import {
  getUserProfile,
  updateUserProfile,
  userSignup,
} from './user.controller';

export const userRouter = express.Router();

userRouter.post('/signup', userSignup as RequestHandler);
userRouter
  .get(
    '/profile',
    authMiddleware as RequestHandler,
    getUserProfile as RequestHandler,
  )
  .patch(
    '/profile/:id',
    authMiddleware as RequestHandler,
    updateUserProfile as RequestHandler,
  );
