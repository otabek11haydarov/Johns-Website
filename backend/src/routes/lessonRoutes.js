import express from "express";
import { 
    createLessonController, 
    publishLessonController, 
    deleteLessonController,
    createLessonWizardController
} from "../controllers/lessonController.js";

const router = express.Router();

router.post("/", createLessonController);
router.post("/wizard", createLessonWizardController);
router.patch("/:id/publish", publishLessonController);
router.delete("/:id", deleteLessonController);

export default router;
