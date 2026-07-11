import prisma from '../config/db.js';

export async function createFlashcardTask(taskId, data) {
    const { deckName, cards } = data;

    const newFlashcardTask = await prisma.flashcardTask.create({
        data: {
            taskId,
            deckName: deckName || "My Deck",
            cards: {
                create: cards?.map(c => ({
                    word: c.word,
                    description: c.description,
                    example: c.example
                })) || []
            }
        },
        include: { cards: true }
    });

    return newFlashcardTask;
}
