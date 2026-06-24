const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz");

router.post("/", async (req, res) => {
  try {

    const {
      sessionCode,
      title,
      duration,
      questions
    } = req.body;

    const quiz = new Quiz({
      sessionCode,
      title,
      duration,
      questions
    });

    const savedQuiz = await quiz.save();

    res.status(201).json(savedQuiz);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
});

router.get("/session/:sessionCode", async (req, res) => {
  try {

    const quiz = await Quiz.findOne({
      sessionCode: req.params.sessionCode
    });

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found"
      });
    }

    res.json(quiz);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
});

router.put("/:id/stop", async (req, res) => {
  try {

    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      {
        isActive: false
      },
      {
        returnDocument: "after"
      }
    );

    res.json(quiz);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
});

router.put("/:id/start", async (req, res) => {
  try {

    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      {
        isActive: true
      },
      {
        returnDocument: "after"
      }
    );

    res.json(quiz);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
});

module.exports = router;