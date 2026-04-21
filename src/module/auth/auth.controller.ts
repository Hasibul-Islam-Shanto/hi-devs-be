import redis from '@/config/redis';
import catchAsync from '@/utils/catch-async';
import { zParse } from '@/utils/z-parse';
import bcrypt from 'bcryptjs';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/token.utils';
import User from '../user/user.model';
import {
  refreshTokenSchema,
  signinSchema,
  signupSchema,
} from './auth.validation';

const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const refreshKey = (token: string) => `refresh_token:${token}`;

export const signup = catchAsync(async (req, res) => {
  const { body } = await zParse(signupSchema, req);
  const { username, email, password, name } = body;

  if (!username || !email || !password || !name) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(400).json({ message: 'User already exists.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    name,
    username,
    email,
    password: hashedPassword,
  });
  await newUser.save();

  res.status(201).json({
    success: true,
    message: 'User created successfully.',
  });
});

export const signin = catchAsync(async (req, res) => {
  const { body } = await zParse(signinSchema, req);
  const { email, password } = body;

  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials.' });
  }

  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  await redis.set(
    refreshKey(newRefreshToken),
    String(user._id),
    'EX',
    REFRESH_TOKEN_TTL,
  );

  res.status(200).json({
    success: true,
    message: 'Login successful.',
    user: {
      name: user.name,
      username: user.username,
      email: user.email,
      _id: user._id,
      bio: user.bio,
      profileImage: user.profileImage,
      location: user.location,
      website: user.website,
      socialLinks: user.socialLinks,
      skills: user.skills,
      isVerified: user.isVerified,
    },
    tokens: {
      accessToken,
      refreshToken: newRefreshToken,
    },
  });
});

export const refreshToken = catchAsync(async (req, res) => {
  const { body } = await zParse(refreshTokenSchema, req);
  const { refreshToken } = body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  const storedUserId = await redis.get(refreshKey(refreshToken));

  if (!storedUserId) {
    return res
      .status(401)
      .json({ message: 'Invalid or expired refresh token' });
  }

  // Verify JWT signature to ensure token wasn't tampered with
  verifyRefreshToken(refreshToken);

  const user = await User.findById(storedUserId);
  if (!user) {
    await redis.del(refreshKey(refreshToken));
    return res.status(404).json({ message: 'User not found' });
  }

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  // Rotate: delete old token, store new one
  await redis.del(refreshKey(refreshToken));
  await redis.set(
    refreshKey(newRefreshToken),
    String(user._id),
    'EX',
    REFRESH_TOKEN_TTL,
  );

  res.status(200).json({
    success: true,
    tokens: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    },
  });
});

export const logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  await redis.del(refreshKey(refreshToken));

  res.status(200).json({ success: true, message: 'Logout successful' });
});
