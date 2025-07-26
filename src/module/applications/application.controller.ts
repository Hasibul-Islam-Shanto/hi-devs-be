import { zParse } from '@/utils/z-parse';
import { Request, Response } from 'express';
import Job from '../job/job.model';
import Application from './application.model';
import {
  postApplicationSchema,
  updateApplicationSchema,
} from './application.validation';

export const postApplication = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const applicationData = await zParse(postApplicationSchema, req);
    const userId = req?.user?.userId;
    const job = await Job.findById(applicationData?.jobId);

    if (!job || job?.status !== 'Open') {
      return res.status(404).json({ message: 'Job not found or not open' });
    }

    if (job?.postedBy.toString() === userId) {
      return res
        .status(403)
        .json({ message: 'You cannot apply for your own job' });
    }

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

export const getApplicationsByJobId = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const userId = req?.user?.userId;
    const jobId = req.params.jobId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const applications = await Application.find({ jobId })
      .populate('jobId', 'title company')
      .populate('applicantId', 'name email');

    return res.status(200).json({
      message: 'Applications retrieved successfully',
      applications,
    });
  } catch (error) {
    console.error('Error retrieving applications:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getApplicationsByApplicantId = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const userId = req?.user?.userId;
    const applicantId = req.params.applicantId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const applications = await Application.find({ applicantId })
      .populate('jobId', 'title company')
      .populate('applicantId', 'name email');

    return res.status(200).json({
      message: 'Applications retrieved successfully',
      applications,
    });
  } catch (error) {
    console.error('Error retrieving applications:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getApplicationById = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const userId = req?.user?.userId;
    const id = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const application = await Application.findById({ _id: id })
      .populate('jobId', 'title company')
      .populate('applicantId', 'name email');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    return res.status(200).json({
      message: 'Application retrieved successfully',
      application,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateApplication = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const userId = req?.user?.userId;
    const id = req.params.id;
    const applicationData = await zParse(updateApplicationSchema, req);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }
    const existingApplication = await Application.findById({
      _id: id,
    });

    if (!existingApplication) {
      return res.status(404).json({ message: 'Application not found' });
    }
    const job = await Job.findById({ _id: existingApplication?.jobId });

    if (!job || job?.postedBy.toString() !== userId) {
      return res
        .status(404)
        .json({ message: 'You cannot update this application' });
    }
    const updatedApplication = await Application.findByIdAndUpdate(
      { _id: id },
      { ...applicationData },
      { new: true, runValidators: true },
    )
      .populate('jobId', 'title company')
      .populate('applicantId', 'name email');

    if (!updatedApplication) {
      return res.status(404).json({ message: 'Application not found' });
    }

    return res.status(200).json({
      message: 'Application updated successfully',
      application: updatedApplication,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};
