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

    // Upsert quiz for this session so we don't create multiple conflicting duplicates
    const quiz = await Quiz.findOneAndUpdate(
      { sessionCode },
      {
        sessionCode,
        title,
        duration: Number(duration) || 5,
        questions,
        isActive: false,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    // Clean up any other duplicates for this session
    await Quiz.deleteMany({
      sessionCode,
      _id: { $ne: quiz._id },
    });

    res.status(201).json(quiz);

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

    // Find quiz (prioritize active quiz, then latest created)
    const quiz = await Quiz.findOne({
      sessionCode: req.params.sessionCode
    }).sort({ isActive: -1, createdAt: -1 });

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found"
      });
    }

    // Check if requester is the teacher of this session
    let isTeacher = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.id && session.teacherId && session.teacherId.toString() === decoded.id.toString()) {
          isTeacher = true;
        }
      } catch (e) {
        // Not a teacher token or token invalid; continue as student
      }
    }

    // Teachers can always view their session quiz even when not started
    if (isTeacher) {
      return res.json(quiz);
    }

    // Check if teacher started the quiz for students
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

const { logTimelineEvent, broadcastSessionUpdate } = require("../services/socketService");

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

    broadcastSessionUpdate(quiz.sessionCode);

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

    // Deactivate any other quizzes for the same session to avoid collisions
    await Quiz.updateMany(
      { sessionCode: quiz.sessionCode, _id: { $ne: req.params.id } },
      { isActive: false }
    );

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      {
        isActive: true
      },
      {
        returnDocument: "after"
      }
    );

    await logTimelineEvent({
      sessionCode: quiz.sessionCode,
      sessionId: session._id,
      eventType: "QUIZ_STARTED",
      title: "Quiz Started",
      description: `Quiz "${quiz.title}" published live (${quiz.questions.length} questions)`,
      metadata: { quizId: quiz._id, title: quiz.title },
    });

    broadcastSessionUpdate(quiz.sessionCode);

    res.json(updatedQuiz);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
});

module.exports = router;