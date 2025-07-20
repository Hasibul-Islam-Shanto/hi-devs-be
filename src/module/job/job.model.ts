import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IJob extends Document {
  title: string;
  description: string;
  company: string;
  location: 'Remote' | 'On-site' | 'Hybrid';
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  salaryRange: string;
  requiredSkills: string[];
  postedBy: mongoose.Types.ObjectId;
  status?: 'Open' | 'Closed';
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    company: { type: String, required: true },
    location: {
      type: String,
      enum: ['Remote', 'On-site', 'Hybrid'],
      required: true,
    },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
      required: true,
    },
    salaryRange: { type: String, required: true },
    requiredSkills: { type: [String], required: true },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['Open', 'Closed'],
      default: 'Open',
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const Job: Model<IJob> = mongoose.model<IJob>('Job', jobSchema);

export default Job;
