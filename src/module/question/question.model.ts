import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion extends Document {
  title: string;
  description: string;
  tags: string[];
  askedBy: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    tags: { type: [String], default: [] },
    askedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
  },
);
const Question = mongoose.model<IQuestion>('Question', questionSchema);
export default Question;
