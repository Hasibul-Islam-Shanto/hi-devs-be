import { getJobById } from '@/module/job/job.service';
import { createAndSendNotification } from '../notification.service';
import { getUserName } from './notification.resouce.helper';

export const notifyJobApplication = async (
  applicantId: string,
  jobId: string,
) => {
  try {
    const [job, applicantName] = await Promise.all([
      getJobById(jobId),
      getUserName(applicantId),
    ]);

    if (!job) {
      console.warn('Job not found for application notification');
      return;
    }

    const recipientId = job.postedBy.toString();

    await createAndSendNotification({
      recipient: recipientId,
      sender: applicantId,
      type: 'APPLICATION',
      resourceType: 'JOB',
      resourceId: jobId,
      message: `${applicantName} applied for your job: "${job.title}"`,
    });
  } catch (error) {
    console.error('Error sending application notification:', error);
  }
};
