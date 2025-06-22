import { Request, Response } from 'express';
import Question from './question.model';

export const postNewQuestion = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { title, description, tags } = req.body;
    const askedBy = req.user?.userId;
    if (!askedBy) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }
    if (!title || !description) {
      return res
        .status(400)
        .json({ message: 'Title and description are required' });
    }
    const newQuestion = new Question({
      title,
      description,
      tags: tags || [],
      askedBy,
    });
    await newQuestion.save();
    return res.status(201).json({
      success: true,
      message: 'Question posted successfully',
      question: newQuestion,
    });
  } catch (error) {
    console.error('Error posting question:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllQuestions = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const questions = await Question.find()
      .populate('askedBy', 'name username')
      .sort({ createdAt: -1 });

    if (!questions || questions.length === 0) {
      return res.status(404).json({ message: 'No questions found' });
    }

    return res.status(200).json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getQuestionById = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const questionId = req.params.id;
    const question = await Question.findById(questionId).populate(
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
  } catch (error) {
    console.error('Error fetching question:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateQuestion = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const questionId = req.params.id;
    const { title, description, tags } = req.body;
    const updatedQuestion = await Question.findByIdAndUpdate(
      questionId,
      { title, description, tags },
      { new: true },
    ).populate('askedBy', 'name username');

    if (!updatedQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      question: updatedQuestion,
    });
  } catch (error) {
    console.error('Error updating question:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteQuestion = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const questionId = req.params.id;
    const deletedQuestion = await Question.findByIdAndDelete(questionId);

    if (!deletedQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
