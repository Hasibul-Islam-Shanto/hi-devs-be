import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from '../config/envs';
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

  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: 60 * 60, // 1 hour
  });
};

export const generateRefreshToken = (user: IUser): string => {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    username: user.username,
  };

  return jwt.sign(payload, REFRESH_TOKEN_SECRET as jwt.Secret, {
    expiresIn: '7d',
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET as jwt.Secret) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(
      token,
      REFRESH_TOKEN_SECRET as jwt.Secret,
    ) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};
