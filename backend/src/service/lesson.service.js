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
 * Step 1.5: Create Lesson with Tasks (Wizard)
 */
export async function createLessonWithTasks(data) {
    const { title, groupLevel, description, status, tasks } = data;

    return await prisma.$transaction(async (tx) => {
        // 1. Create Lesson
        const newLesson = await tx.lesson.create({
            data: {
                title,
                groupLevel,
                description,
                status: status || "DRAFT"
            }
        });

        if (!tasks || !Array.isArray(tasks)) {
            return newLesson;
        }

        // 2. Iterate through tasks and create them
        for (const taskData of tasks) {
            const { type, order, config = {} } = taskData;
            
            // Create the base Task
            const newTask = await tx.task.create({
                data: {
                    lessonId: newLesson.id,
                    type: type,
                    order: order,
                    description: config.description || null
                }
            });

            // 3. Create the specific sub-task if needed
            if (type === 'VIDEO') {
                await tx.videoTask.create({
                    data: {
                        taskId: newTask.id,
                        videoUrl: config.videoUrl || '',
                        duration: config.duration ? parseInt(config.duration, 10) : null
                    }
                });
            } else if (type === 'FLASHCARD' || type === 'VOCABULARY') {
                await tx.flashcardTask.create({
                    data: {
                        taskId: newTask.id,
                        deckName: config.deckName || 'Vocabulary Deck'
                    }
                });
            } else if (type === 'SPEAKING') {
                await tx.speakingTask.create({
                    data: {
                        taskId: newTask.id,
                        prompt: config.prompt || '',
                        durationLimit: config.limit ? parseInt(config.limit, 10) : null
                    }
                });
            } else if (type === 'WRITING') {
                await tx.writingTask.create({
                    data: {
                        taskId: newTask.id,
                        prompt: config.prompt || '',
                        wordLimit: config.limit ? parseInt(config.limit, 10) : null
                    }
                });
            } else if (type === 'READING') {
                await tx.readingTask.create({
                    data: {
                        taskId: newTask.id,
                        text: config.text || '',
                        wordCount: config.text ? config.text.split(/\s+/).length : 0
                    }
                });
            } else if (type === 'LISTENING') {
                await tx.listeningTask.create({
                    data: {
                        taskId: newTask.id,
                        audioUrl: config.audioUrl || ''
                    }
                });
            } else if (type === 'GRAMMAR') {
                // Config holds questions array for grammar
                const questionsData = Array.isArray(config.questions) ? config.questions : [];
                
                const newGrammarTest = await tx.grammarTest.create({
                    data: {
                        taskId: newTask.id
                    }
                });

                for (let i = 0; i < questionsData.length; i++) {
                    const q = questionsData[i];
                    const newQuestion = await tx.grammarQuestion.create({
                        data: {
                            grammarTestId: newGrammarTest.id,
                            type: q.type || 'MULTIPLE_CHOICE',
                            questionText: q.questionText || '',
                            order: i + 1,
                            explanation: q.explanation || null
                        }
                    });

                    if (Array.isArray(q.options)) {
                        for (const opt of q.options) {
                            await tx.grammarOption.create({
                                data: {
                                    questionId: newQuestion.id,
                                    optionText: opt.optionText || '',
                                    isCorrect: !!opt.isCorrect
                                }
                            });
                        }
                    }
                }
            }
            // Other types (TEST) will just exist as base tasks for now until their specific models are created/mapped
        }

        return newLesson;
    });
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
