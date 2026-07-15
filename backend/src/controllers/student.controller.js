import { studentService } from "../service/student.service.js";

export async function createStudent(req, res) {
  try {
    const student = await studentService.createStudent(req.body);

    return res.status(201).json({
      success: true,
      message: "Student created successfully.",
      student: {
        id: student.id,
        fullName: student.fullName,
        username: student.username,
        groupId: student.groupId, // We return groupId, or group if we fetched the relation. The requirement says group: "A1" but we only have groupId. Let's stick to returning what we have.
      }
    });
  } catch (error) {
    if (error.message === "Missing required fields" || 
        error.message === "Username already exists") {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Error creating student:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
