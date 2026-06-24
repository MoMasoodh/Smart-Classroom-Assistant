const express = require("express");
const router = express.Router();
const Result = require("../models/Result");

// Submit Quiz Result
router.post("/", async (req, res) => {
  try {

    const {
      sessionCode,
      studentName,
      score,
      totalQuestions
    } = req.body;

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

// Get Leaderboard
router.get("/leaderboard/:sessionCode", async (req, res) => {
  try {

    const leaderboard = await Result.find({
      sessionCode: req.params.sessionCode
    }).sort({
      score: -1
    });

    res.json(leaderboard);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
});

module.exports = router;