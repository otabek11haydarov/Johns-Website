import * as lessonAssessmentService from '../service/lessonAssessment.service.js';

export const calculateAssessment = async (req, res, next) => {
  try {
    const { lessonId, studentId, video, vocabulary, flashcard, test, speaking } = req.body;

    if (!lessonId) {
      return res.status(400).json({ message: "lessonId is required." });
    }
    if (!studentId) {
      return res.status(400).json({ message: "studentId is required." });
    }

    const percentages = [video, vocabulary, flashcard, test, speaking];
    for (const p of percentages) {
      if (typeof p !== 'number' || p < 0 || p > 100) {
        return res.status(400).json({ message: "All component percentages must be a number between 0 and 100." });
      }
    }

    const result = await lessonAssessmentService.calculateLessonAssessment({
      lessonId,
      studentId,
      video,
      vocabulary,
      flashcard,
      test,
      speaking,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
