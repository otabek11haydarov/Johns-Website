import fs from "fs";
import path from "path";
import prisma from "../config/db.js";

const DEFAULT_BOOK_IMAGE = "default-book.png";

function removeUploadedFile(filePath) {
  if (!filePath || filePath === DEFAULT_BOOK_IMAGE || !filePath.startsWith("uploads/")) {
    return;
  }

  const absolutePath = path.resolve(filePath);

  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
}

export async function getBooks(req, res) {
  try {
    const books = await prisma.book.findMany();
    return res.status(200).json({
      message: "Books fetched successfully!",
      data: books,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching books", error: error.message });
  }
}

export async function createBook(req, res) {
  const title = req.body.title?.trim();
  const author = req.body.author?.trim();
  const level = req.body.level?.trim();
  const pdfFile = req.files?.pdf?.[0];
  const imageFile = req.files?.image?.[0];

  if (!title || !author || !level || !pdfFile) {
    if (pdfFile) {
      removeUploadedFile(`uploads/books/${pdfFile.filename}`);
    }

    if (imageFile) {
      removeUploadedFile(`uploads/covers/${imageFile.filename}`);
    }

    return res.status(400).json({ message: "Title, author, level, and PDF file are required!" });
  }

  try {
    const newBook = await prisma.book.create({
      data: {
        title,
        author,
        level,
        pdf: `uploads/books/${pdfFile.filename}`,
        image: imageFile ? `uploads/covers/${imageFile.filename}` : DEFAULT_BOOK_IMAGE,
      }
    });

    return res.status(201).json({
      message: "Book created successfully!",
      data: newBook,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error creating book", error: error.message });
  }
}

export async function updateBook(req, res) {
  const id = Number(req.params.id);

  try {
    const existingBook = await prisma.book.findUnique({ where: { id } });

    if (!existingBook) {
      const pdfFile = req.files?.pdf?.[0];
      const imageFile = req.files?.image?.[0];

      if (pdfFile) {
        removeUploadedFile(`uploads/books/${pdfFile.filename}`);
      }

      if (imageFile) {
        removeUploadedFile(`uploads/covers/${imageFile.filename}`);
      }

      return res.status(404).json({ message: "Book not found!" });
    }

    const title = req.body.title?.trim();
    const author = req.body.author?.trim();
    const level = req.body.level?.trim();
    const pdfFile = req.files?.pdf?.[0];
    const imageFile = req.files?.image?.[0];

    if (!title || !author || !level) {
      if (pdfFile) {
        removeUploadedFile(`uploads/books/${pdfFile.filename}`);
      }

      if (imageFile) {
        removeUploadedFile(`uploads/covers/${imageFile.filename}`);
      }

      return res.status(400).json({ message: "Title, author, and level are required!" });
    }

    let updatedPdf = existingBook.pdf;
    let updatedImage = existingBook.image;

    if (pdfFile) {
      removeUploadedFile(existingBook.pdf);
      updatedPdf = `uploads/books/${pdfFile.filename}`;
    }

    if (imageFile) {
      removeUploadedFile(existingBook.image);
      updatedImage = `uploads/covers/${imageFile.filename}`;
    }

    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        title,
        author,
        level,
        pdf: updatedPdf,
        image: updatedImage,
      }
    });

    return res.status(200).json({
      message: "Book updated successfully!",
      data: updatedBook,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error updating book", error: error.message });
  }
}

export async function deleteBook(req, res) {
  const id = Number(req.params.id);

  try {
    const existingBook = await prisma.book.findUnique({ where: { id } });

    if (!existingBook) {
      return res.status(404).json({ message: "Book not found!" });
    }

    await prisma.book.delete({ where: { id } });
    
    removeUploadedFile(existingBook.pdf);
    removeUploadedFile(existingBook.image);

    return res.status(200).json({ message: "Book deleted successfully!" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting book", error: error.message });
  }
}
