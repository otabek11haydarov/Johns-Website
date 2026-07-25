import * as taskTypeService from '../service/taskType.service.js';

export async function getTaskTypesController(req, res) {
    try {
        const taskTypes = await taskTypeService.getActiveTaskTypes();
        return res.status(200).json(taskTypes);
    } catch (error) {
        console.error("Error fetching task types:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
