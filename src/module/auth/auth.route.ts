import express, { RequestHandler } from 'express';
import { logout, refreshToken, signin, signup } from './auth.controller';

export const authRouter = express.Router();

authRouter.post('/signup', signup as RequestHandler);
authRouter.post('/signin', signin as RequestHandler);
authRouter.post('/refresh-token', refreshToken as RequestHandler);
authRouter.post('/logout', logout as RequestHandler);
