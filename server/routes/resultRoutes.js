const express = require("express");
const router = express.Router();

const Result = require("../models/Result");
const Session = require("../models/Session");
const Quiz = require("../models/Quiz");
const { requireStudentAuth } = require("../middleware/authMiddleware");

// ===========================================
// Submit Quiz Result
// ===========================================
router.post("/", requireStudentAuth, async (req, res) => {
  try {

    const {
      sessionCode,
      studentName,
      registerNumber,
      score,
      totalQuestions,
      studentId,
      answers,
    } = req.body;

    if (!sessionCode || !studentName) {
      return res.status(400).json({
        message: "Missing required fields."
      });
    }

    const code = sessionCode.toUpperCase();
    const authenticatedStudentId = req.student?.id;
    const authenticatedRegNo = req.student?.registerNumber?.toUpperCase();

    if (studentId && authenticatedStudentId && String(studentId) !== String(authenticatedStudentId)) {
      return res.status(403).json({ message: "Forbidden - Cannot submit quiz for another student." });
    }

    if (registerNumber && authenticatedRegNo && registerNumber.toUpperCase() !== authenticatedRegNo) {
      return res.status(403).json({ message: "Forbidden - Cannot submit quiz for another student." });
    }

    // Check Session
    const session = await Session.findOne({
      sessionCode: code
    });

    if (!session) {
      return res.status(404).json({
        message: "Session not found."
      });
    }

    if (!session.isActive) {
      return res.status(400).json({
        message: "Session is closed."
      });
    }

    if (new Date() > session.expiresAt) {
      session.isActive = false;
      await session.save();

      return res.status(400).json({
        message: "Session has expired."
      });
    }

    // Check Quiz
    const quiz = await Quiz.findOne({
      sessionCode: code
    });

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found."
      });
    }

    if (!quiz.isActive) {
      return res.status(400).json({
        message: "Quiz is not active."
      });
    }

    const Student = require("../models/Student");
    let resolvedStudentId = studentId || authenticatedStudentId;
    if (!resolvedStudentId && registerNumber) {
      const sDoc = await Student.findOne({ registerNumber: registerNumber.toUpperCase() });
      if (sDoc) resolvedStudentId = sDoc._id;
    }

    if (!resolvedStudentId && authenticatedStudentId) {
      resolvedStudentId = authenticatedStudentId;
    }

    const normalizedRegNo = (registerNumber || authenticatedRegNo || "").toUpperCase();
    const finalStudentName = studentName || req.student.fullName;

    const query = { sessionCode: code };
    if (resolvedStudentId) {
      query.studentId = resolvedStudentId;
    } else if (normalizedRegNo) {
      query.registerNumber = normalizedRegNo;
    } else {
      query.studentName = finalStudentName;
    }

    const existingResult = await Result.findOne(query);

    if (existingResult) {
      return res.status(409).json({
        message: "Quiz already submitted."
      });
    }

    const result = await Result.create({
      studentId: resolvedStudentId,
      sessionCode: code,
      studentName: finalStudentName,
      registerNumber: normalizedRegNo,
      score,
      totalQuestions,
      answers: Array.isArray(answers) ? answers : [],
    });

    const { logTimelineEvent, broadcastSessionUpdate } = require("../services/socketService");
    await logTimelineEvent({
      sessionCode: code,
      sessionId: session._id,
      eventType: "QUIZ_SUBMITTED",
      title: `${finalStudentName} Submitted Quiz`,
      description: `Score: ${score} / ${totalQuestions}`,
      metadata: { studentName: finalStudentName, registerNumber: normalizedRegNo, score, totalQuestions },
    });

    broadcastSessionUpdate(code);

    res.status(201).json({
      message: "Quiz submitted successfully.",
      result
    });

  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ message: "Quiz already submitted." });
    }

    res.status(500).json({
      message: error.message
    });

  }
});


// ===========================================
// Leaderboard
// ===========================================
router.get("/leaderboard/:sessionCode", async (req, res) => {
  try {
    const leaderboard = await Result.find({
      sessionCode: req.params.sessionCode.toUpperCase()
    }).sort({
      score: -1,
      submittedAt: 1
    });

    res.json(leaderboard);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

});



// ===========================================
// Check Student Result
// Used to prevent multiple quiz attempts
// ===========================================
router.get("/check/:sessionCode/:studentName", requireStudentAuth, async (req, res) => {

  try {

    const { registerNumber } = req.query;
    const code = req.params.sessionCode.toUpperCase();
    const regNo = (registerNumber || req.student?.registerNumber || "").toUpperCase();
    const studentName = req.params.studentName || req.student?.fullName;

    if (!studentName) {
      return res.status(400).json({ message: "Student identifier required." });
    }

    const query = { sessionCode: code };
    if (req.student?.id) {
      query.studentId = req.student.id;
    } else if (regNo) {
      query.registerNumber = regNo;
    } else {
      query.studentName = studentName;
    }

    const result = await Result.findOne(query);

    if (!result) {
      return res.json({
        alreadySubmitted: false
      });
    }

    res.json({
      alreadySubmitted: true,
      result
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

});

// ===========================================
// Quiz Revision Details for Student
// ===========================================
router.get("/revision/:sessionCode", requireStudentAuth, async (req, res) => {
  try {
    const code = req.params.sessionCode.toUpperCase();
    const regNo = (req.query.registerNumber || req.student?.registerNumber || "").toUpperCase();
    const studentId = req.student?.id;

    const [quiz, result] = await Promise.all([
      Quiz.findOne({ sessionCode: code }),
      Result.findOne({
        sessionCode: code,
        $or: [{ studentId }, { registerNumber: regNo }].filter(Boolean),
      }),
    ]);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz data not found for this session." });
    }

    res.json({
      quizTitle: quiz.title || `${code} Quiz`,
      sessionCode: code,
      quiz,
      result: result || null,
      submitted: Boolean(result),
      score: result ? result.score : 0,
      totalQuestions: result ? result.totalQuestions : (quiz.questions?.length || 0),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;