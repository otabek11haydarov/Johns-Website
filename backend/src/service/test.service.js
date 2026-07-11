import prisma from '../config/db.js';

export async function createTestTask(taskId, data) {
    const { timeLimit, passingScore, questions } = data;

    // Business Logic Validations
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        throw new Error("A test must have at least one question.");
    }

    for (const q of questions) {
        if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
            throw new Error(`Question '${q.questionText}' must have at least 2 options.`);
        }

        const correctOptions = q.options.filter(opt => opt.isCorrect === true);
        if (correctOptions.length !== 1) {
            throw new Error(`Question '${q.questionText}' must have exactly one correct option.`);
        }
    }

    // Database Operation wrapped in a transaction
    const newTestTask = await prisma.$transaction(async (tx) => {
        return await tx.testTask.create({
            data: {
                taskId,
                timeLimit,
                passingScore,
                questions: {
                    create: questions.map((q, index) => ({
                        questionText: q.questionText,
                        order: index + 1,
                        options: {
                            create: q.options.map(opt => ({
                                optionText: opt.optionText,
                                isCorrect: opt.isCorrect
                            }))
                        }
                    }))
                }
            },
            include: {
                questions: {
                    include: {
                        options: true
                    }
                }
            }
        });
    });

    return newTestTask;
}
