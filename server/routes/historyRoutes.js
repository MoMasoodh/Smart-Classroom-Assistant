const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const Attendance = require("../models/Attendance");
const Doubt = require("../models/Doubt");
const Result = require("../models/Result");
const Quiz = require("../models/Quiz");
const Timeline = require("../models/Timeline");
const { requireTeacherAuth, requireStudentAuth, requireAuth } = require("../middleware/authMiddleware");

// Helper function to build student session history items
async function buildStudentHistory(regNo, limit = 0) {
  // Find all attendance records for student
  const attendances = await Attendance.find({ registerNumber: regNo }).sort({ joinTime: -1 });

  // De-duplicate sessionCodes to ensure a session appears ONLY ONCE
  const sessionCodes = [...new Set(attendances.map((a) => a.sessionCode))];
  const sessions = await Session.find({ sessionCode: { $in: sessionCodes } }).sort({ createdAt: -1 });

  // Map attendances by sessionCode for aggregation
  const attendanceMap = new Map();
  attendances.forEach((att) => {
    if (!attendanceMap.has(att.sessionCode)) {
      attendanceMap.set(att.sessionCode, []);
    }
    attendanceMap.get(att.sessionCode).push(att);
  });

  const sessionList = limit > 0 ? sessions.slice(0, Number(limit)) : sessions;

  const historyItems = await Promise.all(
    sessionList.map(async (session) => {
      const attList = attendanceMap.get(session.sessionCode) || [];
      const earliestJoin = attList.reduce((min, a) => (!min || a.joinTime < min ? a.joinTime : min), null);
      const latestLeave = attList.reduce((max, a) => (!max || (a.leaveTime && a.leaveTime > max) ? a.leaveTime : max), null);

      // Sum duration across reconnects or calculate duration from join/leave
      let totalAttendanceDuration = attList.reduce((sum, a) => {
        if (a.totalDuration && a.totalDuration > 0) return sum + a.totalDuration;
        if (a.joinTime && a.leaveTime) return sum + Math.round((a.leaveTime - a.joinTime) / 60000);
        return sum;
      }, 0);

      if (totalAttendanceDuration === 0 && earliestJoin) {
        const endTime = latestLeave || new Date();
        totalAttendanceDuration = Math.max(1, Math.round((endTime - earliestJoin) / 60000));
      }

      const sessionDurationMinutes = session.duration || 60;
      const attendancePercentage = Math.min(
        100,
        Math.round((totalAttendanceDuration / sessionDurationMinutes) * 100)
      );

      // Fetch quiz result for this student in session
      const result = await Result.findOne({ sessionCode: session.sessionCode, registerNumber: regNo });

      // Calculate rank in quiz if result exists
      let rank = null;
      if (result) {
        const higherScores = await Result.countDocuments({
          sessionCode: session.sessionCode,
          score: { $gt: result.score },
        });
        rank = higherScores + 1;
      }

      // Fetch doubts asked by this student in session
      const studentDoubts = await Doubt.find({ sessionCode: session.sessionCode, registerNumber: regNo }).sort({ createdAt: -1 });

      const answeredCount = studentDoubts.filter((d) => d.status === "Answered").length;
      const pendingCount = studentDoubts.filter((d) => d.status === "Pending").length;

      return {
        id: session._id,
        sessionCode: session.sessionCode,
        sessionName: session.sessionName,
        subject: session.subject,
        teacherName: session.teacherName,
        createdAt: session.createdAt,
        duration: sessionDurationMinutes,
        attendanceDurationMinutes: totalAttendanceDuration,
        attendancePercentage,
        joinTime: earliestJoin,
        leaveTime: latestLeave,
        status: session.isActive ? "Active" : "Completed",
        quizScore: result ? result.score : null,
        totalQuestions: result ? result.totalQuestions : null,
        quizPercentage: result && result.totalQuestions > 0 ? Math.round((result.score / result.totalQuestions) * 100) : null,
        rank: rank,
        doubtsAsked: studentDoubts.length,
        answeredDoubts: answeredCount,
        pendingDoubts: pendingCount,
        doubts: studentDoubts,
      };
    })
  );

  return historyItems;
}

// Student Session History (Authenticated JWT identity)
router.get("/student", requireStudentAuth, async (req, res) => {
  try {
    const regNo = req.student.registerNumber.toUpperCase();
    const limit = req.query.limit ? Number(req.query.limit) : 0;
    const historyItems = await buildStudentHistory(regNo, limit);
    res.status(200).json(historyItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Student Session History with Param (Requires Auth, matches JWT registerNumber)
router.get("/student/:registerNumber", requireAuth, async (req, res) => {
  try {
    const requestedRegNo = req.params.registerNumber.toUpperCase();

    // Security: Student can only view their own history unless user is a teacher
    if (req.student && req.student.registerNumber.toUpperCase() !== requestedRegNo) {
      return res.status(403).json({ message: "Forbidden - Cannot access another student's history" });
    }

    const limit = req.query.limit ? Number(req.query.limit) : 0;
    const historyItems = await buildStudentHistory(requestedRegNo, limit);
    res.status(200).json(historyItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher Session History (Recent, Archived, Completed)
router.get("/teacher", requireTeacherAuth, async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 0;
    let query = Session.find({ teacherId: req.teacher.id }).sort({ createdAt: -1 });
    if (limit > 0) {
      query = query.limit(limit);
    }
    const sessions = await query;

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

        const attendancePercentage = totalStudents > 0
          ? Math.min(100, Math.round((attendances.length / Math.max(totalStudents, 1)) * 100))
          : 100;

        const pendingDoubts = doubts.filter((d) => d.status === "Pending").length;
        const answeredDoubts = doubts.filter((d) => d.status === "Answered").length;

        return {
          session: sess,
          analytics: {
            studentsJoined: totalStudents,
            attendanceCount: attendances.length,
            attendancePercentage,
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
router.get("/session-details/:sessionCode", requireAuth, async (req, res) => {
  try {
    const sessionCode = req.params.sessionCode.toUpperCase();
    const session = await Session.findOne({ sessionCode });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const isTeacher = Boolean(req.teacher);
    const studentRegNo = req.student ? req.student.registerNumber.toUpperCase() : null;

    const [attendances, doubts, results, timelineEvents, quiz] = await Promise.all([
      Attendance.find({ sessionCode }).sort({ joinTime: -1 }),
      Doubt.find({ sessionCode }).sort({ createdAt: -1 }),
      Result.find({ sessionCode }).sort({ score: -1 }),
      Timeline.find({ sessionCode }).sort({ timestamp: 1 }),
      Quiz.findOne({ sessionCode }),
    ]);

    // If student view, sanitize/privacy-protect classmates' private info
    let formattedDoubts = doubts;
    if (!isTeacher) {
      formattedDoubts = doubts.map((d) => {
        const obj = d.toObject();
        if (studentRegNo && obj.registerNumber?.toUpperCase() === studentRegNo) {
          // Student's own doubt: keep identity
          return obj;
        }
        // Classmate's doubt: mask identity
        return {
          ...obj,
          studentName: "Anonymous Student",
          registerNumber: "",
        };
      });
    }

    res.status(200).json({
      session,
      attendances: isTeacher ? attendances : attendances.map((a) => ({ ...a.toObject(), registerNumber: "" })),
      doubts: formattedDoubts,
      results: isTeacher ? results : results.map((r) => ({ ...r.toObject(), registerNumber: "" })),
      timelineEvents,
      quiz,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
