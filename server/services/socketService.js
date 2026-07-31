const { Server } = require("socket.io");
const Attendance = require("../models/Attendance");
const Timeline = require("../models/Timeline");
const Session = require("../models/Session");

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    // Student or Teacher joins room
    socket.on("join_room", async ({ sessionCode, role, studentData }) => {
      if (!sessionCode) return;
      const roomName = `session:${sessionCode.toUpperCase()}`;
      socket.join(roomName);
      socket.sessionCode = sessionCode.toUpperCase();
      socket.role = role;
      socket.studentData = studentData;

      if (role === "student" && studentData?.registerNumber) {
        try {
          await recordStudentJoin(sessionCode, studentData);
          broadcastSessionUpdate(sessionCode);
        } catch (err) {
          console.error("Error handling socket student join:", err);
        }
      }
    });

    // Student heartbeat event
    socket.on("heartbeat", async ({ sessionCode, registerNumber }) => {
      if (!sessionCode || !registerNumber) return;
      try {
        await Attendance.findOneAndUpdate(
          {
            sessionCode: sessionCode.toUpperCase(),
            registerNumber: registerNumber.toUpperCase(),
            status: "Joined",
          },
          { lastSeen: new Date() }
        );
      } catch (err) {
        console.error("Heartbeat error:", err);
      }
    });

    // Explicit leave event
    socket.on("leave_session", async ({ sessionCode, studentData }) => {
      if (!sessionCode || !studentData?.registerNumber) return;
      try {
        await recordStudentLeave(sessionCode, studentData);
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
  const code = sessionCode.toUpperCase();
  const session = await Session.findOne({ sessionCode: code });
  if (!session || !session.isActive) return null;

  let attendance = await Attendance.findOne({
    sessionCode: code,
    registerNumber: studentData.registerNumber.toUpperCase(),
    status: "Joined",
  });

  if (!attendance) {
    attendance = new Attendance({
      sessionCode: code,
      sessionId: session._id,
      studentId: studentData.studentId || studentData._id,
      registerNumber: studentData.registerNumber.toUpperCase(),
      fullName: studentData.fullName,
      joinTime: new Date(),
      lastSeen: new Date(),
      status: "Joined",
    });
    await attendance.save();

    await logTimelineEvent({
      sessionCode: code,
      sessionId: session._id,
      eventType: "STUDENT_JOINED",
      title: `${studentData.fullName} Joined`,
      description: `Register No: ${studentData.registerNumber}`,
      metadata: { registerNumber: studentData.registerNumber, fullName: studentData.fullName },
    });
  } else {
    attendance.lastSeen = new Date();
    await attendance.save();
  }

  return attendance;
}

async function recordStudentLeave(sessionCode, studentData) {
  const code = sessionCode.toUpperCase();
  const regNo = studentData.registerNumber.toUpperCase();

  const attendance = await Attendance.findOne({
    sessionCode: code,
    registerNumber: regNo,
    status: "Joined",
  });

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
