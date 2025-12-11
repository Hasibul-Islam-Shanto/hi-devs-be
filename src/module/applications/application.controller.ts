import catchAsync from '@/utils/catch-async';
import { paginate } from '@/utils/paginate';
import { zParse } from '@/utils/z-parse';
import Job from '../job/job.model';
import Application from './application.model';
import {
  applicationIdParamSchema,
  getAllApplicationsSchema,
  jobCreatorApplicationUpdate,
  postApplicationSchema,
} from './application.validation';

export const postApplication = catchAsync(async (req, res) => {
  const { body } = await zParse(postApplicationSchema, req);
  const userId = req?.user?.userId;
  const job = await Job.findById(body?.jobId);

  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  if (job?.status !== 'Open') {
    return res.status(400).json({ message: 'Cannot apply to a closed job' });
  }

  if (job?.postedBy.toString() === userId) {
    return res
      .status(403)
      .json({ message: 'You cannot apply for your own job' });
  }
  const existingApplication = await Application.findOne({
    jobId: body.jobId,
    applicantId: userId,
  });

  if (existingApplication) {
    return res
      .status(400)
      .json({ message: 'You have already applied for this job' });
  }

  const newApplication = new Application({
    ...body,
    applicantId: userId,
  });

  const savedApplication = await newApplication.save();

  return res.status(201).json({
    message: 'Application submitted successfully',
    application: savedApplication,
  });
});

export const getApplicationsByJobId = catchAsync(async (req, res) => {
  const { query, params } = await zParse(getAllApplicationsSchema, req);

  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;

  const searchFilter: Record<string, unknown> = {
    jobId: params.jobId,
  };

  if (query.search) {
    searchFilter.$or = [{ status: { $regex: query.search, $options: 'i' } }];
  }

  const result = await paginate(Application, searchFilter, {
    page,
    limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    populate: { path: 'applicantId', select: 'name email username' },
  });

  return res.status(200).json({
    message: 'Applications retrieved successfully',
    applications: result.data,
    pagination: result.pagination,
  });
});

export const getApplicationById = catchAsync(async (req, res) => {
  const { params } = await zParse(applicationIdParamSchema, req);

  const application = await Application.findById({ _id: params.applicationId })
    .populate('jobId', 'title company')
    .populate('applicantId', 'name email');

  if (!application) {
    return res.status(400).json({ message: 'Application not found' });
  }

  if (application.applicantId._id.toString() !== req?.user?.userId) {
    return res
      .status(403)
      .json({ message: 'You are not authorized to view this application' });
  }

  return res.status(200).json({
    message: 'Application retrieved successfully',
    application,
  });
});

export const updatedApplicationByJobCreator = catchAsync(async (req, res) => {
  const { body, params } = await zParse(jobCreatorApplicationUpdate, req);
  const application = await Application.findById({ _id: params.applicationId });
  const userId = req?.user?.userId;

  if (!application) {
    return res.status(404).json({ message: 'Application not found' });
  }

  const job = await Job.findById(application.jobId);

  if (!job) {
    return res.status(404).json({ message: 'Associated job not found' });
  }

  if (job?.postedBy.toString() !== userId) {
    return res
      .status(403)
      .json({ message: 'You are not authorized to update this application' });
  }

  application.status = body.status;
  const updatedApplication = await application.save();

  return res.status(200).json({
    message: 'Application updated successfully',
    application: updatedApplication,
  });
});
