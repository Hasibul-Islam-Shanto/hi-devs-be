import mongoose, { Document, Model, Schema } from 'mongoose';
import {
  NotificationResourceType,
  NotificationType,
} from './notification.type';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId; // This should reference User model
  type: NotificationType;
  resourceType: NotificationResourceType;
  resourceId: mongoose.Types.ObjectId;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['COMMENT', 'APPLICATION', 'LIKE', 'REPLY'],
      required: true,
    },
    resourceType: {
      type: String,
      enum: ['BLOG', 'QUESTION', 'JOB', 'COMMENT'],
      required: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification: Model<INotification> = mongoose.model<INotification>(
  'Notification',
  notificationSchema,
);

export default Notification;
