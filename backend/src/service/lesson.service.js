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
                    const validCards = config.cards.filter(c => c.word || c.def || c.definition);
                    if (validCards.length > 0) {
                        await tx.flashcardItem.createMany({
                            data: validCards.map(card => ({
                                flashcardTaskId: flashcardTask.id,
                                word: card.word || '',
                                description: card.def || card.definition || '',
                                example: card.ex || card.example || card.exampleSentence || null
                            }))
                        });
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

                    if (Array.isArray(q.options) && q.options.length > 0) {
                        await tx.grammarOption.createMany({
                            data: q.options.map(opt => ({
                                questionId: newQuestion.id,
                                optionText: opt.optionText || '',
                                isCorrect: !!opt.isCorrect
                            }))
                        });
                    }
                }
            }
        }

        return newLesson;
    }, { maxWait: 20000, timeout: 90000 });
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
 * Helper to ensure a lesson has full task details (VIDEO, FLASHCARD, GRAMMAR, SPEAKING)
 */
async function ensureLessonTasks(lessonId) {
    return await prisma.$transaction(async (tx) => {
        // Task 1: Video
        const t1 = await tx.task.create({
            data: { lessonId, type: "VIDEO", order: 1, description: "Watch the lesson video" }
        });
        await tx.videoTask.create({
            data: { taskId: t1.id, videoUrl: "https://www.youtube-nocookie.com/embed/Ldu7V-CqR_s?rel=0&modestbranding=1&enablejsapi=1", duration: 5 }
        });

        // Task 2: Flashcard
        const t2 = await tx.task.create({
            data: { lessonId, type: "FLASHCARD", order: 2, description: "Learn one word at a time" }
        });
        const fc = await tx.flashcardTask.create({
            data: { taskId: t2.id, deckName: "Essential Vocabulary" }
        });
        await tx.flashcardItem.createMany({
            data: [
                { flashcardTaskId: fc.id, word: "Beautiful", description: "Very attractive or pleasing to look at.", example: "She wore a beautiful dress to the party." },
                { flashcardTaskId: fc.id, word: "Brave", description: "Showing courage and not being afraid.", example: "The brave firefighter saved the child." },
                { flashcardTaskId: fc.id, word: "Quiet", description: "Making very little noise.", example: "The library was quiet during the exam." }
            ]
        });

        // Task 3: Grammar Test
        const t3 = await tx.task.create({
            data: { lessonId, type: "GRAMMAR", order: 3, description: "Choose the correct answer" }
        });
        const gt = await tx.grammarTest.create({
            data: { taskId: t3.id }
        });
        const q1 = await tx.grammarQuestion.create({
            data: { grammarTestId: gt.id, questionText: "She ____ to school every day.", order: 1, type: "MULTIPLE_CHOICE" }
        });
        await tx.grammarOption.createMany({
            data: [
                { questionId: q1.id, optionText: "go", isCorrect: false },
                { questionId: q1.id, optionText: "goes", isCorrect: true },
                { questionId: q1.id, optionText: "going", isCorrect: false },
                { questionId: q1.id, optionText: "gone", isCorrect: false }
            ]
        });

        // Task 4: Speaking
        const t4 = await tx.task.create({
            data: { lessonId, type: "SPEAKING", order: 4, description: "Listen and speak clearly" }
        });
        await tx.speakingTask.create({
            data: { taskId: t4.id, prompt: "Describe your favorite daily routine in 3 sentences.", durationLimit: 60 }
        });
    });
}

/**
 * Helper to auto-seed a complete default Lesson in DB if table is empty
 */
async function createDefaultLessonInDB() {
    return await prisma.$transaction(async (tx) => {
        const newLesson = await tx.lesson.create({
            data: {
                title: "Daily Vocabulary Practice",
                groupLevel: "A1",
                description: "A1 darajadagi eng muhim so'zlarni interaktiv 3D flashcardlar va video dars orqali o'rganing.",
                status: "PUBLISHED",
                order: 1
            }
        });

        // Task 1: Video
        const t1 = await tx.task.create({
            data: { lessonId: newLesson.id, type: "VIDEO", order: 1, description: "Watch the lesson video" }
        });
        await tx.videoTask.create({
            data: { taskId: t1.id, videoUrl: "https://www.youtube-nocookie.com/embed/Ldu7V-CqR_s?rel=0&modestbranding=1&enablejsapi=1", duration: 5 }
        });

        // Task 2: Flashcard
        const t2 = await tx.task.create({
            data: { lessonId: newLesson.id, type: "FLASHCARD", order: 2, description: "Learn one word at a time" }
        });
        const fc = await tx.flashcardTask.create({
            data: { taskId: t2.id, deckName: "Essential Vocabulary" }
        });
        await tx.flashcardItem.createMany({
            data: [
                { flashcardTaskId: fc.id, word: "Beautiful", description: "Very attractive or pleasing to look at.", example: "She wore a beautiful dress to the party." },
                { flashcardTaskId: fc.id, word: "Brave", description: "Showing courage and not being afraid.", example: "The brave firefighter saved the child." },
                { flashcardTaskId: fc.id, word: "Quiet", description: "Making very little noise.", example: "The library was quiet during the exam." }
            ]
        });

        // Task 3: Grammar Test
        const t3 = await tx.task.create({
            data: { lessonId: newLesson.id, type: "GRAMMAR", order: 3, description: "Choose the correct answer" }
        });
        const gt = await tx.grammarTest.create({
            data: { taskId: t3.id }
        });
        const q1 = await tx.grammarQuestion.create({
            data: { grammarTestId: gt.id, questionText: "She ____ to school every day.", order: 1, type: "MULTIPLE_CHOICE" }
        });
        await tx.grammarOption.createMany({
            data: [
                { questionId: q1.id, optionText: "go", isCorrect: false },
                { questionId: q1.id, optionText: "goes", isCorrect: true },
                { questionId: q1.id, optionText: "going", isCorrect: false },
                { questionId: q1.id, optionText: "gone", isCorrect: false }
            ]
        });

        // Task 4: Speaking
        const t4 = await tx.task.create({
            data: { lessonId: newLesson.id, type: "SPEAKING", order: 4, description: "Listen and speak clearly" }
        });
        await tx.speakingTask.create({
            data: { taskId: t4.id, prompt: "Describe your favorite daily routine in 3 sentences.", durationLimit: 60 }
        });

        return await tx.lesson.findUnique({
            where: { id: newLesson.id },
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
    });
}

/**
 * Get a single Lesson with full task details and student stats
 */
export async function getLessonById(lessonId) {
    const taskInclude = {
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
                grammarTest: { include: { questions: { include: { options: true } } } }
            }
        }
    };

    let lesson = null;

    if (lessonId) {
        try {
            lesson = await prisma.lesson.findUnique({
                where: { id: lessonId },
                include: taskInclude
            });
        } catch (err) {
            // Ignore invalid UUID string error and fall back
            lesson = null;
        }
    }

    // Fallback if not found by exact primary key (e.g., 'lesson-1', 'lesson-2', or order numbers)
    if (!lesson) {
        let orderNum = null;
        if (lessonId && typeof lessonId === "string" && lessonId.includes("lesson-")) {
            orderNum = parseInt(lessonId.replace("lesson-", ""), 10);
        } else if (lessonId && !isNaN(parseInt(lessonId, 10))) {
            orderNum = parseInt(lessonId, 10);
        }

        if (orderNum) {
            lesson = await prisma.lesson.findFirst({
                where: { order: orderNum },
                include: taskInclude
            });
        }

        if (!lesson) {
            lesson = await prisma.lesson.findFirst({
                orderBy: { order: 'asc' },
                include: taskInclude
            });
        }

        // If DB has 0 lessons, create default lesson
        if (!lesson) {
            lesson = await createDefaultLessonInDB();
        }
    }

    if (!lesson) return null;

    // Student assessment stats for this lesson
    const assessments = await prisma.lessonAssessment.findMany({
        where: { lessonId: lesson.id },
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

                    // Update sub-task data (or create if missing)
                    if (type === 'VIDEO') {
                        if (existingTask.videoTask) {
                            await tx.videoTask.update({
                                where: { taskId: existingTask.id },
                                data: {
                                    videoUrl: config.videoUrl || '',
                                    duration: config.duration ? parseInt(config.duration, 10) : null
                                }
                            });
                        } else {
                            await tx.videoTask.create({
                                data: {
                                    taskId: existingTask.id,
                                    videoUrl: config.videoUrl || '',
                                    duration: config.duration ? parseInt(config.duration, 10) : null
                                }
                            });
                        }
                    } else if (type === 'FLASHCARD' || type === 'VOCABULARY') {
                        let flashcardTaskId;
                        if (existingTask.flashcardTask) {
                            flashcardTaskId = existingTask.flashcardTask.id;
                            await tx.flashcardTask.update({
                                where: { taskId: existingTask.id },
                                data: { deckName: config.deckName || 'Vocabulary Deck' }
                            });
                            await tx.flashcardItem.deleteMany({ where: { flashcardTaskId } });
                        } else {
                            const fc = await tx.flashcardTask.create({
                                data: { taskId: existingTask.id, deckName: config.deckName || 'Vocabulary Deck' }
                            });
                            flashcardTaskId = fc.id;
                        }

                        if (Array.isArray(config.cards)) {
                            const validCards = config.cards.filter(c => c.word || c.def || c.definition);
                            if (validCards.length > 0) {
                                await tx.flashcardItem.createMany({
                                    data: validCards.map(card => ({
                                        flashcardTaskId,
                                        word: card.word || '',
                                        description: card.def || card.definition || '',
                                        example: card.ex || card.example || card.exampleSentence || null
                                    }))
                                });
                            }
                        }
                    } else if (type === 'SPEAKING') {
                        if (existingTask.speakingTask) {
                            await tx.speakingTask.update({
                                where: { taskId: existingTask.id },
                                data: {
                                    prompt: config.prompt || '',
                                    durationLimit: config.limit ? parseInt(config.limit, 10) : null
                                }
                            });
                        } else {
                            await tx.speakingTask.create({
                                data: {
                                    taskId: existingTask.id,
                                    prompt: config.prompt || '',
                                    durationLimit: config.limit ? parseInt(config.limit, 10) : null
                                }
                            });
                        }
                    } else if (type === 'WRITING') {
                        if (existingTask.writingTask) {
                            await tx.writingTask.update({
                                where: { taskId: existingTask.id },
                                data: {
                                    prompt: config.prompt || '',
                                    wordLimit: config.limit ? parseInt(config.limit, 10) : null
                                }
                            });
                        } else {
                            await tx.writingTask.create({
                                data: {
                                    taskId: existingTask.id,
                                    prompt: config.prompt || '',
                                    wordLimit: config.limit ? parseInt(config.limit, 10) : null
                                }
                            });
                        }
                    } else if (type === 'READING') {
                        if (existingTask.readingTask) {
                            await tx.readingTask.update({
                                where: { taskId: existingTask.id },
                                data: {
                                    text: config.text || '',
                                    wordCount: config.text ? config.text.split(/\s+/).length : 0
                                }
                            });
                        } else {
                            await tx.readingTask.create({
                                data: {
                                    taskId: existingTask.id,
                                    text: config.text || '',
                                    wordCount: config.text ? config.text.split(/\s+/).length : 0
                                }
                            });
                        }
                    } else if (type === 'LISTENING') {
                        if (existingTask.listeningTask) {
                            await tx.listeningTask.update({
                                where: { taskId: existingTask.id },
                                data: { audioUrl: config.audioUrl || '' }
                            });
                        } else {
                            await tx.listeningTask.create({
                                data: { taskId: existingTask.id, audioUrl: config.audioUrl || '' }
                            });
                        }
                    } else if (type === 'GRAMMAR') {
                        let grammarTestId;
                        if (existingTask.grammarTest) {
                            grammarTestId = existingTask.grammarTest.id;
                            await tx.grammarQuestion.deleteMany({ where: { grammarTestId } });
                        } else {
                            const gt = await tx.grammarTest.create({
                                data: { taskId: existingTask.id }
                            });
                            grammarTestId = gt.id;
                        }

                        const questionsData = Array.isArray(config.questions) ? config.questions : [];
                        for (let i = 0; i < questionsData.length; i++) {
                            const q = questionsData[i];
                            const newQuestion = await tx.grammarQuestion.create({
                                data: {
                                    grammarTestId,
                                    type: q.type || 'MULTIPLE_CHOICE',
                                    questionText: q.questionText || '',
                                    order: i + 1,
                                    explanation: q.explanation || null
                                }
                            });
                            if (Array.isArray(q.options) && q.options.length > 0) {
                                await tx.grammarOption.createMany({
                                    data: q.options.map(opt => ({
                                        questionId: newQuestion.id,
                                        optionText: opt.optionText || '',
                                        isCorrect: !!opt.isCorrect
                                    }))
                                });
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
                            const validCards = config.cards.filter(c => c.word || c.def || c.definition);
                            if (validCards.length > 0) {
                                await tx.flashcardItem.createMany({
                                    data: validCards.map(card => ({
                                        flashcardTaskId: flashcardTask.id,
                                        word: card.word || '',
                                        description: card.def || card.definition || '',
                                        example: card.ex || card.example || card.exampleSentence || null
                                    }))
                                });
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
                            if (Array.isArray(q.options) && q.options.length > 0) {
                                await tx.grammarOption.createMany({
                                    data: q.options.map(opt => ({
                                        questionId: newQuestion.id,
                                        optionText: opt.optionText || '',
                                        isCorrect: !!opt.isCorrect
                                    }))
                                });
                            }
                        }
                    }
                }
            }
        }

        return updatedLesson;
    }, { maxWait: 20000, timeout: 90000 });
}
