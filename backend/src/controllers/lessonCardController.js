import * as lessonCardService from '../service/lessonCard.service.js';

const VALID_CARD_TYPES = ['VIDEO', 'TEST', 'FLASHCARD', 'SPEAKING', 'READING', 'LISTENING', 'WRITING', 'VOCABULARY'];

export async function createLessonCardController(req, res) {
    try {
        const { lessonId, type, description } = req.body;

        if (!lessonId || !type) {
            return res.status(400).json({ error: "lessonId and type are required!" });
        }

        if (!VALID_CARD_TYPES.includes(type)) {
            return res.status(400).json({ error: "Unsupported card type!" });
        }

        const newCard = await lessonCardService.createLessonCard({ lessonId, type, description });

        return res.status(201).json({
            success: true,
            message: "Lesson card created successfully",
            data: newCard
        });

    } catch (error) {
        if (error.code === 'P2003') {
            console.error("Validation Error: Invalid lessonId provided.");
            return res.status(404).json({ error: "Lesson not found! Please provide a valid lessonId." });
        }
        
        console.error("Error creating lesson card:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function reorderLessonCardsController(req, res) {
    try {
        const { lessonId, orderedTaskIds } = req.body;

        if (!lessonId || !Array.isArray(orderedTaskIds)) {
            return res.status(400).json({ error: "lessonId and orderedTaskIds array are required!" });
        }

        await lessonCardService.reorderLessonCards(lessonId, orderedTaskIds);

        return res.status(200).json({
            success: true,
            message: "Cards reordered successfully"
        });
    } catch (error) {
        console.error("Error reordering lesson cards:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
