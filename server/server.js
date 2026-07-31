const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
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

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

server.listen(PORT, () => {
  console.log(`Server & Socket.IO Running on Port ${PORT}`);
});