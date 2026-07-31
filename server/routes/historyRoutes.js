const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const Attendance = require("../models/Attendance");
const Doubt = require("../models/Doubt");
const Result = require("../models/Result");
const Quiz = require("../models/Quiz");
const Timeline = require("../models/Timeline");
const { requireTeacherAuth } = require("../middleware/authMiddleware");

// Student Session History
router.get("/student/:registerNumber", async (req, res) => {
  try {
    const regNo = req.params.registerNumber.toUpperCase();

    // Find all attendance records for student
    const attendances = await Attendance.find({ registerNumber: regNo }).sort({ joinTime: -1 });

    const sessionCodes = [...new Set(attendances.map((a) => a.sessionCode))];
    const sessions = await Session.find({ sessionCode: { $in: sessionCodes } });
    const sessionMap = new Map(sessions.map((s) => [s.sessionCode, s]));

    const historyItems = await Promise.all(
      attendances.map(async (att) => {
        const session = sessionMap.get(att.sessionCode);

        // Fetch quiz result for this student in session
        const result = await Result.findOne({ sessionCode: att.sessionCode, registerNumber: regNo });

        // Calculate rank in quiz if result exists
        let rank = null;
        if (result) {
          const higherScores = await Result.countDocuments({
            sessionCode: att.sessionCode,
            score: { $gt: result.score },
          });
          rank = higherScores + 1;
        }

        // Fetch doubts asked by this student in session
        const studentDoubts = await Doubt.find({ sessionCode: att.sessionCode, registerNumber: regNo });

        return {
          id: att._id,
          sessionCode: att.sessionCode,
          sessionName: session ? session.sessionName : "Classroom Session",
          subject: session ? session.subject : "N/A",
          teacherName: session ? session.teacherName : "Instructor",
          createdAt: session ? session.createdAt : att.joinTime,
          duration: session ? session.duration : 60,
          attendanceDurationMinutes: att.totalDuration || (att.leaveTime ? Math.round((att.leaveTime - att.joinTime) / 60000) : 0),
          joinTime: att.joinTime,
          leaveTime: att.leaveTime,
          status: session ? (session.isActive ? "Active" : "Completed") : "Completed",
          quizScore: result ? result.score : null,
          totalQuestions: result ? result.totalQuestions : null,
          rank: rank,
          doubtsAsked: studentDoubts.length,
          doubts: studentDoubts,
        };
      })
    );

    res.status(200).json(historyItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher Session History (Recent, Archived, Completed)
router.get("/teacher", requireTeacherAuth, async (req, res) => {
  try {
    const sessions = await Session.find({ teacherId: req.teacher.id }).sort({ createdAt: -1 });

    const sessionAnalytics = await Promise.all(
      sessions.map(async (sess) => {
        const code = sess.sessionCode;
        const [attendances, doubts, results] = await Promise.all([
          Attendance.find({ sessionCode: code }),
          Doubt.find({ sessionCode: code }),
          Result.find({ sessionCode: code }),
        ]);

        const totalStudents = new Set([
          ...attendances.map((a) => a.registerNumber),
          ...doubts.map((d) => d.registerNumber).filter(Boolean),
          ...results.map((r) => r.registerNumber).filter(Boolean),
        ]).size;

        const quizAttempts = results.length;
        let avgScore = 0;
        let highestScore = 0;

        if (quizAttempts > 0) {
          const totalPct = results.reduce((acc, r) => {
            const pct = r.totalQuestions > 0 ? (r.score / r.totalQuestions) * 100 : r.score;
            return acc + pct;
          }, 0);
          avgScore = Number((totalPct / quizAttempts).toFixed(1));

          highestScore = Math.max(
            ...results.map((r) => (r.totalQuestions > 0 ? Math.round((r.score / r.totalQuestions) * 100) : r.score))
          );
        }

        const pendingDoubts = doubts.filter((d) => d.status === "Pending").length;
        const answeredDoubts = doubts.filter((d) => d.status === "Answered").length;

        return {
          session: sess,
          analytics: {
            studentsJoined: totalStudents,
            attendanceCount: attendances.length,
            quizAttempts,
            averageScore: avgScore,
            highestScore,
            pendingDoubts,
            answeredDoubts,
            totalDoubts: doubts.length,
            status: sess.isActive ? "Active" : "Completed",
          },
        };
      })
    );

    res.status(200).json(sessionAnalytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Full Session Detailed Report (Teacher View)
router.get("/session-details/:sessionCode", async (req, res) => {
  try {
    const sessionCode = req.params.sessionCode.toUpperCase();
    const session = await Session.findOne({ sessionCode });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const [attendances, doubts, results, timelineEvents, quiz] = await Promise.all([
      Attendance.find({ sessionCode }).sort({ joinTime: -1 }),
      Doubt.find({ sessionCode }).sort({ createdAt: -1 }),
      Result.find({ sessionCode }).sort({ score: -1 }),
      Timeline.find({ sessionCode }).sort({ timestamp: 1 }),
      Quiz.findOne({ sessionCode }),
    ]);

    res.status(200).json({
      session,
      attendances,
      doubts,
      results,
      timelineEvents,
      quiz,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
