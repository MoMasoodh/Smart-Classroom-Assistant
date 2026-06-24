const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  sessionName: {
    type: String,
    required: true,
  },

  subject: {
    type: String,
    required: true,
  },

  sessionCode: {
    type: String,
    required: true,
    unique: true,
  },

  duration: {
    type: Number,
    required: true,
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  quizEnabled: {
    type: Boolean,
    default: false,
  },

  qrCode: {
  type: String,
  default: "",
},

  createdAt: {
    type: Date,
    default: Date.now,
  },

  expiresAt: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("Session", sessionSchema);