const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    default: null,
  },

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
  },

  answers: [
    {
      questionIndex: Number,
      questionText: String,
      options: [String],
      selectedOption: String,
      correctAnswer: String,
      isCorrect: Boolean,
    },
  ],
});

resultSchema.index(
  { sessionCode: 1, studentId: 1 },
  { unique: true, partialFilterExpression: { studentId: { $type: "objectId" } } }
);
resultSchema.index(
  { sessionCode: 1, registerNumber: 1 },
  { unique: true, partialFilterExpression: { registerNumber: { $gt: "" } } }
);
resultSchema.index({ sessionCode: 1, score: -1, submittedAt: 1 });

module.exports = mongoose.model("Result", resultSchema);