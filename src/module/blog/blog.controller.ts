import { get } from 'http';
import catchAsync from '@/utils/catch-async';
import { paginate } from '@/utils/paginate';
import { zParse } from '@/utils/z-parse';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Blog from './blog.model';
import {
  blogIdParamSchema,
  createBlogPostSchema,
  getAllBlogPostsSchema,
  updateBlogPostSchema,
} from './blog.validation';

export const createBlogPost = catchAsync(async (req, res) => {
  const { body } = await zParse(createBlogPostSchema, req);
  const { title, description, cover, tags } = body;
  const userId = req?.user?.userId;

  const newBlogPost = new Blog({
    title,
    description,
    cover,
    tags,
    postedBy: userId,
  });
  await newBlogPost.save();
  return res.status(201).json({
    success: true,
    message: 'Blog post created successfully',
    blog: newBlogPost,
  });
});

export const getBlogPosts = catchAsync(async (req, res) => {
  const { query } = await zParse(getAllBlogPostsSchema, req);
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;

  const searchFilter: Record<string, unknown> = {};
  if (query.search) {
    searchFilter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
      { tags: { $regex: query.search, $options: 'i' } },
    ];
  }

  const result = await paginate(Blog, searchFilter, {
    page,
    limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    populate: { path: 'postedBy', select: 'name _id profileImage' },
  });

  return res.status(200).json({
    success: true,
    blogs: result.data,
    pagination: result.pagination,
  });
});

export const getBlogPostById = catchAsync(async (req, res) => {
  const { params } = await zParse(blogIdParamSchema, req);
  const blog = await Blog.findById(params.blogId).populate(
    'postedBy',
    'name _id profileImage',
  );

  if (!blog) {
    return res.status(404).json({ message: 'Blog post not found' });
  }

  return res.status(200).json({
    success: true,
    blog,
  });
});

export const updateBlogPost = catchAsync(async (req, res) => {
  const { body, params } = await zParse(updateBlogPostSchema, req);
  const userId = req.user?.userId;
  const blog = await Blog.findById(params.blogId);

  if (!blog) {
    return res.status(404).json({ message: 'Blog post not found' });
  }

  if (blog.postedBy.toString() !== userId) {
    return res
      .status(403)
      .json({ message: 'Forbidden: You cannot edit this post' });
  }

  const updatedBlog = await Blog.findByIdAndUpdate(
    params.blogId,
    { ...body },
    {
      new: true,
      runValidators: true,
    },
  );

  return res.status(200).json({
    success: true,
    message: 'Blog post updated successfully',
    blog: updatedBlog,
  });
});

export const deleteBlogPost = catchAsync(async (req, res) => {
  const { params } = await zParse(blogIdParamSchema, req);
  const blogId = params.blogId;
  const userId = req?.user?.userId;

  const blog = await Blog.findById(blogId);

  if (!blog) {
    return res.status(404).json({ message: 'Blog post not found' });
  }

  if (blog.postedBy.toString() !== userId) {
    return res
      .status(403)
      .json({ message: 'Forbidden: You cannot delete this post' });
  }

  await Blog.findByIdAndDelete(blogId);

  return res.status(200).json({
    success: true,
    message: 'Blog post deleted successfully',
  });
});

export const likeBlogPost = catchAsync(async (req, res) => {
  const { params } = await zParse(blogIdParamSchema, req);
  const blogId = params.blogId;
  const userId = req?.user?.userId;

  const blog = await Blog.findById(blogId);

  if (!blog) {
    return res.status(404).json({ message: 'Blog post not found' });
  }

  if (blog.likes.includes(new mongoose.Types.ObjectId(userId))) {
    blog.likes = blog.likes.filter((id) => id.toString() !== userId);
  } else {
    blog.likes.push(new mongoose.Types.ObjectId(userId));
  }

  await blog.save();

  return res.status(200).json({
    success: true,
    message: 'Blog post liked successfully',
    likes: blog.likes,
  });
});
