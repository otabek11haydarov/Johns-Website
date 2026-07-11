import * as videoService from '../service/video.service.js';

export async function createVideoTaskController(req, res) {
    try {
        const { taskId, videoUrl, duration } = req.body;

        if (!taskId || !videoUrl) {
            return res.status(400).json({ error: "taskId and videoUrl are required!" });
        }

        const newVideoTask = await videoService.createVideoTask(taskId, { videoUrl, duration });

        return res.status(201).json({
            success: true,
            message: "Video task created successfully",
            data: newVideoTask
        });

    } catch (error) {
        if (error.code === 'P2003') {
            console.error("Validation Error: Invalid taskId provided.");
            return res.status(404).json({ error: "Task not found! Please provide a valid taskId." });
        }

        console.error("Error creating video task:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
