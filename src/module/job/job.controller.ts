import { zParse } from '@/utils/z-parse';
import { Request, Response } from 'express';
import Job from './job.model';
import { jobSchema, updateJobSchema } from './job.validation';

export const postJob = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const jobData = await zParse(jobSchema, req);
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const newJob = await Job.create({
      ...jobData,
      postedBy: userId,
    });

    return res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      job: newJob,
    });
  } catch (error) {
    return res.status(400).json({
      message: 'Failed to post job',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getAllJobs = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const jobs = await Job.find().populate(
      'postedBy',
      'name email profileImage',
    );
    return res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to retrieve jobs',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getJobById = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId).populate(
      'postedBy',
      'name email profileImage',
    );

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    return res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to retrieve job',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const updateJob = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const jobId = req.params.id;
    const jobData = await zParse(updateJobSchema, req);
    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      { ...jobData, updatedAt: new Date() },
      { new: true },
    ).populate('postedBy', 'name email profileImage');

    if (!updatedJob) {
      return res.status(404).json({ message: 'Job not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      job: updatedJob,
    });
  } catch (error) {
    return res.status(400).json({
      message: 'Failed to update job',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
