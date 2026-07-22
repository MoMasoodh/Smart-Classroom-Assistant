const mongoose = require("mongoose");

const doubtSchema = new mongoose.Schema({

  studentName: {
    type: String,
    required: true,
  },

  sessionCode: {
    type: String,
    required: true,
  },

  subject: {
    type: String,
    required: true,
  },

  question: {
    type: String,
    required: true,
  },

  answer: {
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

module.exports = mongoose.model("Doubt", doubtSchema);