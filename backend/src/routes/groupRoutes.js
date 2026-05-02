import express from "express";
import { getGroupData } from "../controllers/groupController.js";

const router = express.Router();
router.get("/groups", getGroupData);

export default router;