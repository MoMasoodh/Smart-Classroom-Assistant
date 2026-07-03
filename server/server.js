const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const doubtRoutes = require("./routes/doubtRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const quizRoutes = require("./routes/quizRoutes");
const resultRoutes = require("./routes/resultRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/doubts", doubtRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/ai", aiRoutes);

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"));

app.listen(process.env.PORT, () => {
  console.log("Server Running");
});