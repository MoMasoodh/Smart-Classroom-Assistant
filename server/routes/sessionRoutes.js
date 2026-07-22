const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const QRCode = require("qrcode");
const Doubt = require("../models/Doubt");
const Result = require("../models/Result");
const Quiz = require("../models/Quiz");
const { requireTeacherAuth } = require("../middleware/authMiddleware");

function generateSessionCode(subject) {
  const prefix = subject.substring(0, 4).toUpperCase();
  const randomNum = Math.floor(100 + Math.random() * 900);

  return prefix + randomNum;
}

router.post("/", requireTeacherAuth, async (req, res) => {
  try {
    const { sessionName, subject, duration } = req.body;

    if (!sessionName || !subject || !duration) {
      return res.status(400).json({
        message: "Session name, subject, and duration are required",
      });
    }

    const sessionCode = generateSessionCode(subject);
    const joinUrl = `http://localhost:3000/join/${sessionCode}`;

    const qrCode = await QRCode.toDataURL(joinUrl);

    const expiresAt = new Date(
      Date.now() + duration * 60 * 1000
    );

    const session = new Session({
      teacherId: req.teacher.id,
      teacherName: req.teacher.fullName,
      sessionName,
      subject,
      sessionCode,
      duration,
      expiresAt,
      qrCode,
    });

    const savedSession = await session.save();

    res.status(201).json(savedSession);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/my-sessions", requireTeacherAuth, async (req, res) => {
  try {
    const sessions = await Session.find({ teacherId: req.teacher.id }).sort({ createdAt: -1 });
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/my-sessions/:id", requireTeacherAuth, async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, teacherId: req.teacher.id });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const totalDoubts = await Doubt.countDocuments({ sessionCode: session.sessionCode });
    const answeredDoubts = await Doubt.countDocuments({ sessionCode: session.sessionCode, status: "Answered" });
    const pendingDoubts = await Doubt.countDocuments({ sessionCode: session.sessionCode, status: "Pending" });
    const quizAttempts = await Result.countDocuments({ sessionCode: session.sessionCode });
    const students = await Result.distinct("studentName", { sessionCode: session.sessionCode });

    return res.status(200).json({
      session: {
        ...session.toObject(),
        status: session.isActive ? "Active" : "Closed",
      },
      stats: {
        totalStudents: students.length,
        totalDoubts,
        answeredDoubts,
        pendingDoubts,
        quizAttempts,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:code", async (req, res) => {
  try {
    const session = await Session.findOne({
      sessionCode: req.params.code,
    });

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    if (new Date() > session.expiresAt && session.isActive) {
      session.isActive = false;
      session.closedAt = new Date();
      await session.save();
    }

    res.status(200).json(session);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.put("/:id/close", requireTeacherAuth, async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.teacher.id },
      {
        isActive: false,
        closedAt: new Date(),
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    await Quiz.updateMany({ sessionCode: session.sessionCode }, { isActive: false });

    res.status(200).json(session);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/my-sessions/:id/answered", requireTeacherAuth, async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, teacherId: req.teacher.id });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const doubts = await Doubt.find({
      sessionCode: session.sessionCode,
      status: "Answered",
    }).sort({ answeredAt: -1, createdAt: -1 });

    res.status(200).json(doubts);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }
});

router.get("/my-sessions/:id/pending", requireTeacherAuth, async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, teacherId: req.teacher.id });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const doubts = await Doubt.find({
      sessionCode: session.sessionCode,
      status: "Pending",
    }).sort({ createdAt: -1 });

    res.status(200).json(doubts);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }
});

router.get("/:code/stats", requireTeacherAuth, async (req, res) => {
  try {

    const session = await Session.findOne({
      sessionCode: req.params.code,
      teacherId: req.teacher.id,
    });

    if (!session) {
      return res.status(404).json({
        message: "Session not found"
      });
    }

    const totalDoubts = await Doubt.countDocuments({ sessionCode: req.params.code });
    const answeredDoubts = await Doubt.countDocuments({ sessionCode: req.params.code, status: "Answered" });
    const pendingDoubts = await Doubt.countDocuments({ sessionCode: req.params.code, status: "Pending" });
    const quizAttempts = await Result.countDocuments({ sessionCode: req.params.code });
    const students = await Result.distinct("studentName", { sessionCode: req.params.code });

    res.json({
      sessionName: session.sessionName,
      subject: session.subject,
      sessionCode: session.sessionCode,
      status: session.isActive ? "Active" : "Closed",
      totalStudents: students.length,
      totalDoubts,
      answeredDoubts,
      pendingDoubts,
      quizAttempts,
      duration: session.duration,
      createdAt: session.createdAt,
      closedAt: session.closedAt,
      teacherName: session.teacherName,
    });

  }
  catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
});

module.exports = router;