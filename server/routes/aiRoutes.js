const express = require("express");
const router = express.Router();

const {
  generateAnswer,
  generateQuiz
} = require("../services/geminiService");

// Generate AI Answer
router.post("/generate-answer", async (req, res) => {
  try {

    const { question, subject } = req.body;

    if (!question) {
      return res.status(400).json({
        message: "Question is required"
      });
    }

    const answer = await generateAnswer(question, subject || "");

    res.json({
      success: true,
      answer
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
});

// Generate AI Quiz
router.post("/generate-quiz", async (req, res) => {
  try {

    const {
      topic,
      numberOfQuestions
    } = req.body;

    if (!topic) {
      return res.status(400).json({
        message: "Topic is required"
      });
    }

    const quiz = await generateQuiz(
      topic,
      numberOfQuestions || 5
    );

    res.json({
      success: true,
      quiz
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
});

module.exports = router;