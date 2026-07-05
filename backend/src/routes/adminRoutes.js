import express from "express";
import { getDashboardData } from "../controllers/adminController.js";
import { adminOnly, verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.get("/dashboard", verifyToken, adminOnly, getDashboardData);

export default router;
