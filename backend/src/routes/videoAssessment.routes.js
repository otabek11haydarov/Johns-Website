import { Router } from "express";
import { createVideoAssessment } from "../controllers/videoAssessment.controller.js";

const router = Router();

router.post("/", createVideoAssessment);

export default router;
