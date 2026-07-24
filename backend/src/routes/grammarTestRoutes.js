import express from "express";
import { 
    getGrammarTestController, 
    submitGrammarTestController 
} from "../controllers/grammarTestController.js";

const router = express.Router();

// Route to fetch a grammar test for a task (student view, correct answers stripped)
router.get("/:taskId", getGrammarTestController);

// Route to submit answers for a grammar test
router.post("/:taskId/submit", submitGrammarTestController);

export default router;
