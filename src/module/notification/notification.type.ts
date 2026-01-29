import { N } from 'vitest/dist/chunks/environment.d.cL3nLXbE';
import { INotification } from './notification.model';

export type NotificationResourceType =
  | 'BLOG'
  | 'QUESTION'
  | 'JOB'
  | 'COMMENT'
  | 'APPLICATION';
export type NotificationType =
  | 'COMMENT'
  | 'LIKE'
  | 'FOLLOW'
  | 'MESSAGE'
  | 'APPLICATION'
  | 'REPLY';

export interface CreateNotificationData {
  recipient: string;
  sender: string;
  type: NotificationType;
  resourceType: NotificationResourceType;
  resourceId: string;
  message: string;
}

export interface NotificationPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  unreadCount: number;
}

export interface Notification {
  _id: string;
  recipient: string;
  sender: {
    _id: string;
    name: string;
    username: string;
    profileImage: string;
  };
  type: NotificationType;
  resourceType: NotificationResourceType;
  resourceId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  notifications: INotification[];
  pagination: NotificationPagination;
}
