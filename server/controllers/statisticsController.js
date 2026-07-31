const Session = require("../models/Session");
const Doubt = require("../models/Doubt");
const Result = require("../models/Result");
const Attendance = require("../models/Attendance");

async function getSessionStatistics(req, res) {
  try {
    const { sessionCode } = req.params;
    const code = sessionCode.toUpperCase();

    const session = await Session.findOne({ sessionCode: code });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Parallel MongoDB queries
    const [doubts, quizResults, attendances] = await Promise.all([
      Doubt.find({ sessionCode: code }),
      Result.find({ sessionCode: code }),
      Attendance.find({ sessionCode: code }),
    ]);

    // Doubts metrics
    const totalDoubts = doubts.length;
    const pendingDoubts = doubts.filter((d) => d.status === "Pending").length;
    const answeredDoubts = doubts.filter((d) => d.status === "Answered").length;
    const answeredRate = totalDoubts > 0 ? Number(((answeredDoubts / totalDoubts) * 100).toFixed(1)) : 0;

    const manualAnswers = doubts.filter((d) => d.status === "Answered" && d.teacherName !== "AI Assistant").length;
    const aiAnswers = doubts.filter((d) => d.status === "Answered" && d.teacherName === "AI Assistant").length;

    // Student counts & Attendance
    const studentsPresent = attendances.filter((a) => a.status === "Joined").length;
    const studentsLeft = attendances.filter((a) => a.status === "Left").length;

    const uniqueStudentsSet = new Set();
    attendances.forEach((a) => uniqueStudentsSet.add(a.registerNumber || a.fullName));
    doubts.forEach((d) => {
      if (d.registerNumber || d.studentName) uniqueStudentsSet.add(d.registerNumber || d.studentName);
    });
    quizResults.forEach((r) => {
      if (r.registerNumber || r.studentName) uniqueStudentsSet.add(r.registerNumber || r.studentName);
    });
    const studentsJoined = uniqueStudentsSet.size;

    let totalAttendanceTimeMin = 0;
    attendances.forEach((a) => {
      totalAttendanceTimeMin += a.totalDuration || (a.leaveTime ? Math.round((a.leaveTime - a.joinTime) / 60000) : 0);
    });
    const avgAttendanceTime = attendances.length > 0 ? Number((totalAttendanceTimeMin / attendances.length).toFixed(1)) : 0;
    const attendancePercentage = studentsJoined > 0 ? Number(((studentsPresent / studentsJoined) * 100).toFixed(1)) : 0;

    // Doubts by Student (Most Doubts Asked & Most Active)
    const studentDoubtCounts = {};
    doubts.forEach((d) => {
      const name = d.studentName || "Anonymous";
      studentDoubtCounts[name] = (studentDoubtCounts[name] || 0) + 1;
    });

    let mostDoubtsAsked = { studentName: "N/A", count: 0 };
    Object.keys(studentDoubtCounts).forEach((name) => {
      if (studentDoubtCounts[name] > mostDoubtsAsked.count) {
        mostDoubtsAsked = { studentName: name, count: studentDoubtCounts[name] };
      }
    });

    // Quiz metrics
    const quizAttempts = quizResults.length;
    let totalScoreSum = 0;
    let highestScore = { studentName: "N/A", score: 0, percentage: 0 };
    let lowestScore = { studentName: "N/A", score: 0, percentage: 0 };

    if (quizAttempts > 0) {
      let maxPct = -1;
      let minPct = 999;

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
        if (pct < minPct) {
          minPct = pct;
          lowestScore = {
            studentName: r.studentName,
            score: r.score,
            percentage: Number(pct.toFixed(1)),
          };
        }
      });
    }

    const averageScore = quizAttempts > 0 ? Number((totalScoreSum / quizAttempts).toFixed(1)) : 0;
    const quizParticipationRate = studentsJoined > 0 ? Number(((quizAttempts / studentsJoined) * 100).toFixed(1)) : 0;

    // Score distribution calculation
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

    // Joins over time
    const joinsOverTime = [];
    const timeSlotCounts = {};
    attendances.forEach((a) => {
      if (a.joinTime) {
        const timeString = new Date(a.joinTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        timeSlotCounts[timeString] = (timeSlotCounts[timeString] || 0) + 1;
      }
    });
    Object.keys(timeSlotCounts).forEach((time) => {
      joinsOverTime.push({ time, count: timeSlotCounts[time] });
    });
    if (joinsOverTime.length === 0) {
      joinsOverTime.push({ time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), count: 0 });
    }

    return res.status(200).json({
      sessionName: session.sessionName,
      subject: session.subject,
      sessionCode: session.sessionCode,
      status: session.isActive ? "Active" : "Closed",
      studentsJoined,
      studentsPresent,
      studentsLeft,
      attendancePercentage,
      avgAttendanceTime,
      totalDoubts,
      pendingDoubts,
      answeredDoubts,
      answeredRate,
      manualAnswers,
      aiAnswers,
      mostDoubtsAsked,
      quizAttempts,
      quizParticipationRate,
      averageScore,
      highestScore,
      lowestScore,
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
