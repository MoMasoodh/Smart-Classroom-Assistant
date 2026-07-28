const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  sessionCode: {
    type: String,
    required: true,
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

  score: {
    type: Number,
    required: true,
  },

  totalQuestions: {
    type: Number,
    required: true,
  },

  submittedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("Result", resultSchema);