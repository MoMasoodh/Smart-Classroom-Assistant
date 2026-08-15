import { useEffect, useState } from "react";
import api from "../services/api";
import LiveStudentList from "./LiveStudentList";
import SessionTimeline from "./SessionTimeline";
import DoubtCard from "./DoubtCard";
import VoicePlayer from "./VoicePlayer";
import { formatDate, formatTime } from "../utils/dateUtils";
import { exportAttendanceReport, exportLeaderboardReport, exportToCSV, exportToPDF } from "../utils/exportUtils";
import {
  X,
  BookOpen,
  Users,
  Trophy,
  HelpCircle,
  Clock,
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Calendar,
  Mic,
} from "lucide-react";
import "./SessionDetailModal.css";

function SessionDetailModal({ sessionCode, onClose }) {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'attendance' | 'leaderboard' | 'doubts' | 'timeline'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionCode) return;
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/history/session-details/${sessionCode}`);
        setData(res.data);
      } catch (err) {
        console.error("Error loading session details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [sessionCode]);

  if (!sessionCode) return null;

  const session = data?.session;
  const attendances = data?.attendances || [];
  const doubts = data?.doubts || [];
  const results = data?.results || [];
  const timelineEvents = data?.timelineEvents || [];

  const exportFullSessionPDF = () => {
    if (!session) return;
    const headers = ["Student Name", "Reg No", "Status", "Join Time", "Duration (min)"];
    const rows = attendances.map((a) => [
      a.fullName,
      a.registerNumber || "—",
      a.status,
      a.joinTime ? formatTime(a.joinTime) : "—",
      a.totalDuration || 0,
    ]);
    exportToPDF(
      `Classroom Session Report — ${session.sessionName} (${session.sessionCode})`,
      headers,
      rows,
      `SessionReport_${session.sessionCode}`
    );
  };

  const answeredDoubtsCount = doubts.filter((d) => d.status === "Answered").length;
  const voiceDoubtsCount = doubts.filter((d) => d.type === "voice").length;

  return (
    <div className="modal-backdrop fade-in">
      <div className="session-detail-modal hero-card" style={{ maxWidth: "900px", width: "95%" }}>
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
          <div>
            <span className="eyebrow">Classroom Session Detailed Report</span>
            <h2 style={{ margin: "0.25rem 0 0.15rem", fontSize: "1.4rem" }}>
              {session?.sessionName || sessionCode} • {session?.subject}
            </h2>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.88rem" }}>
              PIN: <strong style={{ fontFamily: "monospace" }}>{sessionCode}</strong> • Teacher: {session?.teacherName} • Created: {formatDate(session?.createdAt)}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button className="secondary" onClick={exportFullSessionPDF} title="Download PDF Report">
              <Download size={15} /> PDF Report
            </button>
            <button className="icon-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="modal-tabs" style={{ display: "flex", gap: "0.5rem", padding: "0.75rem 0", borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
          <button
            className={`modal-tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <BarChart3 size={15} /> Overview
          </button>
          <button
            className={`modal-tab ${activeTab === "attendance" ? "active" : ""}`}
            onClick={() => setActiveTab("attendance")}
          >
            <Users size={15} /> Roster & Attendance ({attendances.length})
          </button>
          <button
            className={`modal-tab ${activeTab === "leaderboard" ? "active" : ""}`}
            onClick={() => setActiveTab("leaderboard")}
          >
            <Trophy size={15} /> Leaderboard ({results.length})
          </button>
          <button
            className={`modal-tab ${activeTab === "doubts" ? "active" : ""}`}
            onClick={() => setActiveTab("doubts")}
          >
            <HelpCircle size={15} /> Doubts ({doubts.length})
          </button>
          <button
            className={`modal-tab ${activeTab === "timeline" ? "active" : ""}`}
            onClick={() => setActiveTab("timeline")}
          >
            <Clock size={15} /> Timeline ({timelineEvents.length})
          </button>
        </div>

        <div className="modal-body" style={{ padding: "1.25rem 0 0" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              Loading complete session analytics...
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <div className="tab-content fade-in">
                  <div className="overview-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                    <div className="stat-card hero-card" style={{ padding: "1.25rem" }}>
                      <span className="eyebrow">Students Joined</span>
                      <h3 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0" }}>{attendances.length}</h3>
                    </div>
                    <div className="stat-card hero-card" style={{ padding: "1.25rem" }}>
                      <span className="eyebrow">Total Doubts Asked</span>
                      <h3 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0" }}>{doubts.length}</h3>
                      <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{answeredDoubtsCount} Answered • {voiceDoubtsCount} Voice</span>
                    </div>
                    <div className="stat-card hero-card" style={{ padding: "1.25rem" }}>
                      <span className="eyebrow">Quiz Submissions</span>
                      <h3 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0" }}>{results.length}</h3>
                    </div>
                    <div className="stat-card hero-card" style={{ padding: "1.25rem" }}>
                      <span className="eyebrow">Session Status</span>
                      <h3 style={{ fontSize: "1.4rem", margin: "0.4rem 0 0", color: session?.isActive ? "var(--success)" : "var(--text-muted)" }}>
                        {session?.isActive ? "Active Live" : "Completed Archive"}
                      </h3>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "attendance" && (
                <div className="tab-content fade-in">
                  <LiveStudentList sessionCode={sessionCode} />
                </div>
              )}

              {activeTab === "leaderboard" && (
                <div className="tab-content fade-in">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3>Quiz Leaderboard</h3>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button className="secondary" onClick={() => exportLeaderboardReport(sessionCode, results, "csv")}>
                        <Download size={14} /> CSV
                      </button>
                      <button className="secondary" onClick={() => exportLeaderboardReport(sessionCode, results, "excel")}>
                        <FileSpreadsheet size={14} /> Excel
                      </button>
                    </div>
                  </div>

                  {results.length === 0 ? (
                    <div className="empty-state">No quiz submissions recorded yet.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Student Name</th>
                            <th>Score</th>
                            <th>Percentage</th>
                            <th>Submitted At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((r, i) => (
                            <tr key={r._id || i}>
                              <td>#{i + 1}</td>
                              <td>{r.studentName} {r.registerNumber ? `(${r.registerNumber})` : ""}</td>
                              <td>{r.score} / {r.totalQuestions}</td>
                              <td>{((r.score / (r.totalQuestions || 1)) * 100).toFixed(1)}%</td>
                              <td>{formatTime(r.submittedAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "doubts" && (
                <div className="tab-content fade-in">
                  <h3 style={{ marginBottom: "1rem" }}>Doubts & Explanations ({doubts.length})</h3>
                  {doubts.length === 0 ? (
                    <div className="empty-state">No doubts asked during this session.</div>
                  ) : (
                    <div className="doubts-list" style={{ display: "grid", gap: "1rem" }}>
                      {doubts.map((d) => (
                        <DoubtCard key={d._id} doubt={d} readOnly={true} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "timeline" && (
                <div className="tab-content fade-in">
                  <SessionTimeline sessionCode={sessionCode} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SessionDetailModal;
