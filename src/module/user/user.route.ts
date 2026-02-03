import express, { RequestHandler } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import {
  getAllUsers,
  getUserById,
  getUserProfile,
  updateUserProfile,
} from './user.controller';

export const userRouter = express.Router();

userRouter
  .get('/', authMiddleware, getAllUsers)
  .get('/profile', authMiddleware, getUserProfile)
  .get('/:id', authMiddleware, getUserById)
  .patch('/profile/:id', authMiddleware, updateUserProfile);
