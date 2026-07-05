import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import pool from "../config/db.js";
import { JWT_SECRET } from "../config/auth.js";

export async function register(req, res) {
  const { username, password } = req.body;
  const email = req.body.email?.trim().toLowerCase();

  if (!username?.trim() || !email || !password) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  const existingUserResult = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );

  if (existingUserResult.rows.length > 0) {
    return res.status(409).json({ message: "User email already exist!" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = randomUUID();

  const newUserResult = await pool.query(
    `INSERT INTO users (id, username, email, password, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, username, email, role`,
    [id, username.trim(), email, passwordHash, "student"]
  );

  return res.status(201).json({
    message: "Registered successfully!",
    user: newUserResult.rows[0],
  });
}

export async function login(req, res) {
  const { password } = req.body;
  const email = req.body.email?.trim().toLowerCase();

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  const userResult = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  if (userResult.rows.length === 0) {
    return res.status(404).json({ message: "User email does not exist!" });
  }

  const existingUser = userResult.rows[0];
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
