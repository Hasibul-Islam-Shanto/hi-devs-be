import catchAsync from '@/utils/catch-async';
import { paginate } from '@/utils/paginate';
import { zParse } from '@/utils/z-parse';
import { User } from './user.model';
import { getAllUsersSchema, updateUserProfileSchema } from './user.validation';

export const getAllUsers = catchAsync(async (req, res) => {
  const { query } = await zParse(getAllUsersSchema, req);
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;

  const searchFilter: Record<string, unknown> = {};
  if (query.search) {
    searchFilter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { username: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
    ];
  }

  const results = await paginate(User, searchFilter, {
    page,
    limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    select: '-password',
  });

  res.status(200).json({
    success: true,
    users: results.data,
    pagination: results.pagination,
  });
});

export const getUserProfile = catchAsync(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized access' });
  }

  const user = await User.findById(userId).select('-password');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.status(200).json({
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
});

export const updateUserProfile = catchAsync(async (req, res) => {
  const userId = req.params.id;
  const { body } = await zParse(updateUserProfileSchema, req);

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
      $set: body,
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
});
