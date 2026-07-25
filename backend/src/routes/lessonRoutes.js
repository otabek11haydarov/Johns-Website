import express from "express";
import { 
    createLessonController, 
    publishLessonController, 
    deleteLessonController,
    createLessonWizardController,
    getLessonsByGroupController,
    getLessonByIdController,
    updateLessonController,
    reorderLessonsController
} from "../controllers/lessonController.js";

const router = express.Router();

router.get("/group/:groupLevel", getLessonsByGroupController);
router.get("/:id", getLessonByIdController);
router.post("/", createLessonController);
router.post("/wizard", createLessonWizardController);
router.put("/reorder", reorderLessonsController);
router.put("/:id", updateLessonController);
router.patch("/:id/publish", publishLessonController);
router.delete("/:id", deleteLessonController);

export default router;

