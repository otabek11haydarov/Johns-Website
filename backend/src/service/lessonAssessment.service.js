import prisma from '../config/db.js';
import { LESSON_WEIGHTS } from '../config/lessonAssessment.config.js';

export async function calculateLessonAssessment(data) {
  const { lessonId, studentId, video, vocabulary, flashcard, test, speaking } = data;

  // Calculate weighted scores
  const videoScore = (video / 100) * LESSON_WEIGHTS.VIDEO;
  const vocabularyScore = (vocabulary / 100) * LESSON_WEIGHTS.VOCABULARY;
  const flashcardScore = (flashcard / 100) * LESSON_WEIGHTS.FLASHCARD;
  const testScore = (test / 100) * LESSON_WEIGHTS.TEST;
  const speakingScore = (speaking / 100) * LESSON_WEIGHTS.SPEAKING;

  const overallScore = videoScore + vocabularyScore + flashcardScore + testScore + speakingScore;
  const status = overallScore >= 70 ? 'PASSED' : 'FAILED';

  const newAssessment = await prisma.lessonAssessment.create({
    data: {
      lessonId,
      studentId,
      videoScore,
      vocabularyScore,
      flashcardScore,
      testScore,
      speakingScore,
      overallScore,
      status,
    },
  });

  return newAssessment;
}
