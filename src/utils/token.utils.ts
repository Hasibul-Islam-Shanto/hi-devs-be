import jwt from 'jsonwebtoken';
import envs from '../config/envs';
import { IUser } from '../module/user/user.model';

interface TokenPayload {
  userId: string;
  username: string;
}

export const generateAccessToken = (user: IUser): string => {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    username: user.username,
  };

  return jwt.sign(payload, envs.jwt.secret, {
    expiresIn: `${envs.jwt.accessTokenExpiresIn}m`,
  });
};

export const generateRefreshToken = (user: IUser): string => {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    username: user.username,
  };

  return jwt.sign(payload, envs.jwt.secret, {
    expiresIn: `${envs.jwt.refreshTokenExpiresIn}d`,
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, envs.jwt.secret) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, envs.jwt.secret) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};
