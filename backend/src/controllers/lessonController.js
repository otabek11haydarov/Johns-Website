import * as lessonService from '../service/lesson.service.js';

export async function getLessonsByGroupController(req, res) {
    try {
        const { groupLevel } = req.params;
        if (!groupLevel) {
            return res.status(400).json({ error: "groupLevel is required!" });
        }
        const lessons = await lessonService.getLessonsByGroup(groupLevel.toUpperCase());
        return res.status(200).json({ success: true, data: lessons });
    } catch (error) {
        console.error("Error fetching lessons by group:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function getLessonByIdController(req, res) {
    try {
        const { id } = req.params;
        const lesson = await lessonService.getLessonById(id);
        if (!lesson) {
            return res.status(404).json({ error: "Lesson not found" });
        }
        return res.status(200).json({ success: true, data: lesson });
    } catch (error) {
        console.error("Error fetching lesson by id:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function updateLessonController(req, res) {
    try {
        const { id } = req.params;
        const { title, description, status, tasks } = req.body;
        const updated = await lessonService.updateLesson(id, { title, description, status, tasks });
        return res.status(200).json({ success: true, message: "Lesson updated", data: updated });
    } catch (error) {
        console.error("Error updating lesson:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function reorderLessonsController(req, res) {
    try {
        const { orderedIds } = req.body;
        if (!Array.isArray(orderedIds)) {
            return res.status(400).json({ error: "orderedIds must be an array" });
        }
        await lessonService.reorderLessons(orderedIds);
        return res.status(200).json({ success: true, message: "Lessons reordered successfully" });
    } catch (error) {
        console.error("Error reordering lessons:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}



export async function createLessonWizardController(req, res) {
    try {
        const { title, groupLevel, description, status, tasks } = req.body;

        if (!title || !groupLevel) {
            return res.status(400).json({ error: "title and groupLevel are required!" });
        }

        const newLesson = await lessonService.createLessonWithTasks({ title, groupLevel, description, status, tasks });

        return res.status(201).json({
            success: true,
            message: "Lesson with tasks created successfully",
            data: newLesson
        });

    } catch (error) {
        console.error("Error creating lesson with wizard:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

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