const express = require("express");
const router = express.Router();

const { generateAnswer } = require("../services/geminiService");

// Generate AI Answer
router.post("/generate-answer", async (req, res) => {
  try {

    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        message: "Question is required"
      });
    }

    const answer = await generateAnswer(question);

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

module.exports = router;