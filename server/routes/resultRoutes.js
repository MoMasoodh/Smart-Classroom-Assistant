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
      totalQuestions
    } = req.body;

    if (!sessionCode || !studentName) {
      return res.status(400).json({
        message: "Missing required fields."
      });
    }

    // Check Session
    const session = await Session.findOne({
      sessionCode
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
      sessionCode
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

    // Already Submitted?
    const existingResult = registerNumber
      ? await Result.findOne({
          sessionCode,
          $or: [
            { registerNumber },
            { studentName }
          ]
        })
      : await Result.findOne({
          sessionCode,
          studentName
        });

    if (existingResult) {
      return res.status(400).json({
        message: "Quiz already submitted."
      });
    }

    const result = await Result.create({
      sessionCode,
      studentName,
      registerNumber,
      score,
      totalQuestions
    });

    const { logTimelineEvent, broadcastSessionUpdate } = require("../services/socketService");
    await logTimelineEvent({
      sessionCode,
      sessionId: session._id,
      eventType: "QUIZ_SUBMITTED",
      title: `${studentName} Submitted Quiz`,
      description: `Score: ${score} / ${totalQuestions}`,
      metadata: { studentName, registerNumber, score, totalQuestions },
    });

    broadcastSessionUpdate(sessionCode);

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

  console.log("Leaderboard Route Hit");

  try {

    const leaderboard = await Result.find({
      sessionCode: req.params.sessionCode
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

    const result = registerNumber
      ? await Result.findOne({
          sessionCode: req.params.sessionCode,
          registerNumber: String(registerNumber),
        })
      : await Result.findOne({
          sessionCode: req.params.sessionCode,
          studentName: req.params.studentName
        });

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