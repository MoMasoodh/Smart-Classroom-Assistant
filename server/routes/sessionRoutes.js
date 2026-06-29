const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const QRCode = require("qrcode");
const Doubt = require("../models/Doubt");
const Result = require("../models/Result");

function generateSessionCode(subject) {
  const prefix = subject.substring(0, 4).toUpperCase();
  const randomNum = Math.floor(100 + Math.random() * 900);

  return prefix + randomNum;
}

router.post("/", async (req, res) => {
  try {
    const { sessionName, subject, duration } = req.body;

    const sessionCode = generateSessionCode(subject);
    const joinUrl = `http://localhost:3000/join/${sessionCode}`;

    const qrCode = await QRCode.toDataURL(joinUrl);

    const expiresAt = new Date(
      Date.now() + duration * 60 * 1000
    );

    const session = new Session({
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

    res.status(200).json(session);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.put("/:id/close", async (req, res) => {
  try {

    const session = await Session.findByIdAndUpdate(
      req.params.id,
      {
        isActive: false,
      },
      { new: true }
    );

    res.json(session);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});
// Get Session Statistics
router.get("/:code/stats", async (req, res) => {
  try {

    const session = await Session.findOne({
      sessionCode: req.params.code
    });

    if (!session) {
      return res.status(404).json({
        message: "Session not found"
      });
    }

   const totalDoubts = await Doubt.countDocuments({
  sessionCode: req.params.code
});

const answeredDoubts = await Doubt.countDocuments({
  sessionCode: req.params.code,
  status: "Answered"
});

const pendingDoubts = await Doubt.countDocuments({
  sessionCode: req.params.code,
  status: "Pending"
});
const quizAttempts = await Result.countDocuments({
  sessionCode: req.params.code
});

const students = await Result.distinct(
  "studentName",
  {
    sessionCode: req.params.code
  }
);

res.json({

  sessionName: session.sessionName,

  subject: session.subject,

  sessionCode: session.sessionCode,

  status: session.isActive ? "Active" : "Closed",

  totalStudents: students.length,

  totalDoubts,

  answeredDoubts,

  pendingDoubts,

  quizAttempts

});

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
});

module.exports = router;