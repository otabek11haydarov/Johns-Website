import express from "express";
import { createVideoTaskController } from "../controllers/videoController.js";

const router = express.Router();

router.post("/", createVideoTaskController);

export default router;
