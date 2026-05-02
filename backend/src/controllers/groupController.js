import { lessons, tasks } from "../data/db.js";

export const getGroupData = (req, res) => {
        return res.status(200).json({
        success: true,
        message: "Group data retrieved successfully",
        data: lessons,
        data2: tasks,
    });
};
