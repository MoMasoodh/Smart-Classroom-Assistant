const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz");
const Session = require("../models/Session");
const { requireTeacherAuth } = require("../middleware/authMiddleware");

router.post("/", requireTeacherAuth, async (req, res) => {
  try {

    const {
      sessionCode,
      title,
      duration,
      questions
    } = req.body;

    const session = await Session.findOne({
      sessionCode,
      teacherId: req.teacher.id,
    });

    if (!session) {
      return res.status(404).json({
        message: "Session not found"
      });
    }

    if (!session.isActive) {
      return res.status(400).json({
        message: "Session is closed"
      });
    }

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

// Get Quiz for a Session
router.get("/session/:sessionCode", async (req, res) => {
  try {

    // Check if session exists
    const session = await Session.findOne({
      sessionCode: req.params.sessionCode
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

    // Find quiz
    const quiz = await Quiz.findOne({
      sessionCode: req.params.sessionCode
    });

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found"
      });
    }

    // Check if teacher started the quiz
    if (!quiz.isActive) {
      return res.status(400).json({
        message: "Quiz has not started yet"
      });
    }

    res.json(quiz);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
});

router.put("/:id/stop", requireTeacherAuth, async (req, res) => {
  try {

    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found"
      });
    }

    const session = await Session.findOne({
      sessionCode: quiz.sessionCode,
      teacherId: req.teacher.id,
    });

    if (!session) {
      return res.status(404).json({
        message: "Session not found"
      });
    }

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      {
        isActive: false
      },
      {
        returnDocument: "after"
      }
    );

    res.json(updatedQuiz);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
});

router.put("/:id/start", requireTeacherAuth, async (req, res) => {
  try {

    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found"
      });
    }

    const session = await Session.findOne({
      sessionCode: quiz.sessionCode,
      teacherId: req.teacher.id,
    });

    if (!session) {
      return res.status(404).json({
        message: "Session not found"
      });
    }

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      {
        isActive: true
      },
      {
        returnDocument: "after"
      }
    );

    res.json(updatedQuiz);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
});

module.exports = router;