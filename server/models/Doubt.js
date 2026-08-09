const mongoose = require("mongoose");

const doubtSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    default: null,
  },

  studentName: {
    type: String,
    required: true,
  },

  registerNumber: {
    type: String,
    default: "",
    trim: true,
  },

  sessionCode: {
    type: String,
    required: true,
  },

  subject: {
    type: String,
    required: true,
  },

  type: {
    type: String,
    enum: ["text", "voice"],
    default: "text",
  },

  question: {
    type: String,
    required: function () {
      return this.type === "text";
    },
  },

  audioUrl: {
    type: String,
    default: "",
  },

  transcription: {
    type: String,
    default: "",
  },

  answer: {
    type: String,
    default: "",
  },

  answerType: {
    type: String,
    enum: ["text", "voice"],
    default: "text",
  },

  answerAudioUrl: {
    type: String,
    default: "",
  },

  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    default: null,
  },

  teacherName: {
    type: String,
    default: "",
    trim: true,
  },

  status: {
    type: String,
    default: "Pending",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  answeredAt: {
    type: Date,
    default: null,
  },
});

doubtSchema.index({ sessionCode: 1, createdAt: -1 });
doubtSchema.index({ studentId: 1 });
doubtSchema.index({ registerNumber: 1 });

module.exports = mongoose.model("Doubt", doubtSchema);