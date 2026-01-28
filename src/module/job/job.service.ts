import Job from './job.model';

export const getJobById = async (jobId: string) => {
  return await Job.findById(jobId);
};
