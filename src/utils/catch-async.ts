import { NextFunction, Request, Response } from 'express';

type ControllerFunction = (
  req: Request,
  res: Response,
  next?: NextFunction,
) => Promise<unknown>;

const catchAsync = (handler: ControllerFunction) => {
  return async (req: Request, res: Response) => {
    try {
      await handler(req, res);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const statusCode = error.statusCode || error.status || 500;
      const message = error.message || 'Internal server error';

      res.status(statusCode).json({
        success: false,
        message: message,
      });
    }
  };
};

export default catchAsync;
