import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 8080;
export const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27017/mydatabase';

// JWT Configuration
export const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET ||
  'access-token-secret-key-change-in-production';
export const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET ||
  'refresh-token-secret-key-change-in-production';
export const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN;
export const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN;
