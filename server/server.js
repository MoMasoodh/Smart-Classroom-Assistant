const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const doubtRoutes = require("./routes/doubtRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const quizRoutes = require("./routes/quizRoutes");
const resultRoutes = require("./routes/resultRoutes");
const aiRoutes = require("./routes/aiRoutes");
const authRoutes = require("./routes/authRoutes");
const studentAuthRoutes = require("./routes/studentAuthRoutes");
const statisticsRoutes = require("./routes/statisticsRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const timelineRoutes = require("./routes/timelineRoutes");
const historyRoutes = require("./routes/historyRoutes");
const profileRoutes = require("./routes/profileRoutes");
const { initSocket } = require("./services/socketService");
const { autoCloseExpiredSessions } = require("./services/sessionCleanupService");

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Configure CORS for local development and production deployment
const allowedOrigin = process.env.CLIENT_URL || "*";
app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());

// Serve static audio uploads with byte-range streaming headers
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, filePath) => {
      res.setHeader("Accept-Ranges", "bytes");
      if (filePath.endsWith(".webm")) {
        res.setHeader("Content-Type", "audio/webm");
      } else if (filePath.endsWith(".mp4")) {
        res.setHeader("Content-Type", "audio/mp4");
      } else if (filePath.endsWith(".ogg")) {
        res.setHeader("Content-Type", "audio/ogg");
      }
    },
  })
);

// Production Health Check Endpoint
app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  res.status(dbState === 1 ? 200 : 503).json({
    status: dbState === 1 ? "ok" : "degraded",
    database: states[dbState] || "unknown",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

app.use("/api/doubts", doubtRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/student-auth", studentAuthRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/timeline", timelineRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/profile", profileRoutes);

// Global Unhandled Error Handler
app.use((err, req, res, next) => {
  console.error("[ServerError]", err);
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === "production" ? "An internal server error occurred." : err.message,
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/qr-doubt-system";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    autoCloseExpiredSessions();
    setInterval(autoCloseExpiredSessions, 30000);
  })
  .catch((err) => console.error("MongoDB Connection Error:", err));

server.listen(PORT, () => {
  console.log(`Server & Socket.IO Running on Port ${PORT}`);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
});