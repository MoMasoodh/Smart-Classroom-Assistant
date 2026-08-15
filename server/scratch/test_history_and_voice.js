const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const express = require("express");
const http = require("http");

const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const Session = require("../models/Session");
const Attendance = require("../models/Attendance");
const Doubt = require("../models/Doubt");
const Result = require("../models/Result");

const historyRoutes = require("../routes/historyRoutes");
const profileRoutes = require("../routes/profileRoutes");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/qr-doubt-system";
const JWT_SECRET = process.env.JWT_SECRET || "smart-classroom-secret-key-2026";
process.env.JWT_SECRET = JWT_SECRET;

async function runIntegrationTest() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);

  console.log("Setting up mock test environment...");
  const timestamp = Date.now();

  // Create Test Teacher
  const teacher = new Teacher({
    fullName: `Dr. Test Teacher ${timestamp}`,
    email: `teacher_${timestamp}@test.com`,
    password: "hashedpassword123",
    department: "Computer Science",
  });
  await teacher.save();

  const teacherToken = jwt.sign({ id: teacher._id, fullName: teacher.fullName }, JWT_SECRET);

  // Create Test Student A & Student B
  const studentA = new Student({
    fullName: `Student Alpha ${timestamp}`,
    registerNumber: `REG_A_${timestamp}`,
    email: `studentA_${timestamp}@test.com`,
    password: "hashedpassword123",
    department: "Computer Science",
    year: 3,
  });
  await studentA.save();

  const studentB = new Student({
    fullName: `Student Beta ${timestamp}`,
    registerNumber: `REG_B_${timestamp}`,
    email: `studentB_${timestamp}@test.com`,
    password: "hashedpassword123",
    department: "Computer Science",
    year: 3,
  });
  await studentB.save();

  const tokenA = jwt.sign(
    { id: studentA._id, fullName: studentA.fullName, registerNumber: studentA.registerNumber },
    JWT_SECRET
  );
  const tokenB = jwt.sign(
    { id: studentB._id, fullName: studentB.fullName, registerNumber: studentB.registerNumber },
    JWT_SECRET
  );

  // Create Session 1 & Session 2
  const code1 = `S1_${Math.floor(100 + Math.random() * 900)}`;
  const session1 = new Session({
    sessionName: "Database Systems",
    subject: "Computer Science",
    sessionCode: code1,
    duration: 60,
    teacherId: teacher._id,
    teacherName: teacher.fullName,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000),
    isActive: true,
  });
  await session1.save();

  const code2 = `S2_${Math.floor(100 + Math.random() * 900)}`;
  const session2 = new Session({
    sessionName: "Operating Systems",
    subject: "Computer Science",
    sessionCode: code2,
    duration: 60,
    teacherId: teacher._id,
    teacherName: teacher.fullName,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000),
    isActive: true,
  });
  await session2.save();

  // Create Attendance (Student A in Session 1 twice to test deduplication, and Session 2)
  const attA1_1 = new Attendance({
    sessionCode: code1,
    sessionId: session1._id,
    studentId: studentA._id,
    registerNumber: studentA.registerNumber,
    fullName: studentA.fullName,
    joinTime: new Date(Date.now() - 30 * 60000),
    leaveTime: new Date(Date.now() - 25 * 60000),
    totalDuration: 5,
    status: "Left",
  });
  await attA1_1.save();

  const attA1_2 = new Attendance({
    sessionCode: code1,
    sessionId: session1._id,
    studentId: studentA._id,
    registerNumber: studentA.registerNumber,
    fullName: studentA.fullName,
    joinTime: new Date(Date.now() - 20 * 60000),
    leaveTime: new Date(Date.now() - 5 * 60000),
    totalDuration: 15,
    status: "Left",
  });
  await attA1_2.save();

  const attA2 = new Attendance({
    sessionCode: code2,
    sessionId: session2._id,
    studentId: studentA._id,
    registerNumber: studentA.registerNumber,
    fullName: studentA.fullName,
    joinTime: new Date(Date.now() - 10 * 60000),
    leaveTime: new Date(),
    totalDuration: 10,
    status: "Joined",
  });
  await attA2.save();

  // Student B in Session 1
  const attB1 = new Attendance({
    sessionCode: code1,
    sessionId: session1._id,
    studentId: studentB._id,
    registerNumber: studentB.registerNumber,
    fullName: studentB.fullName,
    joinTime: new Date(Date.now() - 40 * 60000),
    leaveTime: new Date(),
    totalDuration: 40,
    status: "Joined",
  });
  await attB1.save();

  // Create Quiz Results (Student A: 18/20, Student B: 15/20 in Session 1)
  const resA = new Result({
    studentId: studentA._id,
    sessionCode: code1,
    studentName: studentA.fullName,
    registerNumber: studentA.registerNumber,
    score: 18,
    totalQuestions: 20,
  });
  await resA.save();

  const resB = new Result({
    studentId: studentB._id,
    sessionCode: code1,
    studentName: studentB.fullName,
    registerNumber: studentB.registerNumber,
    score: 15,
    totalQuestions: 20,
  });
  await resB.save();

  // Create Voice Doubt & Voice Answer
  const doubtVoiceA = new Doubt({
    studentId: studentA._id,
    studentName: studentA.fullName,
    registerNumber: studentA.registerNumber,
    sessionCode: code1,
    subject: "Computer Science",
    type: "voice",
    audioUrl: "/uploads/audio/test_doubt_a.webm",
    transcription: "What is B-tree balancing?",
    status: "Answered",
    answer: "B-trees maintain balance through node splitting and merging.",
    answerType: "voice",
    answerAudioUrl: "/uploads/audio/test_answer_a.webm",
    teacherId: teacher._id,
    teacherName: teacher.fullName,
  });
  await doubtVoiceA.save();

  console.log("Testing API route execution...");
  const app = express();
  app.use(express.json());
  app.use("/api/history", historyRoutes);
  app.use("/api/profile", profileRoutes);

  // Setup express test listener
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  // 1. Student A History Test
  const respA = await fetch(`http://127.0.0.1:${port}/api/history/student`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const histA = await respA.json();
  console.log("Student A History Count:", histA.length);
  console.log("Student A History Item 1 SessionCode:", histA[0]?.sessionCode);
  console.log("Student A Session 1 Attendance %:", histA.find((h) => h.sessionCode === code1)?.attendancePercentage);
  console.log("Student A Session 1 Quiz Rank:", histA.find((h) => h.sessionCode === code1)?.rank);

  // Assertions for Student A
  if (histA.length !== 2) {
    throw new Error(`FAILED: Student A should have 2 unique sessions, found ${histA.length}`);
  }
  const itemA1 = histA.find((h) => h.sessionCode === code1);
  if (itemA1.quizScore !== 18 || itemA1.rank !== 1) {
    throw new Error(`FAILED: Student A rank or score mismatch in Session 1`);
  }

  // 2. Student B History Test
  const respB = await fetch(`http://127.0.0.1:${port}/api/history/student`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const histB = await respB.json();
  console.log("Student B History Count:", histB.length);
  console.log("Student B Rank in Session 1:", histB[0]?.rank);

  if (histB.length !== 1 || histB[0].sessionCode !== code1 || histB[0].rank !== 2) {
    throw new Error(`FAILED: Student B history mismatch. Expected 1 session with rank 2`);
  }

  // 3. Teacher History Test
  const respT = await fetch(`http://127.0.0.1:${port}/api/history/teacher`, {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  const histT = await respT.json();
  console.log("Teacher Sessions Count:", histT.length);

  if (histT.length !== 2) {
    throw new Error(`FAILED: Teacher history should show 2 sessions`);
  }

  // 4. Session Details Test
  const respDetails = await fetch(`http://127.0.0.1:${port}/api/history/session-details/${code1}`, {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  const details = await respDetails.json();
  console.log("Session Details Doubts Count:", details.doubts?.length);
  console.log("Voice doubt audioUrl:", details.doubts[0]?.audioUrl);

  if (details.doubts[0]?.type !== "voice" || !details.doubts[0]?.answerAudioUrl) {
    throw new Error(`FAILED: Voice doubt/answer metadata missing in session details`);
  }

  console.log("\n==================================================");
  console.log("✅ SUCCESS: All Session History & Voice UI integration tests passed!");
  console.log("==================================================\n");

  // Clean up test documents
  await Teacher.deleteOne({ _id: teacher._id });
  await Student.deleteMany({ _id: { $in: [studentA._id, studentB._id] } });
  await Session.deleteMany({ _id: { $in: [session1._id, session2._id] } });
  await Attendance.deleteMany({ sessionCode: { $in: [code1, code2] } });
  await Result.deleteMany({ sessionCode: { $in: [code1, code2] } });
  await Doubt.deleteMany({ sessionCode: { $in: [code1, code2] } });

  server.close();
  await mongoose.disconnect();
}

runIntegrationTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
