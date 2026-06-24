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

  status: {
    type: String,
    default: "Pending",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

});

module.exports = mongoose.model("Doubt", doubtSchema);