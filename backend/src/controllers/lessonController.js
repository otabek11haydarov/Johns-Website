import * as lessonService from '../service/lesson.service.js';

export async function createLessonController(req, res) {
    try {
        const { title, groupLevel, description } = req.body;

        if (!title || !groupLevel) {
            return res.status(400).json({ error: "title and groupLevel are required!" });
        }

        const newLesson = await lessonService.createLesson({ title, groupLevel, description });

        return res.status(201).json({
            success: true,
            message: "Lesson created as DRAFT",
            data: newLesson
        });

    } catch (error) {
        console.error("Error creating lesson:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function publishLessonController(req, res) {
    try {
        const { id } = req.params;
        const updatedLesson = await lessonService.publishLesson(id);

        return res.status(200).json({
            success: true,
            message: "Lesson PUBLISHED",
            data: updatedLesson
        });
    } catch (error) {
        console.error("Error publishing lesson:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function deleteLessonController(req, res) {
    try {
        const { id } = req.params;
        await lessonService.deleteLesson(id);

        return res.status(200).json({
            success: true,
            message: "Lesson deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting lesson:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}