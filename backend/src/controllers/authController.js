import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import { JWT_SECRET } from "../config/auth.js";

export async function register(req, res) {
  const { username, password } = req.body;
  const email = req.body.email?.trim().toLowerCase();
  
  // Optional: receive role from request if provided, defaults to STUDENT
  let role = req.body.role?.trim().toUpperCase();
  if (!["ADMIN", "TEACHER", "STUDENT"].includes(role)) {
    role = "STUDENT";
  }

  if (!username?.trim() || !email || !password) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return res.status(409).json({ message: "User email already exist!" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      username: username.trim(),
      email,
      password: passwordHash,
      role: role,
    },
    select: { id: true, username: true, email: true, role: true },
  });

  return res.status(201).json({
    message: "Registered successfully!",
    user: newUser,
  });
}

export async function login(req, res) {
  const { password } = req.body;
  const email = req.body.email?.trim().toLowerCase();

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    return res.status(404).json({ message: "User email does not exist!" });
  }

  const isPasswordMatch = await bcrypt.compare(password, existingUser.password);

  if (!isPasswordMatch) {
    return res.status(403).json({ message: "Password is incorrect!" });
  }

  const token = jwt.sign(
    { id: existingUser.id, email: existingUser.email, role: existingUser.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.status(200).json({
    message: "Login successfull",
    token,
    id: existingUser.id,
    role: existingUser.role,
  });
}
