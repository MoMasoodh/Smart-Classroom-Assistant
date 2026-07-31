import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import SessionDetailModal from "../components/SessionDetailModal";
import api from "../services/api";
import { BookOpen, Calendar, Users, Trophy, HelpCircle, FileText, ChevronRight } from "lucide-react";

function TeacherHistory() {
  const [sessionsData, setSessionsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all' | 'active' | 'completed'
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

  const filteredSessions = sessionsData.filter((item) => {
    if (filter === "active") return item.session.isActive;
    if (filter === "completed") return !item.session.isActive;
    return true;
  });

  return (
    <div className="app-page">
      <Sidebar teacher />

      <div className="content-with-sidebar">
        <Header title="Teacher Session History" subtitle="Recent, Archived, and Completed classroom session analytics reports" />

        <main className="page-shell fade-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div className="filter-pill-group">
              <button className={`filter-pill ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
                All Sessions ({sessionsData.length})
              </button>
              <button className={`filter-pill ${filter === "active" ? "active" : ""}`} onClick={() => setFilter("active")}>
                Active Live ({sessionsData.filter((s) => s.session.isActive).length})
              </button>
              <button className={`filter-pill ${filter === "completed" ? "active" : ""}`} onClick={() => setFilter("completed")}>
                Completed ({sessionsData.filter((s) => !s.session.isActive).length})
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              Loading classroom history...
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="hero-card empty-state" style={{ textAlign: "center", padding: "3rem" }}>
              <BookOpen size={48} style={{ opacity: 0.5, marginBottom: "1rem" }} />
              <h3>No Sessions Found</h3>
              <p>Create a classroom session to start managing live doubts, attendance, and quizzes.</p>
            </div>
          ) : (
            <div className="history-grid">
              {filteredSessions.map(({ session, analytics }) => (
                <div
                  key={session._id}
                  className="history-card hero-card clickable-card"
                  onClick={() => setSelectedSessionCode(session.sessionCode)}
                >
                  <div className="history-card-header">
                    <div>
                      <span className="eyebrow">{session.subject}</span>
                      <h3 style={{ margin: "0.25rem 0 0.15rem", fontSize: "1.2rem" }}>{session.sessionName}</h3>
                      <p className="teacher-sub">PIN: <strong style={{ fontFamily: "monospace" }}>{session.sessionCode}</strong></p>
                    </div>

                    <span className={`status-pill ${session.isActive ? "active" : "closed"}`}>
                      {session.isActive ? "Active Live" : "Completed"}
                    </span>
                  </div>

                  <div className="history-meta-grid">
                    <div className="meta-item">
                      <Calendar size={14} />
                      <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="meta-item">
                      <Users size={14} />
                      <span>Joined: {analytics.studentsJoined}</span>
                    </div>

                    <div className="meta-item">
                      <FileText size={14} />
                      <span>Quiz Submissions: {analytics.quizAttempts}</span>
                    </div>

                    <div className="meta-item">
                      <Trophy size={14} />
                      <span>Avg Score: {analytics.averageScore}%</span>
                    </div>

                    <div className="meta-item">
                      <HelpCircle size={14} />
                      <span>Doubts: {analytics.totalDoubts}</span>
                    </div>
                  </div>

                  <div className="history-card-footer">
                    <span>Click for full report breakdown</span>
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
