import catchAsync from '@/utils/catch-async';
import { paginate } from '@/utils/paginate';
import { zParse } from '@/utils/z-parse';
import Job from '../job/job.model';
import { notifyJobApplication } from '../notification/helper/application.notifier';
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

  notifyJobApplication(userId!, body.jobId).catch((error) =>
    console.error('Failed to send notification:', error),
  );
  return res.status(201).json({
    message: 'Application submitted successfully',
    application: savedApplication,
  });
});

export const getApplicationsByJobId = catchAsync(async (req, res) => {
  const { query, params } = await zParse(getAllApplicationsSchema, req);
  const userId = req?.user?.userId;
  const job = await Job.findById(params.jobId);

  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  if (job?.postedBy.toString() !== userId) {
    return res.status(403).json({
      message: 'You are not authorized to view this job applications',
    });
  }

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
  const userId = req?.user?.userId;

  const application = await Application.findById(params.applicationId)
    .populate('jobId', 'title company postedBy')
    .populate('applicantId', 'name email username profileImage');

  if (!application) {
    return res.status(400).json({ message: 'Application not found' });
  }

  const applicantIdStr = application.applicantId._id.toString();
  const isApplicant = applicantIdStr === userId;

  const job = application.jobId as typeof application.jobId & {
    postedBy?: { toString(): string };
  };
  const postedById =
    job && typeof job === 'object' && 'postedBy' in job && job.postedBy
      ? job.postedBy.toString()
      : null;
  const isJobOwner = postedById !== null && postedById === userId;

  if (!isApplicant && !isJobOwner) {
    return res
      .status(403)
      .json({ message: 'You are not authorized to view this application' });
  }
  const applicationWithRoles = {
    application,
    isJobOwner,
    isApplicant,
  };

  return res.status(200).json({
    message: 'Application retrieved successfully',
    applicationWithRoles,
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
