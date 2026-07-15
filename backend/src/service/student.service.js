import bcrypt from "bcrypt";
import prisma from "../config/db.js";

export class StudentService {
  async createStudent(data) {
    const { fullName, username, password, phone, groupId, status } = data;

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

    // // Check for duplicate email
    // const existingEmail = await prisma.user.findUnique({
    //   where: { email },
    // });
    // if (existingEmail) {
    //   throw new Error("Email already exists");
    // }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create student
    const student = await prisma.user.create({
      data: {
        fullName,
        username,
        password: hashedPassword,
        phone: phone || null,
        groupId,
        status: status || "Active",
        role: "STUDENT",
      },
    });

    // We don't want to return the password to the controller
    const { password: _, ...studentWithoutPassword } = student;
    return studentWithoutPassword;
  }
}

export const studentService = new StudentService();
