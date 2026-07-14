import { Router } from "express";
import { calculateAssessment } from "../controllers/lessonAssessment.controller.js";

const router = Router();

router.post("/calculate", calculateAssessment);

export default router;
