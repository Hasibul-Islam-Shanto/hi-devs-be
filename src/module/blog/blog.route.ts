import { authMiddleware } from '@/middlewares/auth.middleware';
import express, { RequestHandler } from 'express';
import {
  createBlogPost,
  deleteBlogPost,
  getBlogPostById,
  getBlogPosts,
  likeBlogPost,
  updateBlogPost,
} from './blog.controller';

export const blogRouter = express.Router();

blogRouter
  .get('/', getBlogPosts)
  .post('/', authMiddleware, createBlogPost)
  .get('/:blogId', authMiddleware, getBlogPostById)
  .patch('/:blogId', authMiddleware, updateBlogPost)
  .delete('/:blogId', authMiddleware, deleteBlogPost)
  .post('/likes/:blogId', authMiddleware, likeBlogPost);
