import * as videoAssessmentService from '../service/videoAssessment.service.js';

export const createVideoAssessment = async (req, res, next) => {
  try {
    const { studentId, lessonCardId, videoDuration, watchedSeconds } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "studentId is required." });
    }
    if (!lessonCardId) {
      return res.status(400).json({ message: "lessonCardId is required." });
    }
    if (typeof videoDuration !== 'number' || videoDuration <= 0) {
      return res.status(400).json({ message: "videoDuration must be a number greater than 0." });
    }
    if (typeof watchedSeconds !== 'number' || watchedSeconds < 0) {
      return res.status(400).json({ message: "watchedSeconds must be a number greater than or equal to 0." });
    }

    const assessment = await videoAssessmentService.calculateAndSaveVideoAssessment({
      studentId,
      lessonCardId,
      videoDuration,
      watchedSeconds
    });

    res.status(201).json({
      completionRatio: assessment.completionRatio,
      score: assessment.score,
      completed: assessment.completed
    });
  } catch (error) {
    next(error);
  }
};
