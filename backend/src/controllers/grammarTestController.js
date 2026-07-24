import prisma from "../config/db.js";

// Get Grammar Test questions for a specific task ID
export async function getGrammarTestController(req, res) {
    try {
        const { taskId } = req.params;

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                grammarTest: {
                    include: {
                        questions: {
                            orderBy: { order: 'asc' },
                            include: {
                                options: {
                                    // Don't send isCorrect flag to the student before submission
                                    select: {
                                        id: true,
                                        optionText: true,
                                        questionId: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!task || !task.grammarTest) {
            return res.status(404).json({ error: "Grammar test not found for this task." });
        }

        return res.status(200).json({
            success: true,
            data: task.grammarTest
        });
    } catch (error) {
        console.error("Error fetching grammar test:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

// Submit Grammar Test attempt
export async function submitGrammarTestController(req, res) {
    try {
        const { taskId } = req.params;
        const { studentId, answers } = req.body; 
        // answers format: { questionId: selectedOptionId }

        if (!studentId || !answers) {
            return res.status(400).json({ error: "studentId and answers are required." });
        }

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                grammarTest: {
                    include: {
                        questions: {
                            include: {
                                options: true
                            }
                        }
                    }
                }
            }
        });

        if (!task || !task.grammarTest) {
            return res.status(404).json({ error: "Grammar test not found." });
        }

        const grammarTest = task.grammarTest;
        let score = 0;
        const totalQuestions = grammarTest.questions.length;
        const processedAnswers = [];

        for (const question of grammarTest.questions) {
            const selectedOptionId = answers[question.id];
            
            // Find correct option
            const correctOption = question.options.find(o => o.isCorrect);
            const isCorrect = correctOption && correctOption.id === selectedOptionId;

            if (isCorrect) {
                score++;
            }

            processedAnswers.push({
                questionId: question.id,
                selectedOptionId: selectedOptionId || null,
                isCorrect: !!isCorrect
            });
        }

        const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

        // Save attempt in transaction
        const attempt = await prisma.$transaction(async (tx) => {
            const newAttempt = await tx.studentGrammarAttempt.create({
                data: {
                    grammarTestId: grammarTest.id,
                    studentId,
                    score,
                    totalQuestions,
                    percentage
                }
            });

            const answerRecords = processedAnswers.map(ans => ({
                attemptId: newAttempt.id,
                ...ans
            }));

            await tx.studentGrammarAnswer.createMany({
                data: answerRecords
            });

            return newAttempt;
        });

        // Send back graded result with correct answers and explanations
        return res.status(200).json({
            success: true,
            data: {
                attemptId: attempt.id,
                score,
                totalQuestions,
                percentage,
                gradedAnswers: processedAnswers,
                questions: grammarTest.questions.map(q => ({
                    id: q.id,
                    explanation: q.explanation,
                    correctOptionId: q.options.find(o => o.isCorrect)?.id
                }))
            }
        });

    } catch (error) {
        console.error("Error submitting grammar test:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
