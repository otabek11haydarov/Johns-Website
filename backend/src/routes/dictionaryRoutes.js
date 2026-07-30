import { Router } from "express";
import { bulkLookupWords } from "../controllers/dictionaryController.js";

const router = Router();

router.post("/bulk", bulkLookupWords);

export default router;
