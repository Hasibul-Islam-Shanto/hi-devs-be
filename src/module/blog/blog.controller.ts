import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Blog from './blog.model';

export const createBlogPost = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { title, description, cover, tags } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    if (!title || !description || !tags) {
      return res
        .status(400)
        .json({ message: 'Title, Description, and Tags fields are required' });
    }
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
  } catch (error) {
    console.error('Error creating blog post:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBlogPosts = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const blogs = await Blog.find()
      .populate('postedBy', 'name id profileImage')
      .sort({ createdAt: -1 });
    if (!blogs || blogs.length === 0) {
      return res.status(404).json({ message: 'No blog posts found' });
    }
    return res.status(200).json({
      success: true,
      blogs,
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBlogPostById = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const blogId = req.params.id;
    const blog = await Blog.findById(blogId).populate(
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
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateBlogPost = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const blogId = req.params.id;
    const { title, description, cover, tags } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const blog = await Blog.findById(blogId);

    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    if (blog.postedBy.toString() !== userId) {
      return res
        .status(403)
        .json({ message: 'Forbidden: You cannot edit this post' });
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      {
        title,
        description,
        cover,
        tags,
      },
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      success: true,
      message: 'Blog post updated successfully',
      blog: updatedBlog,
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteBlogPost = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const blogId = req.params.id;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

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
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const likeBlogPost = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const blogId = req.params.id;
    const userId = req?.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

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
  } catch (error) {
    console.error('Error liking blog post:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
