import prisma from "../config/db.js";

/**
 * Step 1: Create a new Lesson in DRAFT status
 */
export async function createLesson(data) {
    const { title, groupLevel, description } = data;

    const newLesson = await prisma.lesson.create({
        data: {
            title,
            groupLevel,
            description,
            status: "DRAFT"
        }
    });

    return newLesson;
}

/**
 * Step 4: Publish Lesson
 */
export async function publishLesson(lessonId) {
    const updatedLesson = await prisma.lesson.update({
        where: { id: lessonId },
        data: { status: "PUBLISHED" }
    });

    return updatedLesson;
}

/**
 * Delete a Lesson
 */
export async function deleteLesson(lessonId) {
    await prisma.lesson.delete({
        where: { id: lessonId }
    });
    return { success: true };
}
