const mongoose = require("mongoose");

const timelineSchema = new mongoose.Schema({
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
    default: null,
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      "SESSION_STARTED",
      "STUDENT_JOINED",
      "STUDENT_LEFT",
      "DOUBT_ASKED",
      "DOUBT_ANSWERED",
      "QUIZ_STARTED",
      "QUIZ_SUBMITTED",
      "SESSION_CLOSED",
    ],
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Timeline", timelineSchema);
