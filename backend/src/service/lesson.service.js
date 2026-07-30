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
                const flashcardTask = await tx.flashcardTask.create({
                    data: {
                        taskId: newTask.id,
                        deckName: config.deckName || 'Vocabulary Deck'
                    }
                });

                if (Array.isArray(config.cards)) {
                    for (const card of config.cards) {
                        if (card.word || card.def || card.definition) {
                            await tx.flashcardItem.create({
                                data: {
                                    flashcardTaskId: flashcardTask.id,
                                    word: card.word || '',
                                    description: card.def || card.definition || '',
                                    example: card.ex || card.example || card.exampleSentence || null
                                }
                            });
                        }
                    }
                }
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
    }, { maxWait: 15000, timeout: 30000 });
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
 * Reorder lessons
 */
export async function reorderLessons(orderedIds) {
    return await prisma.$transaction(
        orderedIds.map((id, index) => {
            return prisma.lesson.update({
                where: { id },
                data: { order: index + 1 }
            });
        })
    );
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

/**
 * Get all Lessons for a CEFR group with student statistics
 */
export async function getLessonsByGroup(groupLevel) {
    const lessons = await prisma.lesson.findMany({
        where: { groupLevel },
        include: {
            tasks: {
                select: { id: true, type: true, order: true }
            }
        },
        orderBy: { order: 'asc' }
    });

    // Aggregate LessonAssessment stats per lesson
    const lessonIds = lessons.map(l => l.id);
    const assessments = await prisma.lessonAssessment.groupBy({
        by: ['lessonId'],
        where: { lessonId: { in: lessonIds } },
        _count: { id: true },
        _avg: { overallScore: true },
        _min: { overallScore: true },
        _max: { overallScore: true }
    });

    const statsMap = {};
    assessments.forEach(a => {
        statsMap[a.lessonId] = {
            completedCount: a._count.id,
            avgScore: Math.round((a._avg.overallScore || 0) * 10) / 10,
            minScore: Math.round((a._min.overallScore || 0) * 10) / 10,
            maxScore: Math.round((a._max.overallScore || 0) * 10) / 10
        };
    });

    return lessons.map((lesson, index) => ({
        ...lesson,
        lessonNumber: index + 1,
        taskCount: lesson.tasks.length,
        stats: statsMap[lesson.id] || { completedCount: 0, avgScore: 0, minScore: 0, maxScore: 0 }
    }));
}

/**
 * Get a single Lesson with full task details and student stats
 */
export async function getLessonById(lessonId) {
    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
            tasks: {
                orderBy: { order: 'asc' },
                include: {
                    videoTask: true,
                    testTask: { include: { questions: true } },
                    flashcardTask: { include: { cards: true } },
                    speakingTask: true,
                    readingTask: true,
                    listeningTask: true,
                    writingTask: true,
                    grammarTest: { include: { questions: true } }
                }
            }
        }
    });

    if (!lesson) return null;

    // Student assessment stats for this lesson
    const assessments = await prisma.lessonAssessment.findMany({
        where: { lessonId },
        select: {
            studentId: true,
            overallScore: true,
            videoScore: true,
            vocabularyScore: true,
            flashcardScore: true,
            testScore: true,
            speakingScore: true,
            status: true,
            createdAt: true
        }
    });

    const completedCount = assessments.length;
    const avgScore = completedCount > 0
        ? Math.round(assessments.reduce((s, a) => s + a.overallScore, 0) / completedCount * 10) / 10
        : 0;
    const minScore = completedCount > 0
        ? Math.round(Math.min(...assessments.map(a => a.overallScore)) * 10) / 10
        : 0;
    const maxScore = completedCount > 0
        ? Math.round(Math.max(...assessments.map(a => a.overallScore)) * 10) / 10
        : 0;

    return {
        ...lesson,
        taskCount: lesson.tasks.length,
        stats: { completedCount, avgScore, minScore, maxScore }
    };
}

/**
 * Update a Lesson (title, description, status) in a transaction
 */
export async function updateLesson(lessonId, data) {
    const { title, description, status, tasks } = data;

    return await prisma.$transaction(async (tx) => {
        // Update lesson core fields
        const updatedLesson = await tx.lesson.update({
            where: { id: lessonId },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(status !== undefined && { status })
            }
        });

        if (Array.isArray(tasks)) {
            // 1. Get existing tasks
            const existingTasks = await tx.task.findMany({ 
                where: { lessonId: lessonId },
                include: {
                    videoTask: true,
                    speakingTask: true,
                    writingTask: true,
                    readingTask: true,
                    listeningTask: true,
                    flashcardTask: true,
                    grammarTest: true
                }
            });

            const incomingTypes = tasks.map(t => t.type);

            // 2. Delete tasks not in the incoming payload
            const tasksToDelete = existingTasks.filter(t => !incomingTypes.includes(t.type));
            for (const t of tasksToDelete) {
                await tx.task.delete({ where: { id: t.id } });
            }

            // 3. Create or update tasks
            for (const incomingTask of tasks) {
                const { type, order, config = {} } = incomingTask;
                const existingTask = existingTasks.find(t => t.type === type);

                if (existingTask) {
                    // Update order and basic config
                    await tx.task.update({
                        where: { id: existingTask.id },
                        data: { order: order, description: config.description || null }
                    });

                    // Update sub-task data
                    if (type === 'VIDEO' && existingTask.videoTask) {
                        await tx.videoTask.update({
                            where: { taskId: existingTask.id },
                            data: {
                                videoUrl: config.videoUrl || '',
                                duration: config.duration ? parseInt(config.duration, 10) : null
                            }
                        });
                    } else if ((type === 'FLASHCARD' || type === 'VOCABULARY') && existingTask.flashcardTask) {
                        const flashcardTaskId = existingTask.flashcardTask.id;
                        await tx.flashcardTask.update({
                            where: { taskId: existingTask.id },
                            data: { deckName: config.deckName || 'Vocabulary Deck' }
                        });

                        if (Array.isArray(config.cards)) {
                            await tx.flashcardItem.deleteMany({ where: { flashcardTaskId } });
                            for (const card of config.cards) {
                                if (card.word || card.def || card.definition) {
                                    await tx.flashcardItem.create({
                                        data: {
                                            flashcardTaskId: flashcardTaskId,
                                            word: card.word || '',
                                            description: card.def || card.definition || '',
                                            example: card.ex || card.example || card.exampleSentence || null
                                        }
                                    });
                                }
                            }
                        }
                    } else if (type === 'SPEAKING' && existingTask.speakingTask) {
                        await tx.speakingTask.update({
                            where: { taskId: existingTask.id },
                            data: {
                                prompt: config.prompt || '',
                                durationLimit: config.limit ? parseInt(config.limit, 10) : null
                            }
                        });
                    } else if (type === 'WRITING' && existingTask.writingTask) {
                        await tx.writingTask.update({
                            where: { taskId: existingTask.id },
                            data: {
                                prompt: config.prompt || '',
                                wordLimit: config.limit ? parseInt(config.limit, 10) : null
                            }
                        });
                    } else if (type === 'READING' && existingTask.readingTask) {
                        await tx.readingTask.update({
                            where: { taskId: existingTask.id },
                            data: {
                                text: config.text || '',
                                wordCount: config.text ? config.text.split(/\s+/).length : 0
                            }
                        });
                    } else if (type === 'LISTENING' && existingTask.listeningTask) {
                        await tx.listeningTask.update({
                            where: { taskId: existingTask.id },
                            data: { audioUrl: config.audioUrl || '' }
                        });
                    } else if (type === 'GRAMMAR' && existingTask.grammarTest) {
                        // For grammar, delete old questions and insert new ones
                        const grammarTestId = existingTask.grammarTest.id;
                        await tx.grammarQuestion.deleteMany({ where: { grammarTestId } });

                        const questionsData = Array.isArray(config.questions) ? config.questions : [];
                        for (let i = 0; i < questionsData.length; i++) {
                            const q = questionsData[i];
                            const newQuestion = await tx.grammarQuestion.create({
                                data: {
                                    grammarTestId: grammarTestId,
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
                } else {
                    // Create new task (from scratch)
                    const newTask = await tx.task.create({
                        data: {
                            lessonId: lessonId,
                            type: type,
                            order: order,
                            description: config.description || null
                        }
                    });

                    if (type === 'VIDEO') {
                        await tx.videoTask.create({
                            data: {
                                taskId: newTask.id,
                                videoUrl: config.videoUrl || '',
                                duration: config.duration ? parseInt(config.duration, 10) : null
                            }
                        });
                    } else if (type === 'FLASHCARD' || type === 'VOCABULARY') {
                        const flashcardTask = await tx.flashcardTask.create({
                            data: { taskId: newTask.id, deckName: config.deckName || 'Vocabulary Deck' }
                        });
                        if (Array.isArray(config.cards)) {
                            for (const card of config.cards) {
                                if (card.word || card.def || card.definition) {
                                    await tx.flashcardItem.create({
                                        data: {
                                            flashcardTaskId: flashcardTask.id,
                                            word: card.word || '',
                                            description: card.def || card.definition || '',
                                            example: card.ex || card.example || card.exampleSentence || null
                                        }
                                    });
                                }
                            }
                        }
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
                            data: { taskId: newTask.id, audioUrl: config.audioUrl || '' }
                        });
                    } else if (type === 'GRAMMAR') {
                        const newGrammarTest = await tx.grammarTest.create({
                            data: { taskId: newTask.id }
                        });
                        const questionsData = Array.isArray(config.questions) ? config.questions : [];
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
                }
            }
        }

        return updatedLesson;
    }, { maxWait: 15000, timeout: 30000 });
}
