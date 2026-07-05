import prisma from "../config/db.js";

export const getGroupData = async (req, res) => {
    try {
        const lessons = await prisma.lesson.findMany();
        const tasks = await prisma.task.findMany();
        
        return res.status(200).json({
            success: true,
            message: "Group data retrieved successfully",
            data: lessons,
            data2: tasks,
        });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching group data", error: error.message });
    }
};
