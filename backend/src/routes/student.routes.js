import express from "express";
import { createStudent, updateStudent, deleteStudent, getStudentDashboardData, getLeaderboardData, getStudentStats } from "../controllers/student.controller.js";
import { verifyToken, adminOnly, studentOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", verifyToken, studentOnly, getStudentDashboardData);
router.get("/leaderboard", verifyToken, studentOnly, getLeaderboardData);
router.get("/stats", verifyToken, studentOnly, getStudentStats);

// Route to create a student. We protect it with verifyToken and adminOnly to ensure only admins can create students.
router.post("/", verifyToken, adminOnly, createStudent);
router.put("/:id", verifyToken, adminOnly, updateStudent);
router.delete("/:id", verifyToken, adminOnly, deleteStudent);

export default router;
