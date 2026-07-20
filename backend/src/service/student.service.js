import bcrypt from "bcrypt";
import prisma from "../config/db.js";

export class StudentService {
  async createStudent(data) {
    const { fullName, username, password, phone, parentPhone, parentPassword, groupId, status } = data;

    if (!fullName || !username || !password || !groupId) {
      throw new Error("Missing required fields");
    }

    // Check for duplicate username
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      throw new Error("Username already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedParentPassword = parentPassword ? await bcrypt.hash(parentPassword, 10) : null;

    // Create student
    const student = await prisma.user.create({
      data: {
        fullName,
        username,
        password: hashedPassword,
        phone: phone || null,
        parentPhone: parentPhone || null,
        parentPassword: hashedParentPassword,
        groupId,
        status: status || "Active",
        role: "STUDENT",
      },
    });

    // We don't want to return the password to the controller
    const { password: _, parentPassword: __, ...studentWithoutPassword } = student;
    return studentWithoutPassword;
  }
}

export const studentService = new StudentService();
