import { useEffect, useState } from "react";
import api from "../services/api";
import LiveStudentList from "./LiveStudentList";
import SessionTimeline from "./SessionTimeline";
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
      a.registerNumber,
      a.status,
      a.joinTime ? new Date(a.joinTime).toLocaleTimeString() : "—",
      a.totalDuration || 0,
    ]);
    exportToPDF(
      `Classroom Session Report — ${session.sessionName} (${session.sessionCode})`,
      headers,
      rows,
      `SessionReport_${session.sessionCode}`
    );
  };

  return (
    <div className="modal-backdrop fade-in">
      <div className="session-detail-modal hero-card">
        <div className="modal-header">
          <div>
            <span className="eyebrow">Session Detailed Report</span>
            <h2 style={{ margin: "0.25rem 0 0", fontSize: "1.4rem" }}>
              {session?.sessionName || sessionCode} • {session?.subject}
            </h2>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.88rem" }}>
              PIN: <strong style={{ fontFamily: "monospace" }}>{sessionCode}</strong> • Teacher: {session?.teacherName}
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
        <div className="modal-tabs">
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
            <Users size={15} /> Attendance ({attendances.length})
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

        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              Loading complete session analytics...
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <div className="tab-content fade-in">
                  <div className="overview-stats-grid">
                    <div className="stat-card hero-card">
                      <span className="eyebrow">Students Joined</span>
                      <h3>{attendances.length}</h3>
                    </div>
                    <div className="stat-card hero-card">
                      <span className="eyebrow">Total Doubts</span>
                      <h3>{doubts.length}</h3>
                    </div>
                    <div className="stat-card hero-card">
                      <span className="eyebrow">Quiz Submissions</span>
                      <h3>{results.length}</h3>
                    </div>
                    <div className="stat-card hero-card">
                      <span className="eyebrow">Status</span>
                      <h3 style={{ textTransform: "capitalize" }}>{session?.isActive ? "Active Live" : "Completed"}</h3>
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
                            <th>Reg No</th>
                            <th>Student Name</th>
                            <th>Score</th>
                            <th>Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((r, i) => (
                            <tr key={r._id || i}>
                              <td>#{i + 1}</td>
                              <td style={{ fontFamily: "monospace" }}>{r.registerNumber || "N/A"}</td>
                              <td>{r.studentName}</td>
                              <td>{r.score} / {r.totalQuestions}</td>
                              <td>{((r.score / (r.totalQuestions || 1)) * 100).toFixed(1)}%</td>
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
                  <h3>Doubts & Answers ({doubts.length})</h3>
                  {doubts.length === 0 ? (
                    <div className="empty-state">No doubts asked during this session.</div>
                  ) : (
                    <div className="doubts-list" style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
                      {doubts.map((d) => (
                        <div key={d._id} className="doubt-item hero-card">
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                            <strong>{d.studentName} ({d.registerNumber || "Student"})</strong>
                            <span className={`status-pill ${d.status === "Answered" ? "active" : "pending"}`}>
                              {d.status}
                            </span>
                          </div>
                          <p style={{ margin: "0 0 0.5rem", fontSize: "0.95rem" }}><strong>Q:</strong> {d.question}</p>
                          {d.answer ? (
                            <div style={{ background: "var(--bg-surface)", padding: "0.75rem", borderRadius: "8px", borderLeft: "3px solid var(--primary)" }}>
                              <strong>A ({d.teacherName || "Teacher"}):</strong> {d.answer}
                            </div>
                          ) : null}
                        </div>
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
