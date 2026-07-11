import prisma from '../config/db.js';

export async function createLessonCard(data) {
    const { lessonId, type, description } = data;
    const nextOrder = await getNextLessonCardOrder(lessonId);

    const newCard = await prisma.task.create({
        data: {
            lessonId,
            type,
            order: nextOrder,
            description
        }
    });
    return newCard;
}

export async function getNextLessonCardOrder(lessonId) {
    const lastCard = await prisma.task.findFirst({
        where: { lessonId },
        orderBy: { order: 'desc' },
        select: { order: true }
    });
    return lastCard ? lastCard.order + 1 : 1;
}

export async function deleteLessonCard(taskId) {
    await prisma.task.delete({
        where: { id: taskId }
    });
    return { success: true };
}

export async function reorderLessonCards(lessonId, orderedTaskIds) {
    return await prisma.$transaction(
        orderedTaskIds.map((id, index) => 
            prisma.task.update({
                where: { id },
                data: { order: index + 1 }
            })
        )
    );
}