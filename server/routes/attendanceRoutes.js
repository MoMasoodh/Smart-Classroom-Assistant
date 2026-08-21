const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const Session = require("../models/Session");
const { recordStudentJoin, recordStudentLeave, broadcastSessionUpdate } = require("../services/socketService");

// Join session HTTP endpoint
router.post("/join", async (req, res) => {
  try {
    const { sessionCode, studentId, registerNumber, fullName } = req.body;
    if (!sessionCode || !registerNumber || !fullName) {
      return res.status(400).json({ message: "Session code, register number, and name required" });
    }

    const attendance = await recordStudentJoin(sessionCode, {
      studentId,
      registerNumber,
      fullName,
    });

    broadcastSessionUpdate(sessionCode);
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Leave session HTTP endpoint
router.post("/leave", async (req, res) => {
  try {
    const { sessionCode, registerNumber } = req.body;
    if (!sessionCode || !registerNumber) {
      return res.status(400).json({ message: "Session code and register number required" });
    }

    await recordStudentLeave(sessionCode, { registerNumber });
    broadcastSessionUpdate(sessionCode);
    res.status(200).json({ message: "Left session successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get real-time student list for a session
router.get("/session/:code", async (req, res) => {
  try {
    const sessionCode = req.params.code.toUpperCase();
    const rawStudents = await Attendance.find({ sessionCode }).sort({ status: 1, joinTime: -1 });

    const studentMap = new Map();
    rawStudents.forEach((student) => {
      const key = student.registerNumber ? student.registerNumber.toUpperCase() : String(student.studentId || student._id);
      if (!studentMap.has(key)) {
        studentMap.set(key, student);
      } else {
        const existing = studentMap.get(key);
        if (existing.status !== "Joined" && student.status === "Joined") {
          studentMap.set(key, student);
        }
      }
    });

    const students = Array.from(studentMap.values());
    const activeCount = students.filter((s) => s.status === "Joined").length;
    const totalAttendanceCount = students.length;

    res.status(200).json({
      sessionCode,
      activeCount,
      totalAttendanceCount,
      students,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student attendance history across all sessions
router.get("/student/:registerNumber", async (req, res) => {
  try {
    const regNo = req.params.registerNumber.toUpperCase();
    const attendanceRecords = await Attendance.find({ registerNumber: regNo }).sort({ joinTime: -1 });

    res.status(200).json(attendanceRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
