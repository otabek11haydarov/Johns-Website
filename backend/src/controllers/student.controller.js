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

export async function getStudentStats(req, res) {
  try {
    const studentId = req.user.id;
    
    // Fetch all assessments
    const assessments = await prisma.lessonAssessment.findMany({
      where: { studentId: studentId },
      orderBy: { createdAt: 'asc' }
    });

    // XP calculation and mapping
    let totalXP = 0;
    const xpByDate = {}; // 'YYYY-MM-DD' -> XP
    const activityDates = new Set();
    
    assessments.forEach(a => {
      const xp = Math.round(a.overallScore);
      totalXP += xp;
      
      const dateStr = new Date(a.createdAt).toISOString().split('T')[0];
      activityDates.add(dateStr);
      
      if (!xpByDate[dateStr]) xpByDate[dateStr] = 0;
      xpByDate[dateStr] += xp;
    });

    // Calculate Streak (Consecutive days backwards from today or yesterday)
    let currentStreak = 0;
    let longestStreak = 0;
    
    const sortedDates = Array.from(activityDates).sort();
    
    // Simple longest streak calc
    let tempStreak = 0;
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const d1 = new Date(sortedDates[i-1]);
        const d2 = new Date(sortedDates[i]);
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    }
    
    // Current streak
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
    
    if (activityDates.has(todayStr)) {
       let streak = 1;
       let checkDate = new Date();
       while (true) {
         checkDate.setDate(checkDate.getDate() - 1);
         const cStr = checkDate.toISOString().split('T')[0];
         if (activityDates.has(cStr)) streak++;
         else break;
       }
       currentStreak = streak;
    } else if (activityDates.has(yesterdayStr)) {
       let streak = 1;
       let checkDate = new Date(yesterdayDate);
       while (true) {
         checkDate.setDate(checkDate.getDate() - 1);
         const cStr = checkDate.toISOString().split('T')[0];
         if (activityDates.has(cStr)) streak++;
         else break;
       }
       currentStreak = streak;
    } else {
       currentStreak = 0;
    }

    // Video/Learning Time
    const videoAssessments = await prisma.videoAssessment.findMany({
      where: { studentId: studentId }
    });
    let totalSeconds = videoAssessments.reduce((acc, curr) => acc + (curr.watchedSeconds || 0), 0);
    
    // Add estimated time for general tasks (e.g. 15 mins per assessment if no video)
    totalSeconds += assessments.length * 900; 

    // Generate Calendar Array (Last 365 Days)
    const calendar = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 364);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
       const dStr = d.toISOString().split('T')[0];
       const xp = xpByDate[dStr] || 0;
       let level = 0;
       if (xp > 0) level = 1;
       if (xp > 50) level = 2;
       if (xp > 100) level = 3;
       
       calendar.push({
         date: dStr,
         level: level,
         xp: xp
       });
    }

    // Generate XP History for chart (Last 30 days)
    const xpHistory = [];
    const chartStart = new Date();
    chartStart.setDate(chartStart.getDate() - 29);
    for (let d = new Date(chartStart); d <= endDate; d.setDate(d.getDate() + 1)) {
       const dStr = d.toISOString().split('T')[0];
       const xp = xpByDate[dStr] || 0;
       xpHistory.push({
         date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
         xp: xp
       });
    }

    return res.status(200).json({
      success: true,
      data: {
        totalXP,
        totalLearningTime: {
          hours: Math.floor(totalSeconds / 3600),
          minutes: Math.floor((totalSeconds % 3600) / 60)
        },
        currentStreak,
        longestStreak,
        calendar,
        xpHistory
      }
    });

  } catch (error) {
    console.error("Error fetching stats:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
