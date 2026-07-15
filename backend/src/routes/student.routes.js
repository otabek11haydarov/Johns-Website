import express from "express";
import { createStudent } from "../controllers/student.controller.js";
import { verifyToken, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Route to create a student. We protect it with verifyToken and adminOnly to ensure only admins can create students.
router.post("/", verifyToken, adminOnly, createStudent);

export default router;
