const express = require("express");
const router = express.Router();

const Result = require("../models/Result");
const Session = require("../models/Session");
const Quiz = require("../models/Quiz");

// ===========================================
// Submit Quiz Result
// ===========================================
router.post("/", async (req, res) => {
  try {

    const {
      sessionCode,
      studentName,
      registerNumber,
      score,
      totalQuestions,
      studentId
    } = req.body;

    if (!sessionCode || !studentName) {
      return res.status(400).json({
        message: "Missing required fields."
      });
    }

    const code = sessionCode.toUpperCase();

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
    let resolvedStudentId = studentId;
    if (!resolvedStudentId && registerNumber) {
      const sDoc = await Student.findOne({ registerNumber: registerNumber.toUpperCase() });
      if (sDoc) resolvedStudentId = sDoc._id;
    }

    // Already Submitted?
    const query = { sessionCode: code };
    if (resolvedStudentId) {
      query.studentId = resolvedStudentId;
    } else if (registerNumber) {
      query.$or = [{ registerNumber: registerNumber.toUpperCase() }, { studentName }];
    } else {
      query.studentName = studentName;
    }

    const existingResult = await Result.findOne(query);

    if (existingResult) {
      return res.status(400).json({
        message: "Quiz already submitted."
      });
    }

    const result = await Result.create({
      studentId: resolvedStudentId,
      sessionCode: code,
      studentName,
      registerNumber: registerNumber ? registerNumber.toUpperCase() : "",
      score,
      totalQuestions
    });

    const { logTimelineEvent, broadcastSessionUpdate } = require("../services/socketService");
    await logTimelineEvent({
      sessionCode: code,
      sessionId: session._id,
      eventType: "QUIZ_SUBMITTED",
      title: `${studentName} Submitted Quiz`,
      description: `Score: ${score} / ${totalQuestions}`,
      metadata: { studentName, registerNumber, score, totalQuestions },
    });

    broadcastSessionUpdate(code);

    res.status(201).json({
      message: "Quiz submitted successfully.",
      result
    });

  } catch (error) {

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
router.get("/check/:sessionCode/:studentName", async (req, res) => {

  try {

    const { registerNumber } = req.query;
    const code = req.params.sessionCode.toUpperCase();
    const regNo = registerNumber ? String(registerNumber).toUpperCase() : "";

    const query = { sessionCode: code };
    if (regNo) {
      query.$or = [{ registerNumber: regNo }, { studentName: req.params.studentName }];
    } else {
      query.studentName = req.params.studentName;
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

module.exports = router;