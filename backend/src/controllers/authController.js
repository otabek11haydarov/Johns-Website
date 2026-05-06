import bcrypt from "bcrypt";
import {users} from "../data/db.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/auth.js";

export async function register(req, res) {
  const { username, password } = req.body;
  const email = req.body.email?.trim().toLowerCase();

  // 1 validation
  if (!username?.trim() || !email || !password) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  // 2 existance
  const existingUser = users.find((user) => user.email === email);
  if (existingUser) {
    return res.status(409).json({ message: "User email already exist!" });
  }

  // 3 hashing
  const passwordHash = await bcrypt.hash(password, 10);

  // 4 new information
  const newUser = {
    id: Math.random(),
    username: username.trim(),
    email,
    password: passwordHash,
    role: "student",
  };
  users.push(newUser);

  //5 success reponce
  return res.status(201).json({ message: "Registered successfully!" });
}

export async function login(req, res) {
  const { password } = req.body;
  const email = req.body.email?.trim().toLowerCase();

  // 1 validation
  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  // 2 existance
  const existingUser = users.find((user) => user.email === email);
  if (!existingUser) {
    return res.status(404).json({ message: "User email does not exist!" });
  }

  // 3 password check
  const isPassowrdMatch = await bcrypt.compare(password, existingUser.password);
  if (!isPassowrdMatch) {
    return res.status(403).json({ message: "Password is incorrect!" });
  }

  // token generation
  const token = jwt.sign(
    { id: existingUser.id, email: existingUser.email, role: existingUser.role },
    JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );

  // success response
  return res.status(200).json({
    message: "Login successfull",
    token,
    id: existingUser.id,
    role: existingUser.role,
  });
}
