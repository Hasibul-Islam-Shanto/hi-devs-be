import { Request, Response } from 'express';

type ControllerFunction = (req: Request, res: Response) => Promise<unknown>;

const catchAsync = (handler: ControllerFunction) => {
  return async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

export default catchAsync;
