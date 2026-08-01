import prisma from '../config/db.js';

// VIDEO task ID for the current lesson
const VIDEO_TASK_ID = 'd0a0650a-0c68-4c74-a2fc-9d6705729524';
const NEW_VIDEO_URL = 'https://www.youtube.com/embed/Xbu7trNblnk';

const updated = await prisma.videoTask.update({
  where: { taskId: VIDEO_TASK_ID },
  data:  { videoUrl: NEW_VIDEO_URL }
});

console.log('Updated videoTask:', JSON.stringify(updated, null, 2));
await prisma.$disconnect();
