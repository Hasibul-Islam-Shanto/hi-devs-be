import mongoose, { Document, Model, Schema } from 'mongoose';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  type: 'COMMENT' | 'LIKE' | 'FOLLOW' | 'MESSAGE' | 'APPLICATION' | 'REPLY';
  resourceType: 'BLOG' | 'QUESTION' | 'JOB' | 'COMMENT' | 'APPLICATION';
  resourceId: mongoose.Types.ObjectId;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema: Schema<INotification> = new Schema(
  {
    recipientId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    senderId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    type: {
      type: String,
      enum: ['COMMENT', 'LIKE', 'FOLLOW', 'MESSAGE', 'APPLICATION', 'REPLY'],
      required: true,
    },
    resourceType: {
      type: String,
      enum: ['BLOG', 'QUESTION', 'JOB', 'COMMENT', 'APPLICATION'],
      required: true,
    },
    resourceId: { type: Schema.Types.ObjectId, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
const Notification: Model<INotification> = mongoose.model<INotification>(
  'Notification',
  notificationSchema,
);

export default Notification;
