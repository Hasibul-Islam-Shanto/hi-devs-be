import { authMiddleware } from '@/middlewares/auth.middleware';
import express, { RequestHandler } from 'express';
import {
  getApplicationById,
  getApplicationsByApplicantId,
  getApplicationsByJobId,
  postApplication,
  updateApplication,
} from './application.controller';

const applicationRouter = express.Router();

applicationRouter
  .post(
    '/',
    authMiddleware as RequestHandler,
    postApplication as RequestHandler,
  )
  .get(
    '/:id',
    authMiddleware as RequestHandler,
    getApplicationById as RequestHandler,
  )
  .get(
    '/job/:jobId',
    authMiddleware as RequestHandler,
    getApplicationsByJobId as RequestHandler,
  )
  .get(
    '/applicant/:applicantId',
    authMiddleware as RequestHandler,
    getApplicationsByApplicantId as RequestHandler,
  )
  .patch(
    '/:id',
    authMiddleware as RequestHandler,
    updateApplication as RequestHandler,
  );

export default applicationRouter;
