import express from "express";
import { createFlashcardTaskController } from "../controllers/flashcardController.js";

const router = express.Router();

router.post("/", createFlashcardTaskController);

export default router;
