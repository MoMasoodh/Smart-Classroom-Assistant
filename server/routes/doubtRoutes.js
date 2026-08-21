const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Doubt = require("../models/Doubt");
const Session = require("../models/Session");
const Student = require("../models/Student");
const { requireTeacherAuth, requireAuth, requireStudentAuth, getBearerToken } = require("../middleware/authMiddleware");
const voiceUpload = require("../middleware/voiceUpload");
const { logTimelineEvent, broadcastSessionUpdate } = require("../services/socketService");

async function getOwnedSession(sessionCode, teacherId) {
  return Session.findOne({ sessionCode, teacherId });
}

// Get Answered Doubts (Classmate feed masks identity to "Anonymous Student", Teacher view & own doubt show full identity)
router.get("/session/:sessionCode/answered", async (req, res) => {
  try {
    const isTeacherView = req.query.teacherView === "true";
    const token = getBearerToken(req.headers.authorization || "");
    let studentRegNo = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret-key");
        if (decoded && decoded.registerNumber) {
          studentRegNo = decoded.registerNumber.toUpperCase();
        }
      } catch {
        // Ignore token error for public view
      }
    }

    const doubts = await Doubt.find({
      sessionCode: req.params.sessionCode.toUpperCase(),
      status: "Answered",
    }).sort({ answeredAt: -1, createdAt: -1 });

    const formattedDoubts = doubts.map((d) => {
      const obj = d.toObject();
      if (!isTeacherView) {
        const isOwn = studentRegNo && obj.registerNumber && obj.registerNumber.toUpperCase() === studentRegNo;
        if (!isOwn) {
          obj.studentName = "Anonymous Student";
          obj.registerNumber = "";
        }
      }
      return obj;
    });

    res.status(200).json(formattedDoubts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Pending Doubts (Teacher only - shows full student identity)
router.get("/session/:sessionCode/pending", requireTeacherAuth, async (req, res) => {
  try {
    const session = await getOwnedSession(req.params.sessionCode.toUpperCase(), req.teacher.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const doubts = await Doubt.find({
      sessionCode: req.params.sessionCode.toUpperCase(),
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
    const session = await getOwnedSession(req.params.sessionCode.toUpperCase(), req.teacher.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const doubts = await Doubt.find({
      sessionCode: req.params.sessionCode.toUpperCase(),
    }).sort({ createdAt: -1 });

    res.status(200).json(doubts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Student's Own Doubts for a Session
router.get("/session/:sessionCode/my-doubts", requireStudentAuth, async (req, res) => {
  try {
    const { registerNumber, studentName, studentId } = req.query;
    const authenticatedStudentId = req.student?.id;
    const authenticatedRegNo = req.student?.registerNumber?.toUpperCase();

    if (studentId && authenticatedStudentId && String(studentId) !== String(authenticatedStudentId)) {
      return res.status(403).json({ message: "Forbidden - Cannot access another student's doubts." });
    }

    if (registerNumber && authenticatedRegNo && String(registerNumber).toUpperCase() !== authenticatedRegNo) {
      return res.status(403).json({ message: "Forbidden - Cannot access another student's doubts." });
    }

    const query = { sessionCode: req.params.sessionCode.toUpperCase() };

    if (studentId || authenticatedStudentId) {
      query.studentId = studentId || authenticatedStudentId;
    } else if (registerNumber || authenticatedRegNo) {
      query.registerNumber = String(registerNumber || authenticatedRegNo).toUpperCase();
    } else if (studentName || req.student?.fullName) {
      query.studentName = String(studentName || req.student.fullName);
    } else {
      return res.status(400).json({ message: "Student identifier required" });
    }

    const doubts = await Doubt.find(query).sort({ createdAt: -1 });
    res.status(200).json(doubts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create Text Doubt
router.post("/", requireStudentAuth, async (req, res) => {
  try {
    const { studentName, registerNumber, sessionCode, subject, question, studentId } = req.body;

    if (!studentName || !sessionCode || !subject || !question) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const authenticatedStudentId = req.student?.id;
    const authenticatedRegNo = req.student?.registerNumber?.toUpperCase();

    if (studentId && authenticatedStudentId && String(studentId) !== String(authenticatedStudentId)) {
      return res.status(403).json({ message: "Forbidden - Cannot submit another student's doubt." });
    }

    if (registerNumber && authenticatedRegNo && String(registerNumber).toUpperCase() !== authenticatedRegNo) {
      return res.status(403).json({ message: "Forbidden - Cannot submit another student's doubt." });
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

    const finalStudentId = studentId || authenticatedStudentId;
    const finalRegisterNumber = (registerNumber || authenticatedRegNo || "").toUpperCase();
    const finalStudentName = studentName || req.student.fullName;

    let resolvedStudentId = finalStudentId;
    if (!resolvedStudentId && finalRegisterNumber) {
      const sDoc = await Student.findOne({ registerNumber: finalRegisterNumber });
      if (sDoc) resolvedStudentId = sDoc._id;
    }

    const doubt = new Doubt({
      studentId: resolvedStudentId,
      studentName: finalStudentName,
      registerNumber: finalRegisterNumber,
      sessionCode: sessionCode.toUpperCase(),
      subject,
      type: "text",
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

// Create Voice Doubt (Asynchronous Audio Upload)
router.post("/voice", requireStudentAuth, voiceUpload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Audio file is required" });
    }

    const { studentName, registerNumber, sessionCode, subject, transcription, studentId, audioDuration, audioMimeType } = req.body;

    if (!studentName || !sessionCode || !subject) {
      return res.status(400).json({ message: "Missing required doubt fields" });
    }

    const authenticatedStudentId = req.student?.id;
    const authenticatedRegNo = req.student?.registerNumber?.toUpperCase();

    if (studentId && authenticatedStudentId && String(studentId) !== String(authenticatedStudentId)) {
      return res.status(403).json({ message: "Forbidden - Cannot submit another student's doubt." });
    }

    if (registerNumber && authenticatedRegNo && String(registerNumber).toUpperCase() !== authenticatedRegNo) {
      return res.status(403).json({ message: "Forbidden - Cannot submit another student's doubt." });
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

    const finalStudentId = studentId || authenticatedStudentId;
    const finalRegisterNumber = (registerNumber || authenticatedRegNo || "").toUpperCase();
    const finalStudentName = studentName || req.student.fullName;

    let resolvedStudentId = finalStudentId;
    if (!resolvedStudentId && finalRegisterNumber) {
      const sDoc = await Student.findOne({ registerNumber: finalRegisterNumber });
      if (sDoc) resolvedStudentId = sDoc._id;
    }

    const audioUrl = `/uploads/audio/${req.file.filename}`;

    const doubt = new Doubt({
      studentId: resolvedStudentId,
      studentName: finalStudentName,
      registerNumber: finalRegisterNumber,
      sessionCode: sessionCode.toUpperCase(),
      subject,
      type: "voice",
      audioUrl,
      audioDuration: Number(audioDuration) || 0,
      audioMimeType: audioMimeType || req.file.mimetype || "audio/webm",
      transcription: transcription || "Voice Doubt Recording",
      question: transcription || "🎤 [Voice Doubt]",
    });

    const savedDoubt = await doubt.save();

    await logTimelineEvent({
      sessionCode: sessionCode.toUpperCase(),
      sessionId: session._id,
      eventType: "DOUBT_ASKED",
      title: `${studentName} Asked a Voice Doubt`,
      description: transcription || "Voice Doubt Recording",
      metadata: { doubtId: savedDoubt._id, registerNumber, studentName, isVoice: true },
    });

    broadcastSessionUpdate(sessionCode);

    res.status(201).json(savedDoubt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Answer Doubt (Text Reply)
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
        answerType: "text",
        status: "Answered",
        answeredAt: new Date(),
        teacherId: req.teacher.id,
        teacherName,
      },
      { returnDocument: "after" }
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

// Answer Doubt with Voice Answer Recording
router.put("/:id/voice-answer", requireTeacherAuth, voiceUpload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Voice answer audio file required" });
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

    const teacherName = req.teacher.fullName;
    const answerAudioUrl = `/uploads/audio/${req.file.filename}`;
    const textAnswer = req.body.answer || "🎤 [Voice Answer Recording]";

    const doubt = await Doubt.findByIdAndUpdate(
      req.params.id,
      {
        answer: textAnswer,
        answerType: "voice",
        answerAudioUrl,
        status: "Answered",
        answeredAt: new Date(),
        teacherId: req.teacher.id,
        teacherName,
      },
      { returnDocument: "after" }
    );

    await logTimelineEvent({
      sessionCode: existingDoubt.sessionCode,
      sessionId: session._id,
      eventType: "DOUBT_ANSWERED",
      title: `${teacherName} Answered with Voice`,
      description: `Voice answer for ${existingDoubt.studentName}`,
      metadata: { doubtId: doubt._id, studentName: existingDoubt.studentName, teacherName, isVoice: true },
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
