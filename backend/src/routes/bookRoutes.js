import express from "express";
import { createBook, deleteBook, getBooks, updateBook } from "../controllers/bookController.js";
import { uploadBookFiles } from "../config/bookUpload.js";

const router = express.Router();

router.get("/", getBooks);
router.post("/", uploadBookFiles, createBook);
router.put("/:id", uploadBookFiles, updateBook);
router.delete("/:id", deleteBook);

export default router;
