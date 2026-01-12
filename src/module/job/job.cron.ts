import cron from 'node-cron';
import Job from './job.model';

export const scheduleJobCronJobs = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const result = await Job.updateMany(
        {
          expiresAt: { $lte: new Date() },
          status: 'Open',
        },
        { $set: { status: 'Closed' } },
      );
      if (result.modifiedCount > 0) {
        console.log(`Closed ${result.modifiedCount} expired jobs.`);
      } else {
        console.log('No expired jobs to close.');
      }
    } catch (error) {
      console.error('Error closing expired jobs:', error);
    }
    console.log('Cron job executed: Checked and closed expired jobs.');
  });
};
