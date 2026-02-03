import { authMiddleware } from '@/middlewares/auth.middleware';
import express, { RequestHandler } from 'express';
import {
  createBlogPost,
  deleteBlogPost,
  getBlogPostById,
  getBlogPosts,
  getUsersBlogs,
  likeBlogPost,
  updateBlogPost,
} from './blog.controller';

export const blogRouter = express.Router();

blogRouter
  .get('/', getBlogPosts)
  .post('/', authMiddleware, createBlogPost)
  .get('/:blogId', getBlogPostById)
  .get('/users/blogs', authMiddleware, getUsersBlogs)
  .patch('/:blogId', authMiddleware, updateBlogPost)
  .delete('/:blogId', authMiddleware, deleteBlogPost)
  .post('/likes/:blogId', authMiddleware, likeBlogPost);
