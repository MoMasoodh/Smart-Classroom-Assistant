function getStudentKey(doc = {}) {
  if (doc.studentId) {
    return String(doc.studentId);
  }

  if (doc.registerNumber) {
    return String(doc.registerNumber).trim().toUpperCase();
  }

  if (doc.studentName) {
    return String(doc.studentName).trim().toLowerCase();
  }

  return String(doc._id || "");
}

function summarizeAttendances(attendances = []) {
  const grouped = new Map();

  attendances.forEach((attendance) => {
    const key = getStudentKey(attendance);
    const joinTime = attendance.joinTime ? new Date(attendance.joinTime) : null;
    const leaveTime = attendance.leaveTime ? new Date(attendance.leaveTime) : null;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        ...attendance,
        joinTime,
        leaveTime,
        totalDuration: Number(attendance.totalDuration) || 0,
      });
      return;
    }

    const existingJoinTime = existing.joinTime ? new Date(existing.joinTime) : null;
    const existingLeaveTime = existing.leaveTime ? new Date(existing.leaveTime) : null;

    if (joinTime && (!existingJoinTime || joinTime < existingJoinTime)) {
      existing.joinTime = joinTime;
    }

    if (leaveTime && (!existingLeaveTime || leaveTime > existingLeaveTime)) {
      existing.leaveTime = leaveTime;
    }

    existing.totalDuration = (Number(existing.totalDuration) || 0) + (Number(attendance.totalDuration) || 0);

    if (attendance.lastSeen && (!existing.lastSeen || new Date(attendance.lastSeen) > new Date(existing.lastSeen))) {
      existing.lastSeen = attendance.lastSeen;
      existing.status = attendance.status;
    }
  });

  return [...grouped.values()].sort((a, b) => {
    const aTime = a.joinTime ? new Date(a.joinTime).getTime() : 0;
    const bTime = b.joinTime ? new Date(b.joinTime).getTime() : 0;
    return bTime - aTime;
  });
}

function dedupeResults(results = []) {
  const grouped = new Map();

  results.forEach((result) => {
    const key = getStudentKey(result);
    const existing = grouped.get(key);
    const score = Number(result.score) || 0;
    const submittedAt = result.submittedAt ? new Date(result.submittedAt) : null;

    if (!existing) {
      grouped.set(key, {
        ...result,
        submittedAt,
      });
      return;
    }

    const existingScore = Number(existing.score) || 0;
    const existingSubmittedAt = existing.submittedAt ? new Date(existing.submittedAt) : null;

    if (score > existingScore || (score === existingScore && submittedAt && (!existingSubmittedAt || submittedAt > existingSubmittedAt))) {
      grouped.set(key, {
        ...result,
        submittedAt,
      });
    }
  });

  return [...grouped.values()].sort((a, b) => {
    const scoreDiff = (Number(b.score) || 0) - (Number(a.score) || 0);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
    const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
    return aTime - bTime;
  });
}

function dedupeTimelineEvents(events = []) {
  if (!Array.isArray(events) || events.length === 0) {
    return [];
  }

  // 1. Sort events chronologically
  const sorted = [...events].sort((a, b) => {
    const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return aTime - bTime;
  });

  const deduped = [];
  const lastEventByStudent = new Map(); // regNo -> { eventType, timestamp }
  const seenExact = new Map(); // fingerprint -> timestamp

  sorted.forEach((event) => {
    let eventType = event.eventType || "";
    const title = event.title || "";
    const description = event.description || "";
    const metadata = event.metadata || {};
    const regNo = String(metadata.registerNumber || "").trim().toUpperCase();
    const timestamp = event.timestamp ? new Date(event.timestamp).getTime() : Date.now();

    // Correct wrong eventType if session extension was logged as SESSION_STARTED
    if (eventType === "SESSION_STARTED" && (/extend/i.test(title) || /extend/i.test(description))) {
      eventType = "SESSION_EXTENDED";
    }

    const normalizedEvent = {
      ...event,
      eventType,
      title,
      description,
    };

    // 2. Exact duplicate check within 15 seconds
    const exactFingerprint = [
      eventType,
      title,
      description,
      regNo,
      String(metadata.doubtId || metadata.quizId || metadata.teacherName || ""),
    ].join("|");

    if (seenExact.has(exactFingerprint)) {
      const prevTime = seenExact.get(exactFingerprint);
      if (Math.abs(timestamp - prevTime) < 15000) {
        return; // Skip duplicate within 15s
      }
    }
    seenExact.set(exactFingerprint, timestamp);

    // 3. Student Join / Leave Noise Filtering
    if (regNo && (eventType === "STUDENT_JOINED" || eventType === "STUDENT_LEFT")) {
      const lastState = lastEventByStudent.get(regNo);

      if (lastState) {
        const timeDiffMs = timestamp - lastState.timestamp;

        // Skip consecutive identical events within 30 seconds (e.g. repeated JOINED without LEAVING)
        if (lastState.eventType === eventType && timeDiffMs < 30000) {
          return;
        }

        // Handle rapid Disconnect (Timeout) -> Reconnect ping-pong flicker within 20 seconds
        if (lastState.eventType === "STUDENT_LEFT" && eventType === "STUDENT_JOINED" && timeDiffMs < 20000) {
          // If the last left event was just added and student immediately reconnected within 20s,
          // remove the transient left event from deduped array to prevent timeline noise
          if (deduped.length > 0 && deduped[deduped.length - 1].metadata?.registerNumber?.toUpperCase() === regNo && deduped[deduped.length - 1].eventType === "STUDENT_LEFT") {
            deduped.pop();
          }
        }
      }

      lastEventByStudent.set(regNo, { eventType, timestamp });
    }

    deduped.push(normalizedEvent);
  });

  return deduped;
}

module.exports = {
  dedupeResults,
  dedupeTimelineEvents,
  normalizeTimelineEvents: dedupeTimelineEvents,
  summarizeAttendances,
};