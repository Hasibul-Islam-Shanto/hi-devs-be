import { zParse } from '@/utils/z-parse';
import { Request, Response } from 'express';
import Application from './application.model';
import { postApplicationSchema } from './application.validation';

export const postApplication = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const applicationData = zParse(postApplicationSchema, req);
    const userId = req?.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const newApplication = new Application({
      ...applicationData,
      applicantId: userId,
    });

    const savedApplication = await newApplication.save();

    return res.status(201).json({
      message: 'Application submitted successfully',
      application: savedApplication,
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
