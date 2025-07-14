import { authMiddleware } from '@/middlewares/auth.middleware';
import express, { RequestHandler } from 'express';
import { getAllJobs, getJobById, postJob, updateJob } from './job.controller';

const jobRouter = express.Router();

jobRouter
  .post('/', authMiddleware as RequestHandler, postJob as RequestHandler)
  .get('/', authMiddleware as RequestHandler, getAllJobs as RequestHandler)
  .get('/:id', authMiddleware as RequestHandler, getJobById as RequestHandler)
  .patch('/:id', authMiddleware as RequestHandler, updateJob as RequestHandler);

export default jobRouter;
