const express = require("express");
const router = express.Router();
const Doubt = require("../models/Doubt");
const Session = require("../models/Session");
const { requireTeacherAuth } = require("../middleware/authMiddleware");

const { logTimelineEvent, broadcastSessionUpdate } = require("../services/socketService");

async function getOwnedSession(sessionCode, teacherId) {
  return Session.findOne({ sessionCode, teacherId });
}

// Get Answered Doubts
router.get("/session/:sessionCode/answered", async (req, res) => {
  try {
    const doubts = await Doubt.find({
      sessionCode: req.params.sessionCode,
      status: "Answered",
    }).sort({ answeredAt: -1, createdAt: -1 });

    res.status(200).json(doubts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Pending Doubts
router.get("/session/:sessionCode/pending", requireTeacherAuth, async (req, res) => {
  try {
    const session = await getOwnedSession(req.params.sessionCode, req.teacher.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const doubts = await Doubt.find({
      sessionCode: req.params.sessionCode,
      status: "Pending",
    }).sort({ createdAt: -1 });

    res.status(200).json(doubts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get All Session Doubts (Teacher only)
router.get("/session/:sessionCode", requireTeacherAuth, async (req, res) => {
  try {
    const session = await getOwnedSession(req.params.sessionCode, req.teacher.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const doubts = await Doubt.find({
      sessionCode: req.params.sessionCode,
    }).sort({ createdAt: -1 });

    res.status(200).json(doubts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Student's Own Doubts for a Session
router.get("/session/:sessionCode/my-doubts", async (req, res) => {
  try {
    const { registerNumber, studentName } = req.query;

    if (!registerNumber && !studentName) {
      return res.status(404).json({ message: "Student identifier required" });
    }

    const query = { sessionCode: req.params.sessionCode };

    if (registerNumber) {
      query.$or = [
        { registerNumber: String(registerNumber).toUpperCase() },
        { studentName: String(studentName || "") }
      ];
    } else {
      query.studentName = String(studentName);
    }

    const doubts = await Doubt.find(query).sort({ createdAt: -1 });
    res.status(200).json(doubts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create Doubt
router.post("/", async (req, res) => {
  try {
    const { studentName, registerNumber, sessionCode, subject, question } = req.body;

    if (!studentName || !sessionCode || !subject || !question) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const session = await Session.findOne({ sessionCode: sessionCode.toUpperCase() });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (!session.isActive) {
      return res.status(400).json({ message: "Session is closed" });
    }

    if (new Date() > session.expiresAt) {
      session.isActive = false;
      session.closedAt = new Date();
      await session.save();

      return res.status(400).json({ message: "Session has expired" });
    }

    const doubt = new Doubt({
      studentName,
      registerNumber,
      sessionCode: sessionCode.toUpperCase(),
      subject,
      question,
    });

    const savedDoubt = await doubt.save();

    await logTimelineEvent({
      sessionCode: sessionCode.toUpperCase(),
      sessionId: session._id,
      eventType: "DOUBT_ASKED",
      title: `${studentName} Asked a Doubt`,
      description: question.length > 60 ? `${question.substring(0, 60)}...` : question,
      metadata: { doubtId: savedDoubt._id, registerNumber, studentName },
    });

    broadcastSessionUpdate(sessionCode);

    res.status(201).json(savedDoubt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Answer Doubt
router.put("/:id", requireTeacherAuth, async (req, res) => {
  try {
    if (!req.body.answer || !req.body.answer.trim()) {
      return res.status(400).json({ message: "Answer is required" });
    }

    const existingDoubt = await Doubt.findById(req.params.id);

    if (!existingDoubt) {
      return res.status(404).json({ message: "Doubt not found" });
    }

    const session = await Session.findOne({
      sessionCode: existingDoubt.sessionCode,
      teacherId: req.teacher.id,
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const teacherName = req.body.teacherName || req.teacher.fullName;

    const doubt = await Doubt.findByIdAndUpdate(
      req.params.id,
      {
        answer: req.body.answer.trim(),
        status: "Answered",
        answeredAt: new Date(),
        teacherId: req.teacher.id,
        teacherName,
      },
      { new: true }
    );

    await logTimelineEvent({
      sessionCode: existingDoubt.sessionCode,
      sessionId: session._id,
      eventType: "DOUBT_ANSWERED",
      title: `${teacherName} Answered Doubt`,
      description: `Answered question for ${existingDoubt.studentName}`,
      metadata: { doubtId: doubt._id, studentName: existingDoubt.studentName, teacherName },
    });

    broadcastSessionUpdate(existingDoubt.sessionCode);

    res.status(200).json(doubt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Doubt
router.delete("/:id", requireTeacherAuth, async (req, res) => {
  try {
    await Doubt.findByIdAndDelete(req.params.id);

    res.json({
      message: "Doubt deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;