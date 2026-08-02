import express from "express";
import { createVideoTaskController, getVideoInfoController } from "../controllers/videoController.js";

const router = express.Router();

router.get("/info", getVideoInfoController);
router.post("/", createVideoTaskController);

export default router;

