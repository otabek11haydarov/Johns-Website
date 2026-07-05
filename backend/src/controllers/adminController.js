import prisma from "../config/db.js";

export async function getDashboardData(req, res) {
  try {
    const activity = await prisma.activity.findMany();
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      }
    });
    const groups = await prisma.group.findMany();

    return res.status(200).json({
      message: "Dashboard data retrieved successfully!",
      data: {
        activity,
        students,
        groups,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching dashboard data", error: error.message });
  }
}