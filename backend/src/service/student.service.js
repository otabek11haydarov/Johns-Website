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

    const { password: _, parentPassword: __, ...studentWithoutPassword } = student;
    return studentWithoutPassword;
  }

  async updateStudent(id, data) {
    const updateData = { ...data };
    
    if (updateData.username) {
      const existing = await prisma.user.findFirst({
        where: { username: updateData.username, NOT: { id } }
      });
      if (existing) throw new Error("Username already exists");
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password;
    }
    
    if (updateData.parentPassword) {
      updateData.parentPassword = await bcrypt.hash(updateData.parentPassword, 10);
    } else {
      delete updateData.parentPassword;
    }

    const student = await prisma.user.update({
      where: { id },
      data: updateData
    });
    
    const { password: _, parentPassword: __, ...studentWithoutPassword } = student;
    return studentWithoutPassword;
  }

  async deleteStudent(id) {
    await prisma.user.delete({ where: { id } });
    return true;
  }
}

export const studentService = new StudentService();
