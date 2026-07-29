import { studentService } from "../service/student.service.js";
import prisma from "../config/db.js";

export async function getStudentDashboardData(req, res) {
  try {
    const studentId = req.user.id;
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: { group: true }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const groupLevel = student.group ? student.group.level : null;
    const groupId = student.groupId;

    // Fetch lessons for the group ordered by order ASC
    let allLessons = [];
    if (groupLevel) {
       allLessons = await prisma.lesson.findMany({
         where: { groupLevel: groupLevel },
         include: {
           tasks: {
             include: {
               videoTask: true,
               testTask: true,
               flashcardTask: true,
               speakingTask: true,
               readingTask: true,
               listeningTask: true,
               writingTask: true,
               grammarTest: true
             }
           }
         },
         orderBy: { order: 'asc' }
       });
    }

    // Assessments
    const assessments = await prisma.lessonAssessment.findMany({
      where: { studentId: studentId },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate XP
    const xpPoints = assessments.reduce((acc, curr) => acc + Math.round(curr.overallScore), 0);
    
    // Fake Streak (using number of unique days of assessments for now)
    const uniqueDays = new Set(assessments.map(a => new Date(a.createdAt).toDateString()));
    const streak = uniqueDays.size;

    // Find Current Lesson
    let currentLesson = null;
    for (const lesson of allLessons) {
      const isPassed = assessments.some(a => a.lessonId === lesson.id && a.status === "PASSED");
      if (!isPassed) {
        currentLesson = lesson;
        break;
      }
    }

    // Top Students
    let topStudents = [];
    let studentRank = 0;
    if (groupId) {
      const groupStudents = await prisma.user.findMany({
        where: { groupId: groupId, role: "STUDENT" },
        select: { id: true, fullName: true, username: true }
      });

      const studentScores = await Promise.all(groupStudents.map(async (s) => {
        const sAssessments = await prisma.lessonAssessment.findMany({
          where: { studentId: s.id }
        });
        const totalScore = sAssessments.reduce((acc, curr) => acc + curr.overallScore, 0);
        const avgScore = sAssessments.length > 0 ? totalScore / sAssessments.length : 0;
        return {
          id: s.id,
          name: s.fullName || s.username,
          score: Math.round(avgScore)
        };
      }));

      // Sort by score desc
      studentScores.sort((a, b) => b.score - a.score);
      topStudents = studentScores.slice(0, 5);
      
      const rankIndex = studentScores.findIndex(s => s.id === studentId);
      studentRank = rankIndex !== -1 ? rankIndex + 1 : 0;
    }

    // Formatting for frontend
    const videoLessons = [];
    const assignments = [];
    const backlog = [];
    const results = assessments.map(a => ({
      subject: student.group ? student.group.label : "General",
      assessment: `Lesson Assessment`,
      score: `${Math.round(a.overallScore)}/100`,
      feedback: a.status === "PASSED" ? "Well done!" : "Needs improvement",
      status: a.status
    }));

    allLessons.forEach(lesson => {
      const isFailed = assessments.some(a => a.lessonId === lesson.id && a.status === "FAILED");
      const isPassed = assessments.some(a => a.lessonId === lesson.id && a.status === "PASSED");
      
      if (isFailed && !isPassed) {
         backlog.push({
           title: lesson.title,
           detail: "Needs retry",
           type: "Assessment"
         });
      }

      lesson.tasks.forEach(task => {
        if (task.type === "VIDEO" && task.videoTask) {
          videoLessons.push({
            title: lesson.title,
            teacher: student.group && student.group.mentorId ? "Ustoz" : "Mentor",
            note: task.description || "Video dars",
            link: task.videoTask.videoUrl
          });
        } else {
          assignments.push({
            title: lesson.title + " - " + task.type,
            detail: task.description || "Yangi vazifa",
            deadline: "No strict deadline",
            type: task.type
          });
        }
      });
    });

    const pendingTasksCount = currentLesson ? currentLesson.tasks.length : 0;

    return res.status(200).json({
      success: true,
      data: {
        profile: {
          fullName: student.fullName || student.username,
          groupName: student.group ? student.group.title : "No Group",
          level: student.group ? student.group.level : "N/A",
          username: student.username
        },
        stats: {
          xp: xpPoints,
          streak: streak,
          attendanceRate: 100, // Mocked until Attendance model is available
          pendingTasks: pendingTasksCount,
          rank: studentRank
        },
        currentLesson: currentLesson ? {
          id: currentLesson.id,
          title: currentLesson.title,
          teacher: student.group && student.group.mentorId ? "Ustoz" : "Mentor",
          groupLabel: student.group ? student.group.label : "",
          taskCount: currentLesson.tasks.length
        } : null,
        topStudents,
        metrics: {
          videoCount: videoLessons.length,
          assignmentCount: assignments.length,
          backlogCount: backlog.length
        },
        videoLessons,
        assignments,
        backlog,
        results
      }
    });

  } catch (error) {
    console.error("Error fetching student dashboard:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

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

export async function updateStudent(req, res) {
  try {
    const student = await studentService.updateStudent(req.params.id, req.body);
    return res.json({ success: true, message: "Student updated successfully", student });
  } catch (error) {
    if (error.message === "Username already exists") {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Error updating student:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function deleteStudent(req, res) {
  try {
    await studentService.deleteStudent(req.params.id);
    return res.json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function getLeaderboardData(req, res) {
  try {
    const studentId = req.user.id;
    const { level, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let studentsQuery = { role: "STUDENT" };
    if (level && level !== "Umumiy") {
      const groupsWithLevel = await prisma.group.findMany({
        where: { level },
        select: { id: true }
      });
      const groupIds = groupsWithLevel.map(g => g.id);
      studentsQuery.groupId = { in: groupIds };
    }

    const students = await prisma.user.findMany({
      where: studentsQuery,
      select: { id: true, fullName: true, username: true }
    });

    const studentScores = await Promise.all(students.map(async (s) => {
      const assessments = await prisma.lessonAssessment.findMany({
        where: { studentId: s.id }
      });
      const totalScore = assessments.reduce((acc, curr) => acc + curr.overallScore, 0);
      const avgScore = assessments.length > 0 ? totalScore / assessments.length : 0;
      return {
        id: s.id,
        name: s.fullName || s.username,
        score: Math.round(avgScore)
      };
    }));

    studentScores.sort((a, b) => b.score - a.score);

    const total = studentScores.length;
    const paginatedStudents = studentScores.slice(skip, skip + parseInt(limit));

    const rankIndex = studentScores.findIndex(s => s.id === studentId);
    let currentUserData = null;
    if (rankIndex !== -1) {
      currentUserData = {
        ...studentScores[rankIndex],
        rank: rankIndex + 1
      };
    }

    const allGroups = await prisma.group.findMany({ select: { level: true } });
    const availableLevels = [...new Set(allGroups.map(g => g.level))].filter(Boolean).sort();

    return res.status(200).json({
      success: true,
      data: {
        leaderboard: paginatedStudents,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
        currentUser: currentUserData,
        availableLevels
      }
    });

  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
