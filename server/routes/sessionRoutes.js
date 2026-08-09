const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const QRCode = require("qrcode");
const Doubt = require("../models/Doubt");
const Result = require("../models/Result");
const Quiz = require("../models/Quiz");
const { requireTeacherAuth } = require("../middleware/authMiddleware");

const Attendance = require("../models/Attendance");
const { logTimelineEvent, broadcastSessionUpdate } = require("../services/socketService");

function generateSessionCode(subject) {
  const prefix = subject.substring(0, 4).toUpperCase();
  const randomNum = Math.floor(100 + Math.random() * 900);

  return prefix + randomNum;
}

router.post("/", requireTeacherAuth, async (req, res) => {
  try {
    const { sessionName, subject, duration, customExpiresAt } = req.body;

    if (!sessionName || !subject || (!duration && !customExpiresAt)) {
      return res.status(400).json({
        message: "Session name, subject, and duration or expiration time are required",
      });
    }

    let expiresAt;
    let durationMinutes = Number(duration);

    if (customExpiresAt) {
      expiresAt = new Date(customExpiresAt);
      if (isNaN(expiresAt.getTime())) {
        return res.status(400).json({ message: "Invalid custom expiration date/time" });
      }
      durationMinutes = Math.max(1, Math.round((expiresAt.getTime() - Date.now()) / (60 * 1000)));
    } else {
      expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    }

    if (expiresAt <= new Date()) {
      return res.status(400).json({ message: "Expiration time must be in the future" });
    }

    const sessionCode = generateSessionCode(subject);
    const joinUrl = `http://localhost:3000/join/${sessionCode}`;

    const qrCode = await QRCode.toDataURL(joinUrl);

    const session = new Session({
      teacherId: req.teacher.id,
      teacherName: req.teacher.fullName,
      sessionName,
      subject,
      sessionCode,
      duration: durationMinutes,
      expiresAt,
      qrCode,
    });

    const savedSession = await session.save();

    await logTimelineEvent({
      sessionCode,
      sessionId: savedSession._id,
      eventType: "SESSION_STARTED",
      title: "Session Started",
      description: `${sessionName} (${subject}) created by ${req.teacher.fullName}`,
      metadata: { teacherName: req.teacher.fullName, duration: durationMinutes },
    });

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

    const [doubtStudents, resultStudents, attendanceStudents] = await Promise.all([
      Doubt.distinct("registerNumber", { sessionCode: session.sessionCode }),
      Result.distinct("registerNumber", { sessionCode: session.sessionCode }),
      Attendance.distinct("registerNumber", { sessionCode: session.sessionCode }),
    ]);

    const uniqueStudents = new Set([...doubtStudents, ...resultStudents, ...attendanceStudents].filter(Boolean));

    return res.status(200).json({
      session: {
        ...session.toObject(),
        status: session.isActive ? "Active" : "Closed",
      },
      stats: {
        totalStudents: uniqueStudents.size,
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
      sessionCode: req.params.code.toUpperCase(),
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

      await logTimelineEvent({
        sessionCode: session.sessionCode,
        sessionId: session._id,
        eventType: "SESSION_CLOSED",
        title: "Session Closed",
        description: "Session automatically closed upon expiration",
      });
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
      { returnDocument: "after" }
    );

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    await Quiz.updateMany({ sessionCode: session.sessionCode }, { isActive: false });

    // Close all open attendance records
    const activeAttendances = await Attendance.find({ sessionCode: session.sessionCode, status: "Joined" });
    const now = new Date();
    for (const att of activeAttendances) {
      att.status = "Left";
      att.leaveTime = now;
      att.totalDuration = Math.max(1, Math.round((now - att.joinTime) / 60000));
      await att.save();
    }

    await logTimelineEvent({
      sessionCode: session.sessionCode,
      sessionId: session._id,
      eventType: "SESSION_CLOSED",
      title: "Session Closed",
      description: `Closed by teacher ${req.teacher.fullName}`,
      metadata: { closedAt: session.closedAt },
    });

    broadcastSessionUpdate(session.sessionCode);

    res.status(200).json(session);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// Edit / Extend Active Session Expiration Time
router.put("/:id/time", requireTeacherAuth, async (req, res) => {
  try {
    const { customExpiresAt, additionalMinutes } = req.body;
    const session = await Session.findOne({ _id: req.params.id, teacherId: req.teacher.id });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    let nextExpiresAt;
    if (customExpiresAt) {
      nextExpiresAt = new Date(customExpiresAt);
    } else if (additionalMinutes) {
      const currentExpiry = session.expiresAt && new Date(session.expiresAt) > new Date()
        ? new Date(session.expiresAt)
        : new Date();
      nextExpiresAt = new Date(currentExpiry.getTime() + Number(additionalMinutes) * 60 * 1000);
    } else {
      return res.status(400).json({ message: "Please provide customExpiresAt or additionalMinutes" });
    }

    if (isNaN(nextExpiresAt.getTime()) || nextExpiresAt <= new Date()) {
      return res.status(400).json({ message: "New expiration time must be in the future" });
    }

    const durationMin = Math.max(1, Math.round((nextExpiresAt.getTime() - session.createdAt.getTime()) / (60 * 1000)));

    session.expiresAt = nextExpiresAt;
    session.duration = durationMin;
    session.isActive = true;
    session.closedAt = null;

    const savedSession = await session.save();

    await logTimelineEvent({
      sessionCode: session.sessionCode,
      sessionId: session._id,
      eventType: "SESSION_STARTED",
      title: "Session Time Extended",
      description: `End time extended to ${nextExpiresAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      metadata: { expiresAt: nextExpiresAt, duration: durationMin },
    });

    broadcastSessionUpdate(session.sessionCode);

    res.status(200).json(savedSession);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

const { getSessionStatistics } = require("../controllers/statisticsController");

router.get("/:code/stats", requireTeacherAuth, (req, res) => {
  req.params.sessionCode = req.params.code;
  return getSessionStatistics(req, res);
});

module.exports = router;