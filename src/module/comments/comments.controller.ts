import catchAsync from '@/utils/catch-async';
import { paginate } from '@/utils/paginate';
import { zParse } from '@/utils/z-parse';
import mongoose from 'mongoose';
import Comment from './comments.model';
import {
  addCommentSchema,
  commentIdParamSchema,
  getAllCommentsSchema,
  updateCommentSchema,
} from './comments.validation';

export const postNewComment = catchAsync(async (req, res) => {
  const { body, query } = await zParse(addCommentSchema, req);
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized access' });
  }

  const newComment = new Comment({
    commentor: userId,
    commentableType: query.commentableType,
    commentableId: query.commentableId,
    comment: body.comment,
  });

  await newComment.save();

  return res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    comment: newComment,
  });
});

export const getAllComments = catchAsync(async (req, res) => {
  const { params, query } = await zParse(getAllCommentsSchema, req);
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const filter = {
    commentableType: params.type,
    commentableId: params.id,
    parentComment: null,
  };

  const results = await paginate(Comment, filter, {
    page,
    limit,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    populate: { path: 'commentor', select: '_id name username profileImage' },
  });

  return res.status(200).json({
    success: true,
    data: results.data,
    pagination: results.pagination,
  });
});

export const likeComment = catchAsync(async (req, res) => {
  const { params } = await zParse(commentIdParamSchema, req);
  const { commentId } = params;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized access' });
  }

  const convertedUserId = new mongoose.Types.ObjectId(userId);

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  if (comment.likes.includes(convertedUserId)) {
    comment.likes = comment.likes.filter(
      (like) => !like.equals(convertedUserId),
    );
  } else {
    comment.likes.push(convertedUserId);
  }

  await comment.save();

  return res.status(200).json({
    success: true,
    message: 'Comment like status updated',
    likesCount: comment.likes.length,
  });
});

export const deleteComment = catchAsync(async (req, res) => {
  const { params } = await zParse(commentIdParamSchema, req);
  console.log('🚀 ~ params:', params);
  const userId = req.user?.userId;
  console.log('🚀 ~ userId:', userId);

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized access' });
  }

  const comment = await Comment.findById(params.commentId);

  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  if (comment.commentor.toString() !== userId) {
    return res.status(403).json({ message: 'Forbidden: Not your comment' });
  }

  await Comment.findByIdAndDelete(params.commentId);

  return res.status(200).json({
    success: true,
    message: 'Comment deleted successfully',
  });
});

export const updateComment = catchAsync(async (req, res) => {
  const { params, body } = await zParse(updateCommentSchema, req);
  const { commentId } = params;
  const { comment } = body;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized access' });
  }

  const existingComment = await Comment.findById(commentId);

  if (!existingComment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  if (existingComment.commentor.toString() !== userId) {
    return res
      .status(403)
      .json({ message: 'Forbidden: You can only update your own comments' });
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    { comment },
    { new: true },
  );

  if (!updatedComment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  return res.status(200).json({
    success: true,
    message: 'Comment updated successfully',
    comment: updatedComment,
  });
});
