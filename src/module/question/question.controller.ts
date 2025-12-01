import catchAsync from '@/utils/catch-async';
import { paginate } from '@/utils/paginate';
import { zParse } from '@/utils/z-parse';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Question from './question.model';
import {
  getAllQuestionsSchema,
  postQuestionSchema,
  questionIdParamSchema,
  updateQuestionSchema,
} from './question.validation';

export const postNewQuestion = catchAsync(async (req, res) => {
  const { body } = await zParse(postQuestionSchema, req);
  const { title, description, tags } = body;
  const askedBy = req.user?.userId;

  if (!askedBy) {
    return res.status(401).json({ message: 'Unauthorized access' });
  }

  const newQuestion = new Question({
    title,
    description,
    tags,
    askedBy,
  });

  await newQuestion.save();

  return res.status(201).json({
    success: true,
    message: 'Question posted successfully',
    question: newQuestion,
  });
});

export const getAllQuestions = catchAsync(async (req, res) => {
  const { query } = await zParse(getAllQuestionsSchema, req);
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

  const result = await paginate(Question, searchFilter, {
    page,
    limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    populate: { path: 'askedBy', select: 'name username profileImage' },
  });

  res.status(200).json({
    success: true,
    questions: result.data,
    pagination: result.pagination,
  });
});

export const getQuestionById = catchAsync(async (req, res) => {
  const { params } = await zParse(questionIdParamSchema, req);
  const question = await Question.findById(params.id).populate(
    'askedBy',
    'name username',
  );

  if (!question) {
    return res.status(404).json({ message: 'Question not found' });
  }

  return res.status(200).json({
    success: true,
    question,
  });
});

export const updateQuestion = catchAsync(async (req, res) => {
  const userId = req.user?.userId;
  const { body, params } = await zParse(updateQuestionSchema, req);
  const { title, description, tags } = body;
  const questionId = params.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized access' });
  }

  const question = await Question.findById(questionId);

  if (!question) {
    return res.status(404).json({ message: 'Question not found' });
  }

  if (question.askedBy._id.toString() !== userId) {
    return res
      .status(403)
      .json({ message: 'Forbidden: You cannot edit this question' });
  }

  const updatedQuestion = await Question.findByIdAndUpdate(
    questionId,
    { title, description, tags },
    { new: true },
  ).populate('askedBy', 'name username');

  if (!updatedQuestion) {
    return res.status(404).json({ message: 'Question not found' });
  }

  res.status(200).json({
    success: true,
    message: 'Question updated successfully',
    question: updatedQuestion,
  });
});

export const deleteQuestion = catchAsync(async (req, res) => {
  const { params } = await zParse(questionIdParamSchema, req);
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized access' });
  }
  const question = await Question.findById(params.id);

  if (!question) {
    return res.status(404).json({ message: 'Question not found' });
  }

  if (question.askedBy._id.toString() !== userId) {
    return res
      .status(403)
      .json({ message: 'Forbidden: You cannot delete this question' });
  }

  await Question.findByIdAndDelete(params.id);

  return res.status(200).json({
    success: true,
    message: 'Question deleted successfully',
  });
});

export const likeQuestion = catchAsync(async (req, res) => {
  const questionId = req.params.id;
  const userId = req.user?.userId;
  const convertedUserId = new mongoose.Types.ObjectId(userId);

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized access' });
  }

  const question = await Question.findById(questionId);

  if (!question) {
    return res.status(404).json({ message: 'Question not found' });
  }

  if (question.likes.includes(convertedUserId)) {
    question.likes = question.likes.filter((id) => id.toString() !== userId);
  } else {
    question.likes.push(convertedUserId);
  }

  await question.save();

  return res.status(200).json({
    success: true,
    message: 'Like status updated successfully',
    likes: question.likes,
  });
});
