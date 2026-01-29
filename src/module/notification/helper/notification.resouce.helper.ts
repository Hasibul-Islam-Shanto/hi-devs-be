import Blog from '@/module/blog/blog.model';
import Job from '@/module/job/job.model';
import Question from '@/module/question/question.model';
import User from '@/module/user/user.model';
import { NotificationResourceType } from '../notification.type';

export const getResourceDetails = async (
  resourceType: NotificationResourceType,
  resourceId: string,
): Promise<{ recipientId: string; resourceTitle: string }> => {
  switch (resourceType) {
    case 'JOB': {
      const job = await Job.findById({ _id: resourceId }).populate(
        'postedBy',
        'name _id',
      );
      return job
        ? { recipientId: job.postedBy._id.toString(), resourceTitle: job.title }
        : { recipientId: '', resourceTitle: '' };
    }
    case 'BLOG': {
      const blog = await Blog.findById({ _id: resourceId }).populate(
        'postedBy',
        'name _id',
      );
      return blog
        ? {
            recipientId: blog.postedBy._id.toString(),
            resourceTitle: blog.title,
          }
        : { recipientId: '', resourceTitle: '' };
    }
    case 'QUESTION': {
      const question = await Question.findById({ _id: resourceId }).populate(
        'askedBy',
        'name _id',
      );
      return question
        ? {
            recipientId: question.askedBy._id.toString(),
            resourceTitle: question.title,
          }
        : { recipientId: '', resourceTitle: '' };
    }
    default:
      return { recipientId: '', resourceTitle: '' };
  }
};

export const getResourceTitle = async (
  resourceType: NotificationResourceType,
  resourceId: string,
): Promise<string> => {
  switch (resourceType) {
    case 'BLOG': {
      const blog = await Blog.findById(resourceId);
      return blog?.title || 'a blog';
    }
    case 'QUESTION': {
      const question = await Question.findById(resourceId);
      return question?.title || 'a question';
    }
    case 'JOB': {
      const job = await Job.findById(resourceId);
      return job?.title || 'a job';
    }
    default:
      return 'a post';
  }
};

export const getUserName = async (userId: string): Promise<string> => {
  const user = await User.findById(userId);
  return user?.name || 'Someone';
};
