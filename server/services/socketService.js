const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Attendance = require("../models/Attendance");
const Timeline = require("../models/Timeline");
const Session = require("../models/Session");
const Student = require("../models/Student");

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  // Socket middleware for JWT verification
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      (socket.handshake.headers.authorization &&
        socket.handshake.headers.authorization.startsWith("Bearer ")
          ? socket.handshake.headers.authorization.slice(7)
          : null);

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.id) {
          socket.user = decoded;
        }
      } catch (err) {
        // Invalid token; allow connection but unauthenticated
      }
    }
    next();
  });

  io.on("connection", (socket) => {
    // Student or Teacher joins room
    socket.on("join_room", async ({ sessionCode, role, studentData }) => {
      if (!sessionCode) return;
      const roomName = `session:${sessionCode.toUpperCase()}`;
      socket.join(roomName);
      socket.sessionCode = sessionCode.toUpperCase();
      socket.role = role || (socket.user?.registerNumber ? "student" : "teacher");

      // Merge authenticated user info into studentData if available
      const activeStudentData = {
        ...studentData,
        studentId: socket.user?.id || studentData?.studentId || studentData?._id,
        registerNumber: studentData?.registerNumber || socket.user?.registerNumber,
        fullName: studentData?.fullName || socket.user?.fullName,
      };

      socket.studentData = activeStudentData;

      if (socket.role === "student" && activeStudentData.registerNumber) {
        try {
          await recordStudentJoin(sessionCode, activeStudentData);
          broadcastSessionUpdate(sessionCode);
        } catch (err) {
          console.error("Error handling socket student join:", err);
        }
      }
    });

    // Student heartbeat event
    socket.on("heartbeat", async ({ sessionCode, registerNumber }) => {
      if (!sessionCode || (!registerNumber && !socket.user?.registerNumber)) return;
      const regNo = (registerNumber || socket.user?.registerNumber).toUpperCase();
      try {
        await Attendance.findOneAndUpdate(
          {
            sessionCode: sessionCode.toUpperCase(),
            registerNumber: regNo,
            status: "Joined",
          },
          { lastSeen: new Date() },
          { returnDocument: "after" }
        );
      } catch (err) {
        console.error("Heartbeat error:", err);
      }
    });

    // Explicit leave event
    socket.on("leave_session", async ({ sessionCode, studentData }) => {
      const activeStudentData = {
        ...studentData,
        studentId: socket.user?.id || studentData?.studentId || studentData?._id,
        registerNumber: studentData?.registerNumber || socket.user?.registerNumber,
      };
      if (!sessionCode || !activeStudentData.registerNumber) return;
      try {
        await recordStudentLeave(sessionCode, activeStudentData);
        broadcastSessionUpdate(sessionCode);
      } catch (err) {
        console.error("Leave error:", err);
      }
    });

    socket.on("disconnect", async () => {
      if (socket.role === "student" && socket.sessionCode && socket.studentData?.registerNumber) {
        try {
          await recordStudentLeave(socket.sessionCode, socket.studentData);
          broadcastSessionUpdate(socket.sessionCode);
        } catch (err) {
          console.error("Disconnect cleanup error:", err);
        }
      }
    });
  });

  // Periodic cleanup for stale heartbeats (>45 seconds without heartbeat)
  setInterval(async () => {
    try {
      const staleTime = new Date(Date.now() - 45 * 1000);
      const staleRecords = await Attendance.find({
        status: "Joined",
        lastSeen: { $lt: staleTime },
      });

      for (const rec of staleRecords) {
        const leaveTime = rec.lastSeen || new Date();
        const durationMin = Math.max(1, Math.round((leaveTime - rec.joinTime) / (60 * 1000)));
        rec.status = "Left";
        rec.leaveTime = leaveTime;
        rec.totalDuration = durationMin;
        await rec.save();

        await logTimelineEvent({
          sessionCode: rec.sessionCode,
          sessionId: rec.sessionId,
          eventType: "STUDENT_LEFT",
          title: `${rec.fullName} Left (Timeout)`,
          description: `Register No: ${rec.registerNumber} timed out`,
          metadata: { registerNumber: rec.registerNumber, fullName: rec.fullName, durationMin },
        });

        broadcastSessionUpdate(rec.sessionCode);
      }
    } catch (err) {
      console.error("Error in stale heartbeat cleanup:", err);
    }
  }, 20000);

  return io;
}

function getIO() {
  return io;
}

async function recordStudentJoin(sessionCode, studentData) {
  if (!sessionCode || !studentData) return null;
  const code = sessionCode.toUpperCase();
  const session = await Session.findOne({ sessionCode: code });
  if (!session || !session.isActive) return null;

  const regNo = studentData.registerNumber ? studentData.registerNumber.toUpperCase() : "";
  let studentId = studentData.studentId || studentData._id || studentData.id;

  if (!studentId && regNo) {
    const sDoc = await Student.findOne({ registerNumber: regNo });
    if (sDoc) {
      studentId = sDoc._id;
    }
  }

  if (!studentId) {
    console.error("recordStudentJoin error: Unable to resolve studentId for registerNumber:", regNo);
    return null;
  }

  let attendance = await Attendance.findOne({
    sessionCode: code,
    $or: [{ studentId: studentId }, { registerNumber: regNo }],
  });

  if (!attendance) {
    attendance = new Attendance({
      sessionCode: code,
      sessionId: session._id,
      studentId: studentId,
      registerNumber: regNo,
      fullName: studentData.fullName || "Student",
      joinTime: new Date(),
      lastSeen: new Date(),
      status: "Joined",
    });
    await attendance.save();

    await logTimelineEvent({
      sessionCode: code,
      sessionId: session._id,
      eventType: "STUDENT_JOINED",
      title: `${studentData.fullName || regNo} Joined`,
      description: `Register No: ${regNo}`,
      metadata: { registerNumber: regNo, fullName: studentData.fullName },
    });
  } else {
    const wasLeft = attendance.status === "Left";
    attendance.status = "Joined";
    attendance.lastSeen = new Date();
    if (studentId && !attendance.studentId) {
      attendance.studentId = studentId;
    }
    await attendance.save();

    if (wasLeft) {
      await logTimelineEvent({
        sessionCode: code,
        sessionId: session._id,
        eventType: "STUDENT_JOINED",
        title: `${studentData.fullName || regNo} Reconnected`,
        description: `Register No: ${regNo}`,
        metadata: { registerNumber: regNo, fullName: studentData.fullName, isReconnect: true },
      });
    }
  }

  return attendance;
}

async function recordStudentLeave(sessionCode, studentData) {
  if (!sessionCode || !studentData) return;
  const code = sessionCode.toUpperCase();
  const regNo = studentData.registerNumber ? studentData.registerNumber.toUpperCase() : "";
  const studentId = studentData.studentId || studentData._id || studentData.id;

  const query = {
    sessionCode: code,
    status: "Joined",
  };
  if (studentId) {
    query.$or = [{ studentId }, { registerNumber: regNo }];
  } else if (regNo) {
    query.registerNumber = regNo;
  } else {
    return;
  }

  const attendance = await Attendance.findOne(query);

  if (attendance) {
    const leaveTime = new Date();
    const durationMin = Math.max(1, Math.round((leaveTime - attendance.joinTime) / (60 * 1000)));
    attendance.status = "Left";
    attendance.leaveTime = leaveTime;
    attendance.totalDuration = durationMin;
    attendance.lastSeen = leaveTime;
    await attendance.save();

    await logTimelineEvent({
      sessionCode: code,
      sessionId: attendance.sessionId,
      eventType: "STUDENT_LEFT",
      title: `${attendance.fullName} Left`,
      description: `Attended for ${durationMin} min`,
      metadata: { registerNumber: regNo, fullName: attendance.fullName, durationMin },
    });
  }
}

async function logTimelineEvent({ sessionCode, sessionId, eventType, title, description, metadata }) {
  try {
    const event = new Timeline({
      sessionCode: sessionCode.toUpperCase(),
      sessionId,
      eventType,
      title,
      description: description || "",
      metadata: metadata || {},
      timestamp: new Date(),
    });
    await event.save();

    if (io) {
      io.to(`session:${sessionCode.toUpperCase()}`).emit("timeline_event", event);
    }
    return event;
  } catch (err) {
    console.error("Error logging timeline event:", err);
  }
}

function broadcastSessionUpdate(sessionCode) {
  if (io) {
    io.to(`session:${sessionCode.toUpperCase()}`).emit("session_updated", { sessionCode: sessionCode.toUpperCase() });
  }
}

module.exports = {
  initSocket,
  getIO,
  recordStudentJoin,
  recordStudentLeave,
  logTimelineEvent,
  broadcastSessionUpdate,
};

