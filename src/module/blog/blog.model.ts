import mongoose, { Document, Schema } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  description: string;
  cover: string;
  tags: string[];
  postedBy: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    cover: { type: String, required: false },
    tags: { type: [String], default: [] },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
  },
);

const Blog = mongoose.model<IBlog>('Blog', blogSchema);
export default Blog;
