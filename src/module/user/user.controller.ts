import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from './user.model';

export const userSignup = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { name, email, username, password } = req.body;

    if (!name || !email || !username || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      username,
      password: hashedPassword,
    });

    await newUser.save();

    res
      .status(201)
      .json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserProfile = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        profileImage: user.profileImage,
        bio: user.bio,
        skills: user.skills,
        location: user.location,
        website: user.website,
        socialLinks: user.socialLinks,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUserProfile = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const userId = req.user?.userId;
    const {
      name,
      username,
      bio,
      skills,
      location,
      website,
      socialLinks,
      profileImage,
    } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userId !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: 'Forbidden: You can only update your own profile' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        name,
        username,
        bio,
        skills,
        location,
        website,
        socialLinks,
        profileImage,
      },
      { new: true, runValidators: true },
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
