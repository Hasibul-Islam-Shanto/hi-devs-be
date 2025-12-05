import { authMiddleware } from '@/middlewares/auth.middleware';
import express from 'express';
import {
  getApplicationById,
  getApplicationsByJobId,
  postApplication,
  updatedApplicationByJobCreator,
} from './application.controller';

const applicationRouter = express.Router();

applicationRouter
  .post('/', authMiddleware, postApplication)
  .get('/:applicationId', authMiddleware, getApplicationById)
  .get('/job/:jobId', authMiddleware, getApplicationsByJobId)
  .patch('/:applicationId', authMiddleware, updatedApplicationByJobCreator);

export default applicationRouter;
