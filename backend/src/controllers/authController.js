import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import { JWT_SECRET } from "../config/auth.js";

export async function login(req, res) {
  const username = req.body.username?.trim();
  const { password } = req.body;

  if (!username || typeof username !== "string") {
    return res.status(400).json({ message: "Username is required and must be a valid string!" });
  }

  if (!password || typeof password !== "string") {
    return res.status(400).json({ message: "Password is required and must be a valid string!" });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "Username does not exist!" });
    }

    const isPasswordMatch = await bcrypt.compare(password, existingUser.password);

    if (!isPasswordMatch) {
      return res.status(403).json({ message: "Password is incorrect!" });
    }

    const token = jwt.sign(
      { id: existingUser.id, username: existingUser.username, role: existingUser.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      id: existingUser.id,
      role: existingUser.role,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "An error occurred during login. Please try again." });
  }
}
