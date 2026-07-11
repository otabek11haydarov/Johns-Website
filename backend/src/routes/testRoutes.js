import express from "express";
import { createTestTaskController } from "../controllers/testController.js";

const router = express.Router();

router.post("/", createTestTaskController);

export default router;
