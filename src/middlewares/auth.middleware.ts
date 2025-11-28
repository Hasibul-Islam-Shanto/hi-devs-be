import { NextFunction, Request, RequestHandler, Response } from 'express';
import { verifyAccessToken } from '../utils/token.utils';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
      };
    }
  }
}

export const authMiddleware: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        message: 'Invalid authorization format. Use Bearer {token}',
      });
      return;
    }

    const token = parts[1];

    const decoded = verifyAccessToken(token);

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Authentication failed: Invalid or expired token',
    });
  }
};
