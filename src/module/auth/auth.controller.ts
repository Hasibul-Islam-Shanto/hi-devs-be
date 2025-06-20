import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/token.utils';
import User from '../user/user.model';
import RefreshToken from './auth.model';

export const signup = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { username, email, password, name } = req.body;
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
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

export const signin = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { email, password } = req.body;
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
        id: user._id,
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
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { refreshToken } = req.body;

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

    try {
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

      return res.status(200).json({
        success: true,
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    await RefreshToken.findOneAndDelete({ token: refreshToken });

    return res
      .status(200)
      .json({ success: true, message: 'Logout successful' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};
