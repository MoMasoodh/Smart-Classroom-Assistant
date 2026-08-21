const Session = require("../models/Session");
const Quiz = require("../models/Quiz");
const Attendance = require("../models/Attendance");
const { logTimelineEvent, broadcastSessionUpdate } = require("./socketService");

/**
 * Checks for all active sessions whose expiration time has passed,
 * auto-closes them in MongoDB, deactivates related quizzes,
 * updates open student attendance records, logs a timeline event,
 * and notifies active socket clients.
 */
async function autoCloseExpiredSessions() {
  try {
    const now = new Date();
    const expiredSessions = await Session.find({
      isActive: true,
      expiresAt: { $lte: now },
    });

    if (!expiredSessions || expiredSessions.length === 0) {
      return [];
    }

    const closedSessions = [];

    for (const session of expiredSessions) {
      const closedTime = session.expiresAt && new Date(session.expiresAt) <= now
        ? new Date(session.expiresAt)
        : now;

      await Session.updateOne(
        { _id: session._id },
        { isActive: false, closedAt: closedTime }
      );

      session.isActive = false;
      session.closedAt = closedTime;

      // Deactivate associated quizzes
      await Quiz.updateMany({ sessionCode: session.sessionCode }, { isActive: false });

      // Close open student attendance records
      const activeAttendances = await Attendance.find({
        sessionCode: session.sessionCode,
        status: "Joined",
      });

      for (const att of activeAttendances) {
        att.status = "Left";
        att.leaveTime = closedTime;
        att.totalDuration = Math.max(1, Math.round((closedTime - new Date(att.joinTime)) / 60000));
        await att.save().catch(() => {});
      }

      // Log timeline event
      await logTimelineEvent({
        sessionCode: session.sessionCode,
        sessionId: session._id,
        eventType: "SESSION_CLOSED",
        title: "Session Closed",
        description: "Session automatically closed upon expiration",
      });

      // Broadcast update via WebSockets
      broadcastSessionUpdate(session.sessionCode);

      closedSessions.push(session);
    }

    console.log(`[AutoCloseCleanup] Auto-closed ${closedSessions.length} expired classroom session(s).`);
    return closedSessions;
  } catch (error) {
    console.error("[AutoCloseCleanup] Error during auto-close cleanup:", error);
    return [];
  }
}

module.exports = {
  autoCloseExpiredSessions,
};
