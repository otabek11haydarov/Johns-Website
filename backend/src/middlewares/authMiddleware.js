import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { JWT_SECRET } from "../config/auth.js";

export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token is required!" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const userResult = await pool.query(
      "SELECT id, email, role FROM users WHERE id = $1",
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "User not found or no longer active!" });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token!" });
  }
}

export function allowRoles(...roles) {
  return function roleMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized!" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to access this resource!" });
    }

    next();
  };
}

export function adminOnly(req, res, next) {
  return allowRoles("admin")(req, res, next);
}

export function studentOnly(req, res, next) {
  return allowRoles("student")(req, res, next);
}
