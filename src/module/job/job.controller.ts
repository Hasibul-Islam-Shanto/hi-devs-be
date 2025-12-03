import catchAsync from '@/utils/catch-async';
import { paginate } from '@/utils/paginate';
import { zParse } from '@/utils/z-parse';
import Job from './job.model';
import {
  getAllJobsSchema,
  jobIdSchema,
  jobSchema,
  updateJobSchema,
} from './job.validation';

export const postJob = catchAsync(async (req, res) => {
  const { body } = await zParse(jobSchema, req);
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized access' });
  }

  const newJob = new Job({
    ...body,
    postedBy: userId,
  });

  await newJob.save();

  return res.status(201).json({
    success: true,
    message: 'Job posted successfully',
    job: newJob,
  });
});

export const getAllJobs = catchAsync(async (req, res) => {
  const { query } = await zParse(getAllJobsSchema, req);
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;

  const searchFilter: Record<string, unknown> = {};
  if (query.search) {
    searchFilter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { location: { $regex: query.search, $options: 'i' } },
      { salaryRange: { $regex: query.search, $options: 'i' } },
    ];
  }
  const result = await paginate(Job, searchFilter, {
    page,
    limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    populate: { path: 'postedBy', select: 'name profileImage' },
  });

  return res.status(200).json({
    success: true,
    jobs: result.data,
    pagination: result.pagination,
  });
});

export const getJobById = catchAsync(async (req, res) => {
  const { params } = await zParse(jobIdSchema, req);
  const jobId = params.jobId;
  const job = await Job.findById(jobId).populate(
    'postedBy',
    'name username profileImage',
  );

  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  return res.status(200).json({
    success: true,
    job,
  });
});

export const updateJob = catchAsync(async (req, res) => {
  const { body, params } = await zParse(updateJobSchema, req);

  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized access' });
  }

  const job = await Job.findById(params.jobId);

  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  if (job.postedBy.toString() !== userId) {
    return res
      .status(403)
      .json({ message: 'Forbidden: You cannot update this job' });
  }

  const updatedJob = await Job.findByIdAndUpdate(
    params.jobId,
    { ...body, updatedAt: new Date() },
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
});
