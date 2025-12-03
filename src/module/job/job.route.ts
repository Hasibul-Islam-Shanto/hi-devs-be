import { authMiddleware } from '@/middlewares/auth.middleware';
import express from 'express';
import { getAllJobs, getJobById, postJob, updateJob } from './job.controller';

const jobRouter = express.Router();

jobRouter
  .post('/', authMiddleware, postJob)
  .get('/', authMiddleware, getAllJobs)
  .get('/:jobId', authMiddleware, getJobById)
  .patch('/:jobId', authMiddleware, updateJob);

export default jobRouter;
