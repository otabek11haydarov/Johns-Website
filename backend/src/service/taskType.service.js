import prisma from '../config/db.js';

export async function getActiveTaskTypes() {
    return await prisma.lessonTaskType.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' }
    });
}
