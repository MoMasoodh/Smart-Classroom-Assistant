import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import SessionDetailModal from "../components/SessionDetailModal";
import Skeleton from "../components/Skeleton";
import api from "../services/api";
import { formatDate, formatTime, isThisWeek, isThisMonth } from "../utils/dateUtils";
import {
  BookOpen,
  Calendar,
  Clock,
  Trophy,
  HelpCircle,
  FileText,
  ChevronRight,
  Award,
  Search,
  CheckCircle,
  Filter,
} from "lucide-react";
import "./StudentHistory.css";

function StudentHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all"); // 'all' | 'week' | 'month' | 'older'
  const [selectedSessionCode, setSelectedSessionCode] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get("/history/student");
      setHistory(res.data || []);
    } catch (err) {
      console.error("Error fetching student session history:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter((item) => {
    // Search query filter
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchName = item.sessionName?.toLowerCase().includes(q);
      const matchSubject = item.subject?.toLowerCase().includes(q);
      const matchTeacher = item.teacherName?.toLowerCase().includes(q);
      const matchCode = item.sessionCode?.toLowerCase().includes(q);
      if (!matchName && !matchSubject && !matchTeacher && !matchCode) return false;
    }

    // Time filter
    if (timeFilter === "week") {
      return isThisWeek(item.createdAt || item.joinTime);
    }
    if (timeFilter === "month") {
      return isThisMonth(item.createdAt || item.joinTime);
    }
    if (timeFilter === "older") {
      return !isThisWeek(item.createdAt || item.joinTime) && !isThisMonth(item.createdAt || item.joinTime);
    }

    return true;
  });

  return (
    <div className="app-page">
      <Sidebar />

      <div className="content-with-sidebar">
        <Header
          title="My Session History"
          subtitle="View all classroom sessions you have attended and your academic performance report"
        />

        <main className="page-shell fade-in">
          {/* Controls Bar: Search & Time Filters */}
          <div className="history-controls-bar" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            <div className="search-box" style={{ position: "relative", minWidth: "260px", flex: 1, maxWidth: "400px" }}>
              <Search size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search sessions, subjects, or teachers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: "2.4rem", width: "100%" }}
              />
            </div>

            <div className="filter-pill-group">
              <button className={`filter-pill ${timeFilter === "all" ? "active" : ""}`} onClick={() => setTimeFilter("all")}>
                All ({history.length})
              </button>
              <button className={`filter-pill ${timeFilter === "week" ? "active" : ""}`} onClick={() => setTimeFilter("week")}>
                This Week
              </button>
              <button className={`filter-pill ${timeFilter === "month" ? "active" : ""}`} onClick={() => setTimeFilter("month")}>
                This Month
              </button>
              <button className={`filter-pill ${timeFilter === "older" ? "active" : ""}`} onClick={() => setTimeFilter("older")}>
                Older
              </button>
            </div>
          </div>

          {loading ? (
            <div className="history-grid" style={{ display: "grid", gap: "1rem" }}>
              <Skeleton height="160px" radius="16px" />
              <Skeleton height="160px" radius="16px" />
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="hero-card empty-state" style={{ textAlign: "center", padding: "3.5rem 1.5rem" }}>
              <BookOpen size={48} style={{ opacity: 0.5, marginBottom: "1rem", color: "var(--primary)" }} />
              <h3>📚 No sessions found</h3>
              <p style={{ color: "var(--text-muted)", maxWidth: "450px", margin: "0.5rem auto 1.5rem" }}>
                {searchQuery || timeFilter !== "all"
                  ? "No attended sessions match your search criteria or filter."
                  : "Join a live classroom session with your teacher's session code and your learning history will appear here."}
              </p>
              {searchQuery || timeFilter !== "all" ? (
                <button className="secondary" onClick={() => { setSearchQuery(""); setTimeFilter("all"); }}>
                  Clear Filters
                </button>
              ) : null}
            </div>
          ) : (
            <div className="history-grid">
              {filteredHistory.map((item) => (
                <div
                  key={item.id || item.sessionCode}
                  className="history-card hero-card clickable-card"
                  onClick={() => setSelectedSessionCode(item.sessionCode)}
                  style={{ padding: "1.5rem" }}
                >
                  <div className="history-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <span className="eyebrow">{item.subject || "Subject"}</span>
                      <h3 style={{ margin: "0.25rem 0 0.15rem", fontSize: "1.25rem" }}>{item.sessionName}</h3>
                      <p className="teacher-sub" style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>
                        Teacher: <strong>{item.teacherName}</strong> • PIN: <span style={{ fontFamily: "monospace" }}>{item.sessionCode}</span>
                      </p>
                    </div>

                    <span className={`status-pill ${item.status === "Active" ? "active" : "closed"}`}>
                      {item.status}
                    </span>
                  </div>

                  <div
                    className="history-meta-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                      gap: "1rem",
                      marginTop: "1.25rem",
                      background: "var(--bg-surface)",
                      padding: "1rem",
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div className="meta-item" style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Date & Time</span>
                      <strong style={{ fontSize: "0.92rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Calendar size={13} /> {formatDate(item.createdAt)} {item.joinTime ? `• ${formatTime(item.joinTime)}` : ""}
                      </strong>
                    </div>

                    <div className="meta-item" style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Attendance</span>
                      <strong style={{ fontSize: "0.92rem", color: "var(--success)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Clock size={13} /> {item.attendancePercentage || 100}% ({item.attendanceDurationMinutes || 0} min)
                      </strong>
                    </div>

                    <div className="meta-item" style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Quiz Score</span>
                      <strong style={{ fontSize: "0.92rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <FileText size={13} />
                        {item.quizScore !== null ? `${item.quizScore} / ${item.totalQuestions} (${item.quizPercentage}%)` : "Not Attempted"}
                      </strong>
                    </div>

                    {item.rank ? (
                      <div className="meta-item" style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Quiz Rank</span>
                        <strong style={{ fontSize: "0.92rem", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Award size={13} /> Rank #{item.rank}
                        </strong>
                      </div>
                    ) : null}

                    <div className="meta-item" style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Doubts Asked</span>
                      <strong style={{ fontSize: "0.92rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <HelpCircle size={13} /> {item.doubtsAsked || 0} Doubts
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
                    <span>Click to view detailed session report & teacher answers</span>
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

export default StudentHistory;
