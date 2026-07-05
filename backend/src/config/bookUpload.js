import fs from "fs";
import path from "path";
import multer from "multer";

const uploadsRoot = path.resolve("uploads");
const booksDirectory = path.join(uploadsRoot, "books");
const coversDirectory = path.join(uploadsRoot, "covers");

fs.mkdirSync(booksDirectory, { recursive: true });
fs.mkdirSync(coversDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination(req, file, callback) {
    if (file.fieldname === "pdf") {
      callback(null, booksDirectory);
      return;
    }

    if (file.fieldname === "image") {
      callback(null, coversDirectory);
      return;
    }

    callback(new Error("Unsupported file field."));
  },
  filename(req, file, callback) {
    const safeName = file.originalname.replace(/\s+/g, "-");
    callback(null, `${Date.now()}-${safeName}`);
  },
});

const fileFilter = (req, file, callback) => {
  if (file.fieldname === "pdf") {
    const isPdf = file.mimetype === "application/pdf";
    callback(isPdf ? null : new Error("Only PDF files are allowed for books."), isPdf);
    return;
  }

  if (file.fieldname === "image") {
    const isImage = file.mimetype.startsWith("image/");
    callback(isImage ? null : new Error("Only image files are allowed for covers."), isImage);
    return;
  }

  callback(new Error("Unsupported file field."), false);
};

const upload = multer({
  storage,
  fileFilter,
});

export const uploadBookFiles = upload.fields([
  { name: "pdf", maxCount: 1 },
  { name: "image", maxCount: 1 },
]);
