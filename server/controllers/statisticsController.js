const Session = require("../models/Session");
const Doubt = require("../models/Doubt");
const Result = require("../models/Result");

async function getSessionStatistics(req, res) {
  try {
    const { sessionCode } = req.params;

    const session = await Session.findOne({ sessionCode });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Parallel MongoDB queries for Doubts & Quiz Results
    const [doubts, quizResults] = await Promise.all([
      Doubt.find({ sessionCode }),
      Result.find({ sessionCode }),
    ]);

    // Doubts metrics
    const totalDoubts = doubts.length;
    const pendingDoubts = doubts.filter((d) => d.status === "Pending").length;
    const answeredDoubts = doubts.filter((d) => d.status === "Answered").length;
    const answeredRate = totalDoubts > 0 ? Number(((answeredDoubts / totalDoubts) * 100).toFixed(1)) : 0;

    // Unique Students Joined (from Doubts & Results)
    const uniqueStudentsSet = new Set();
    doubts.forEach((d) => {
      if (d.studentName) uniqueStudentsSet.add(d.studentName);
    });
    quizResults.forEach((r) => {
      if (r.studentName) uniqueStudentsSet.add(r.studentName);
    });
    const studentsJoined = uniqueStudentsSet.size;

    // Quiz metrics
    const quizAttempts = quizResults.length;

    let totalScoreSum = 0;
    let highestScore = { studentName: "N/A", score: 0, percentage: 0 };

    if (quizAttempts > 0) {
      let maxPct = -1;

      quizResults.forEach((r) => {
        const totalQ = r.totalQuestions || 5;
        const pct = totalQ > 0 ? (r.score / totalQ) * 100 : r.score;
        totalScoreSum += pct;

        if (pct > maxPct) {
          maxPct = pct;
          highestScore = {
            studentName: r.studentName,
            score: r.score,
            percentage: Number(pct.toFixed(1)),
          };
        }
      });
    }

    const averageScore = quizAttempts > 0 ? Number((totalScoreSum / quizAttempts).toFixed(1)) : 0;
    const quizParticipationRate = studentsJoined > 0 ? Number(((quizAttempts / studentsJoined) * 100).toFixed(1)) : 0;

    // Score distribution calculation for Bar Chart (5 ranges: 0-20%, 21-40%, 41-60%, 61-80%, 81-100%)
    const distBuckets = { "0-20%": 0, "21-40%": 0, "41-60%": 0, "61-80%": 0, "81-100%": 0 };

    quizResults.forEach((r) => {
      const totalQ = r.totalQuestions || 5;
      const pct = totalQ > 0 ? (r.score / totalQ) * 100 : r.score;
      if (pct <= 20) distBuckets["0-20%"]++;
      else if (pct <= 40) distBuckets["21-40%"]++;
      else if (pct <= 60) distBuckets["41-60%"]++;
      else if (pct <= 80) distBuckets["61-80%"]++;
      else distBuckets["81-100%"]++;
    });

    const scoreDistribution = Object.keys(distBuckets).map((range) => ({
      range,
      count: distBuckets[range],
    }));

    // Timeline Activity calculation for Line Chart (chronological activity points)
    const timelineEvents = [];

    doubts.forEach((d) => {
      if (d.createdAt) {
        timelineEvents.push({
          time: new Date(d.createdAt),
          type: "doubt",
        });
      }
    });

    quizResults.forEach((r) => {
      if (r.submittedAt) {
        timelineEvents.push({
          time: new Date(r.submittedAt),
          type: "quiz",
        });
      }
    });

    // Sort timeline by time ascending
    timelineEvents.sort((a, b) => a.time - b.time);

    // Group timeline events into time slots
    const timeSlotCounts = {};
    timelineEvents.forEach((ev) => {
      const timeString = ev.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      timeSlotCounts[timeString] = (timeSlotCounts[timeString] || 0) + 1;
    });

    const joinsOverTime = Object.keys(timeSlotCounts).map((time) => ({
      time,
      count: timeSlotCounts[time],
    }));

    // Fallback default timeline if no activity yet
    if (joinsOverTime.length === 0) {
      const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      joinsOverTime.push({ time: nowStr, count: 0 });
    }

    return res.status(200).json({
      sessionName: session.sessionName,
      subject: session.subject,
      sessionCode: session.sessionCode,
      status: session.isActive ? "Active" : "Closed",
      studentsJoined,
      totalDoubts,
      pendingDoubts,
      answeredDoubts,
      answeredRate,
      quizAttempts,
      quizParticipationRate,
      averageScore,
      highestScore,
      scoreDistribution,
      joinsOverTime,
      duration: session.duration,
      createdAt: session.createdAt,
      closedAt: session.closedAt,
      teacherName: session.teacherName,
    });

  } catch (error) {
    console.error("Error in getSessionStatistics:", error);
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getSessionStatistics,
};
