import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const envVarSchema = z.object({
  NODE_ENV: z
    .enum(['production', 'development', 'staging', 'test'])
    .default('production'),
  PORT: z.coerce.number().default(8080),
  MONGO_URI: z.string().default('mongodb://localhost:27017/mydatabase'),
  JWT_SECRET: z
    .string()
    .default('default-secret-key')
    .describe('JWT secret key'),
  ACCESS_TOKEN_EXPIRES_IN: z.coerce
    .number()
    .default(30)
    .describe('Access token expiration time in minutes'),
  REFRESH_TOKEN_EXPIRES_IN: z.coerce
    .number()
    .default(30)
    .describe('Refresh token expiration time in minutes'),
});

const envVars = envVarSchema.safeParse(process.env);
if (!envVars.success) {
  console.error('Invalid environment variables:', envVars.error.message);
  process.exit(1);
}

export default {
  env: envVars.data.NODE_ENV,
  port: envVars.data.PORT,
  mongoUrl: envVars.data.MONGO_URI,
  jwt: {
    secret: envVars.data.JWT_SECRET,
    accessTokenExpiresIn: envVars.data.ACCESS_TOKEN_EXPIRES_IN,
    refreshTokenExpiresIn: envVars.data.REFRESH_TOKEN_EXPIRES_IN,
  },
};
