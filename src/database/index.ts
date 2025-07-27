import mongoose from 'mongoose';
import envs from '../config/envs';

const connectDB = async () => {
  await mongoose.connect(envs.mongoUrl);
};

export default connectDB;
