import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  commentor: mongoose.Types.ObjectId;
  commentableType: 'Question' | 'Blog' | 'Job';
  commentableId: mongoose.Types.ObjectId;
  comment: string;
  likes: mongoose.Types.ObjectId[];
  parentComment?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema: Schema<IComment> = new Schema(
  {
    commentor: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    commentableType: {
      type: String,
      required: true,
      enum: ['Question', 'Blog', 'Job'],
    },
    commentableId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'commentableType',
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Comment = mongoose.model<IComment>('Comment', commentSchema);
export default Comment;
