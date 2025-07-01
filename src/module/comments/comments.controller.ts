import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Comment from './comments.model';

export const postNewComment = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { questionId, comment } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    if (!questionId || !comment) {
      return res.status(400).json({
        message: 'Question ID and comment are required',
      });
    }

    const newComment = new Comment({
      userId,
      questionId,
      comment,
    });

    await newComment.save();

    return res.status(201).json({
      success: true,
      message: 'Comment posted successfully',
      comment: newComment,
    });
  } catch (error) {
    console.error('Error posting comment:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCommentsByQuestionId = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { questionId } = req.params;

    if (!questionId) {
      return res.status(400).json({ message: 'Question ID is required' });
    }

    const comments = await Comment.find({ questionId })
      .populate('userId', 'name username')
      .sort({ createdAt: -1 });

    if (!comments || comments.length === 0) {
      return res
        .status(404)
        .json({ message: 'No comments found for this question' });
    }

    return res.status(200).json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const likeComment = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.userId;
    const convertedUserId = new mongoose.Types.ObjectId(userId);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

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
  } catch (error) {
    console.error('Error liking comment:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteComment = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden: Not your comment' });
    }

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateComment = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { commentId } = req.params;
    const { comment } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    if (!comment) {
      return res.status(400).json({ message: 'Comment content is required' });
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
  } catch (error) {
    console.error('Error updating comment:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
