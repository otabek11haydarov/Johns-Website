import prisma from '../config/db.js';

export async function calculateAndSaveVideoAssessment(data) {
  const { studentId, lessonCardId, videoDuration, watchedSeconds } = data;

  let completionRatio = watchedSeconds / videoDuration;
  
  if (completionRatio > 1) {
    completionRatio = 1;
  }

  // Calculate score and round to 2 decimal places
  let score = completionRatio * 10;
  score = Math.round(score * 100) / 100;

  const completed = watchedSeconds >= videoDuration;

  const assessment = await prisma.videoAssessment.create({
    data: {
      studentId,
      lessonCardId,
      videoDuration,
      watchedSeconds,
      completionRatio,
      score,
      completed
    }
  });

  return assessment;
}
