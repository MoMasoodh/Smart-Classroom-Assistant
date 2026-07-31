const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  sessionCode: {
    type: String,
    required: true,
    index: true,
    uppercase: true,
    trim: true,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Session",
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  registerNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  joinTime: {
    type: Date,
    default: Date.now,
  },
  leaveTime: {
    type: Date,
    default: null,
  },
  totalDuration: {
    type: Number, // duration in minutes
    default: 0,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["Joined", "Left"],
    default: "Joined",
  },
});

module.exports = mongoose.model("Attendance", attendanceSchema);
