import express from "express";
import { 
    createLessonCardController, 
    reorderLessonCardsController 
} from "../controllers/lessonCardController.js";

const router = express.Router();

router.post("/", createLessonCardController);
router.patch("/reorder", reorderLessonCardsController);

export default router;
