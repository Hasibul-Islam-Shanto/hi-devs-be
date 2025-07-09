import { authMiddleware } from '@/middlewares/auth.middleware';
import express, { RequestHandler } from 'express';
import {
  createBlogPost,
  deleteBlogPost,
  getBlogPostById,
  getBlogPosts,
  updateBlogPost,
} from './blog.controller';

export const blogRouter = express.Router();

blogRouter
  .get('/', getBlogPosts as RequestHandler)
  .post('/', authMiddleware as RequestHandler, createBlogPost as RequestHandler)
  .get(
    '/:id',
    authMiddleware as RequestHandler,
    getBlogPostById as RequestHandler,
  )
  .patch(
    '/:id',
    authMiddleware as RequestHandler,
    updateBlogPost as RequestHandler,
  )
  .delete(
    '/:id',
    authMiddleware as RequestHandler,
    deleteBlogPost as RequestHandler,
  );
