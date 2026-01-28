import { createAndSendNotification } from '../notification.service';
import { NotificationResourceType } from '../notification.type';
import { getResourceDetails, getUserName } from './notification.resouce.helper';

export const notifyLike = async (
  commentorId: string,
  resourceType: NotificationResourceType,
  resourceId: string,
) => {
  try {
    console.log('Start creating comment notification...');
    const [{ recipientId, resourceTitle }, commentorName] = await Promise.all([
      getResourceDetails(resourceType, resourceId),
      getUserName(commentorId),
    ]);

    console.log(
      '🚀 ~ notifyComment ~ recipientId, resourceTitle, commentorName:',
      recipientId,
      resourceTitle,
      commentorName,
    );

    if (!recipientId) {
      console.warn('Recipient not found for comment notification');
      return;
    }

    await createAndSendNotification({
      recipient: recipientId,
      sender: commentorId,
      type: 'LIKE',
      resourceType,
      resourceId,
      message: `${commentorName} liked your ${resourceType.toLowerCase()}: "${resourceTitle}"`,
    });
  } catch (error) {
    console.error('Error sending like notification:', error);
  }
};
