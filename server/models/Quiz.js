const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
  sessionCode: {
    type: String,
    required: true,
  },

  title: {
    type: String,
    required: true,
  },

  duration: {
    type: Number,
    required: true,
  },

  isActive: {
    type: Boolean,
    default: false,
  },

  questions: [
    {
      question: {
        type: String,
        required: true,
      },

      options: {
        type: [String],
        required: true,
      },

      correctAnswer: {
        type: String,
        required: true,
      },
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Quiz", quizSchema);