import jwt from "jsonwebtoken";
import { users } from "../data/db.js";
import { JWT_SECRET } from "../config/auth.js";

export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token is required!" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const currentUser = users.find((user) => user.id === decoded.id);

    if (!currentUser) {
      return res.status(401).json({ message: "User not found or no longer active!" });
    }

    req.user = {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token!" });
  }
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access only!" });
  }

  next();
}
