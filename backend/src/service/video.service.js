import prisma from '../config/db.js';

export async function createVideoTask(taskId, data) {
    const { videoUrl, duration } = data;

    const newVideoTask = await prisma.videoTask.create({
        data: {
            taskId,
            videoUrl,
            duration
        }
    });

    return newVideoTask;
}
