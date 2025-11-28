import express, { RequestHandler } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import {
  getAllUsers,
  getUserProfile,
  updateUserProfile,
} from './user.controller';

export const userRouter = express.Router();

userRouter
  .get('/', authMiddleware, getAllUsers)
  .get('/profile', authMiddleware, getUserProfile)
  .patch('/profile/:id', authMiddleware, updateUserProfile);
