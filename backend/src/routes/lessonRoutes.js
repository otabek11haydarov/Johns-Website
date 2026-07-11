import express from "express";
import { 
    createLessonController, 
    publishLessonController, 
    deleteLessonController 
} from "../controllers/lessonController.js";

const router = express.Router();

router.post("/", createLessonController);
router.patch("/:id/publish", publishLessonController);
router.delete("/:id", deleteLessonController);

export default router;
