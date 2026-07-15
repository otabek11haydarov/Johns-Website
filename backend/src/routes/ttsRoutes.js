import express from "express";
import { synthesizeTtsController } from "../controllers/ttsController.js";

const router = express.Router();

router.post("/", synthesizeTtsController);

export default router;
