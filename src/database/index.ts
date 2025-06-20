import { MONGO_URI } from "@/config";
import mongoose from "mongoose";

const connectDB = async () => {
  await mongoose.connect(MONGO_URI as string);
};

export default connectDB;
