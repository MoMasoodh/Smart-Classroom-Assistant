const express = require("express");
const router = express.Router();
const Result = require("../models/Result");
const Session = require("../models/Session");
const Quiz = require("../models/Quiz");

// ===============================
// Submit Quiz Result
// ===============================
router.post("/", async (req, res) => {
  try {

    const {
      sessionCode,
      studentName,
      score,
      totalQuestions
    } = req.body;
    // Check if session exists
const session = await Session.findOne({
  sessionCode
});

if (!session) {
  return res.status(404).json({
    message: "Session not found"
  });
}

// Check if session is active
if (!session.isActive) {
  return res.status(400).json({
    message: "Session is closed"
  });
}

// Check if session has expired
if (new Date() > session.expiresAt) {

  session.isActive = false;
  await session.save();

  return res.status(400).json({
    message: "Session has expired"
  });
}
// Check if quiz exists
const quiz = await Quiz.findOne({
  sessionCode
});

if (!quiz) {
  return res.status(404).json({
    message: "Quiz not found"
  });
}

// Check if quiz is active
if (!quiz.isActive) {
  return res.status(400).json({
    message: "Quiz is not active"
  });
}

    // Check if the student has already submitted
    const existingResult = await Result.findOne({
      sessionCode,
      studentName
    });

    if (existingResult) {
      return res.status(400).json({
        message: "Quiz already submitted."
      });
    }

    // Create new result
    const result = new Result({
      sessionCode,
      studentName,
      score,
      totalQuestions
    });

    const savedResult = await result.save();

    res.status(201).json(savedResult);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
});

// ===============================
// Get Leaderboard
// ===============================
router.get("/leaderboard/:sessionCode", async (req, res) => {
  try {

    const leaderboard = await Result.find({
      sessionCode: req.params.sessionCode
    })
    .sort({ score: -1 });

    res.json(leaderboard);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
});

module.exports = router;