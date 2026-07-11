import * as testService from '../service/test.service.js';

export async function createTestTaskController(req, res) {
    try {
        const { taskId, timeLimit, passingScore, questions } = req.body;

        if (!taskId) {
            return res.status(400).json({ error: "taskId is required!" });
        }

        const newTestTask = await testService.createTestTask(taskId, { timeLimit, passingScore, questions });

        return res.status(201).json({
            success: true,
            message: "Test task created successfully",
            data: newTestTask
        });

    } catch (error) {
        if (error.code === 'P2003') {
            console.error("Validation Error: Invalid taskId provided.");
            return res.status(404).json({ error: "Task not found! Please provide a valid taskId." });
        }

        // If it's a known validation error from our service, return 400
        if (error.message.includes("must have")) {
            console.error("Validation Error:", error.message);
            return res.status(400).json({ error: error.message });
        }

        console.error("Error creating test task:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
