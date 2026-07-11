import * as flashcardService from '../service/flashcard.service.js';

export async function createFlashcardTaskController(req, res) {
    try {
        const { taskId, deckName, cards } = req.body;

        if (!taskId) {
            return res.status(400).json({ error: "taskId is required!" });
        }

        const newFlashcardTask = await flashcardService.createFlashcardTask(taskId, { deckName, cards });

        return res.status(201).json({
            success: true,
            message: "Flashcard task created successfully",
            data: newFlashcardTask
        });

    } catch (error) {
        console.error("Error creating flashcard task:", error);

        if (error.code === 'P2003') {
            return res.status(404).json({ error: "Task not found! Please provide a valid taskId." });
        }

        return res.status(500).json({ error: "Internal server error" });
    }
}
