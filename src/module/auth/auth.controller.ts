import catchAsync from '@/utils/catch-async';
import { zParse } from '@/utils/z-parse';
import bcrypt from 'bcryptjs';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/token.utils';
import User from '../user/user.model';
import RefreshToken from './auth.model';
import {
  refreshTokenSchema,
  signinSchema,
  signupSchema,
} from './auth.validation';

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
  const refreshToken = generateRefreshToken(user);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt,
  });

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
      refreshToken,
    },
  });
});

export const refreshToken = catchAsync(async (req, res) => {
  const { body } = await zParse(refreshTokenSchema, req);
  const { refreshToken } = body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  const storedToken = await RefreshToken.findOne({ token: refreshToken });

  if (!storedToken) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  if (storedToken.expiresAt < new Date()) {
    await RefreshToken.findByIdAndDelete(storedToken._id);
    return res.status(401).json({ message: 'Refresh token has expired' });
  }

  const { userId } = verifyRefreshToken(refreshToken);

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.findByIdAndDelete(storedToken._id);
  await RefreshToken.create({
    token: newRefreshToken,
    user: user._id,
    expiresAt,
  });

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

  await RefreshToken.findOneAndDelete({ token: refreshToken });

  res.status(200).json({ success: true, message: 'Logout successful' });
});
