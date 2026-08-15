const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Session = require("../models/Session");
const Attendance = require("../models/Attendance");
const Doubt = require("../models/Doubt");
const Result = require("../models/Result");
const Quiz = require("../models/Quiz");
const { requireStudentAuth, requireTeacherAuth, requireAuth } = require("../middleware/authMiddleware");

// Helper function to build student profile analytics
async function getStudentProfileData(regNo) {
  const student = await Student.findOne({ registerNumber: regNo }).select("-password");
  if (!student) return null;

  const [attendances, doubts, results] = await Promise.all([
    Attendance.find({ registerNumber: regNo }),
    Doubt.find({ registerNumber: regNo }),
    Result.find({ registerNumber: regNo }),
  ]);

  const uniqueSessionCodes = [...new Set(attendances.map((a) => a.sessionCode))];
  const sessionsAttended = uniqueSessionCodes.length;
  const totalDoubts = doubts.length;
  const quizAttempts = results.length;

  let avgQuizScore = 0;
  let highestQuizScore = 0;

  if (quizAttempts > 0) {
    const totalPctSum = results.reduce((acc, r) => {
      const pct = r.totalQuestions > 0 ? (r.score / r.totalQuestions) * 100 : r.score;
      return acc + pct;
    }, 0);
    avgQuizScore = Number((totalPctSum / quizAttempts).toFixed(1));
    highestQuizScore = Math.max(
      ...results.map((r) => (r.totalQuestions > 0 ? Math.round((r.score / r.totalQuestions) * 100) : r.score))
    );
  }

  const totalAttendanceMinutes = attendances.reduce((sum, a) => sum + (a.totalDuration || 0), 0);
  const attendancePercentage = sessionsAttended > 0 ? Math.min(100, Math.round((totalAttendanceMinutes / (sessionsAttended * 60)) * 100)) : 100;

  const achievements = [];
  if (sessionsAttended >= 1) achievements.push({ title: "First Session", description: "Attended your first classroom session" });
  if (sessionsAttended >= 5) achievements.push({ title: "Regular Attendee", description: "Attended 5+ classroom sessions" });
  if (totalDoubts >= 3) achievements.push({ title: "Curious Mind", description: "Asked 3+ classroom doubts" });
  if (highestQuizScore >= 90) achievements.push({ title: "Quiz Ace", description: "Scored 90%+ in a classroom quiz" });

  return {
    student,
    analytics: {
      sessionsAttended,
      totalDoubts,
      quizAttempts,
      avgQuizScore,
      highestQuizScore,
      totalAttendanceMinutes,
      attendancePercentage,
      achievements,
    },
  };
}

// Student Profile Analytics (Authenticated Token)
router.get("/student", requireStudentAuth, async (req, res) => {
  try {
    const regNo = req.student.registerNumber.toUpperCase();
    const data = await getStudentProfileData(regNo);
    if (!data) {
      return res.status(404).json({ message: "Student profile not found" });
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Student Profile Analytics by RegNo
router.get("/student/:registerNumber", requireAuth, async (req, res) => {
  try {
    const regNo = req.params.registerNumber.toUpperCase();
    if (req.student && req.student.registerNumber.toUpperCase() !== regNo) {
      return res.status(403).json({ message: "Forbidden - Access denied" });
    }
    const data = await getStudentProfileData(regNo);
    if (!data) {
      return res.status(404).json({ message: "Student profile not found" });
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher Profile Analytics
router.get("/teacher", requireTeacherAuth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacher.id).select("-password");
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const sessions = await Session.find({ teacherId: teacher._id });
    const sessionCodes = sessions.map((s) => s.sessionCode);

    const [attendances, doubts, quizzes, results] = await Promise.all([
      Attendance.find({ sessionCode: { $in: sessionCodes } }),
      Doubt.find({ sessionCode: { $in: sessionCodes } }),
      Quiz.find({ sessionCode: { $in: sessionCodes } }),
      Result.find({ sessionCode: { $in: sessionCodes } }),
    ]);

    const sessionsCreated = sessions.length;
    const totalStudentsTaught = new Set(attendances.map((a) => a.registerNumber)).size;
    const doubtsAnswered = doubts.filter((d) => d.status === "Answered").length;
    const aiAnswersGenerated = doubts.filter((d) => d.teacherName === "AI Assistant").length;
    const quizzesCreated = quizzes.length;

    let avgClassScore = 0;
    if (results.length > 0) {
      const totalPctSum = results.reduce((acc, r) => {
        const pct = r.totalQuestions > 0 ? (r.score / r.totalQuestions) * 100 : r.score;
        return acc + pct;
      }, 0);
      avgClassScore = Number((totalPctSum / results.length).toFixed(1));
    }

    res.status(200).json({
      teacher,
      analytics: {
        sessionsCreated,
        totalStudentsTaught,
        totalDoubts: doubts.length,
        doubtsAnswered,
        aiAnswersGenerated,
        quizzesCreated,
        avgClassScore,
        totalAttendanceRecords: attendances.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/teacher/:teacherId", requireAuth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.teacherId).select("-password");

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const sessions = await Session.find({ teacherId: teacher._id });
    const sessionCodes = sessions.map((s) => s.sessionCode);

    const [attendances, doubts, quizzes, results] = await Promise.all([
      Attendance.find({ sessionCode: { $in: sessionCodes } }),
      Doubt.find({ sessionCode: { $in: sessionCodes } }),
      Quiz.find({ sessionCode: { $in: sessionCodes } }),
      Result.find({ sessionCode: { $in: sessionCodes } }),
    ]);

    const sessionsCreated = sessions.length;
    const totalStudentsTaught = new Set(attendances.map((a) => a.registerNumber)).size;
    const doubtsAnswered = doubts.filter((d) => d.status === "Answered").length;
    const aiAnswersGenerated = doubts.filter((d) => d.teacherName === "AI Assistant").length;
    const quizzesCreated = quizzes.length;

    let avgClassScore = 0;
    if (results.length > 0) {
      const totalPctSum = results.reduce((acc, r) => {
        const pct = r.totalQuestions > 0 ? (r.score / r.totalQuestions) * 100 : r.score;
        return acc + pct;
      }, 0);
      avgClassScore = Number((totalPctSum / results.length).toFixed(1));
    }

    res.status(200).json({
      teacher,
      analytics: {
        sessionsCreated,
        totalStudentsTaught,
        totalDoubts: doubts.length,
        doubtsAnswered,
        aiAnswersGenerated,
        quizzesCreated,
        avgClassScore,
        totalAttendanceRecords: attendances.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
