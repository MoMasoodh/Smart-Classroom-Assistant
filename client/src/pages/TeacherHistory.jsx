import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import SessionDetailModal from "../components/SessionDetailModal";
import Skeleton from "../components/Skeleton";
import api from "../services/api";
import { formatDate, isThisWeek, isThisMonth } from "../utils/dateUtils";
import "./StudentHistory.css";
import {
  BookOpen,
  Calendar,
  Users,
  Trophy,
  HelpCircle,
  FileText,
  ChevronRight,
  Search,
  Award,
  Clock,
  Radio,
} from "lucide-react";

function TeacherHistory() {
  const [sessionsData, setSessionsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all' | 'active' | 'completed'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSessionCode, setSelectedSessionCode] = useState(null);

  useEffect(() => {
    fetchTeacherHistory();
  }, []);

  const fetchTeacherHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get("/history/teacher");
      setSessionsData(res.data || []);
    } catch (err) {
      console.error("Error fetching teacher session history:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessionsData.filter(({ session, analytics }) => {
    // Status filter
    if (filter === "active" && !session.isActive) return false;
    if (filter === "completed" && session.isActive) return false;

    // Search query filter
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchName = session.sessionName?.toLowerCase().includes(q);
      const matchSubject = session.subject?.toLowerCase().includes(q);
      const matchCode = session.sessionCode?.toLowerCase().includes(q);
      if (!matchName && !matchSubject && !matchCode) return false;
    }

    return true;
  });

  return (
    <div className="app-page">
      <Sidebar teacher />

      <div className="content-with-sidebar">
        <Header
          title="Teacher Session History"
          subtitle="Recent, Archived, and Completed classroom session analytics reports"
        />

        <main className="page-shell fade-in">
          {/* Controls Bar: Search & Status Filters */}
          <div
            className="history-controls-bar"
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <div className="search-box" style={{ position: "relative", minWidth: "260px", flex: 1, maxWidth: "400px" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "0.85rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                type="text"
                placeholder="Search sessions or PIN codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: "2.4rem", width: "100%" }}
              />
            </div>

            <div className="filter-pill-group">
              <button
                className={`filter-pill ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                All ({sessionsData.length})
              </button>
              <button
                className={`filter-pill ${filter === "active" ? "active" : ""}`}
                onClick={() => setFilter("active")}
              >
                Active Live ({sessionsData.filter((s) => s.session.isActive).length})
              </button>
              <button
                className={`filter-pill ${filter === "completed" ? "active" : ""}`}
                onClick={() => setFilter("completed")}
              >
                Completed ({sessionsData.filter((s) => !s.session.isActive).length})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="history-grid" style={{ display: "grid", gap: "1rem" }}>
              <Skeleton height="180px" radius="16px" />
              <Skeleton height="180px" radius="16px" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="hero-card empty-state" style={{ textAlign: "center", padding: "3.5rem 1.5rem" }}>
              <BookOpen size={48} style={{ opacity: 0.5, marginBottom: "1rem", color: "var(--primary)" }} />
              <h3>Create your first classroom session to start teaching</h3>
              <p style={{ color: "var(--text-muted)", maxWidth: "450px", margin: "0.5rem auto 1.5rem" }}>
                {searchQuery || filter !== "all"
                  ? "No classroom sessions match your filter criteria."
                  : "Launch a new session to record student attendance, live doubts, and real-time AI quiz submissions."}
              </p>
              {searchQuery || filter !== "all" ? (
                <button className="secondary" onClick={() => { setSearchQuery(""); setFilter("all"); }}>
                  Clear Filters
                </button>
              ) : null}
            </div>
          ) : (
            <div className="history-grid">
              {filteredSessions.map(({ session, analytics }) => (
                <div
                  key={session._id}
                  className="history-card hero-card clickable-card"
                  onClick={() => setSelectedSessionCode(session.sessionCode)}
                  style={{ padding: "1.5rem" }}
                >
                  <div className="history-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <span className="eyebrow">{session.subject}</span>
                      <h3 style={{ margin: "0.25rem 0 0.15rem", fontSize: "1.25rem" }}>{session.sessionName}</h3>
                      <p className="teacher-sub" style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>
                        PIN: <strong style={{ fontFamily: "monospace" }}>{session.sessionCode}</strong> • Duration: {session.duration || 60} min
                      </p>
                    </div>

                    <span className={`status-pill ${session.isActive ? "active" : "closed"}`}>
                      {session.isActive ? (
                        <>
                          <Radio size={12} /> Active Live
                        </>
                      ) : (
                        "Completed"
                      )}
                    </span>
                  </div>

                  <div
                    className="history-meta-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                      gap: "1rem",
                      marginTop: "1.25rem",
                      background: "var(--bg-surface)",
                      padding: "1rem",
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div className="meta-item" style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Date</span>
                      <strong style={{ fontSize: "0.92rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Calendar size={13} /> {formatDate(session.createdAt)}
                      </strong>
                    </div>

                    <div className="meta-item" style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Students</span>
                      <strong style={{ fontSize: "0.92rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Users size={13} /> {analytics.studentsJoined} Students ({analytics.attendancePercentage || 100}%)
                      </strong>
                    </div>

                    <div className="meta-item" style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Doubts</span>
                      <strong style={{ fontSize: "0.92rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <HelpCircle size={13} /> {analytics.totalDoubts} ({analytics.answeredDoubts} Answered)
                      </strong>
                    </div>

                    <div className="meta-item" style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Quiz Attempts</span>
                      <strong style={{ fontSize: "0.92rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <FileText size={13} /> {analytics.quizAttempts} Attempts
                      </strong>
                    </div>

                    <div className="meta-item" style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Average Score</span>
                      <strong style={{ fontSize: "0.92rem", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Trophy size={13} /> {analytics.averageScore}% (High: {analytics.highestScore}%)
                      </strong>
                    </div>
                  </div>

                  <div
                    className="history-card-footer"
                    style={{
                      display: "flex",
                      justify: "space-between",
                      alignItems: "center",
                      marginTop: "1rem",
                      fontSize: "0.85rem",
                      color: "var(--primary)",
                      fontWeight: 600,
                    }}
                  >
                    <span>Click for full report breakdown & student roster</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedSessionCode && (
            <SessionDetailModal sessionCode={selectedSessionCode} onClose={() => setSelectedSessionCode(null)} />
          )}
        </main>
      </div>
    </div>
  );
}

export default TeacherHistory;
