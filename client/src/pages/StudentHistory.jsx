import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import SessionDetailModal from "../components/SessionDetailModal";
import api from "../services/api";
import { getStudent } from "../services/storage";
import { BookOpen, Calendar, Clock, Trophy, HelpCircle, FileText, ChevronRight, Award } from "lucide-react";
import "./StudentHistory.css";

function StudentHistory() {
  const loggedInStudent = getStudent();
  const registerNumber = loggedInStudent?.student?.registerNumber;

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionCode, setSelectedSessionCode] = useState(null);

  useEffect(() => {
    if (!registerNumber) {
      setLoading(false);
      return;
    }
    fetchHistory();
  }, [registerNumber]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/history/student/${registerNumber}`);
      setHistory(res.data || []);
    } catch (err) {
      console.error("Error fetching student session history:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page">
      <Sidebar />

      <div className="content-with-sidebar">
        <Header title="My Session History" subtitle="View all classroom sessions you have attended and your performance" />

        <main className="page-shell fade-in">
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              Loading your session history...
            </div>
          ) : history.length === 0 ? (
            <div className="hero-card empty-state" style={{ textAlign: "center", padding: "3rem" }}>
              <BookOpen size={48} style={{ opacity: 0.5, marginBottom: "1rem" }} />
              <h3>No Sessions Attended Yet</h3>
              <p>Join live classroom sessions with your teacher's session code to track attendance and quiz history.</p>
            </div>
          ) : (
            <div className="history-grid">
              {history.map((item) => (
                <div
                  key={item.id || item.sessionCode}
                  className="history-card hero-card clickable-card"
                  onClick={() => setSelectedSessionCode(item.sessionCode)}
                >
                  <div className="history-card-header">
                    <div>
                      <span className="eyebrow">{item.subject || "Subject"}</span>
                      <h3 style={{ margin: "0.25rem 0 0.15rem", fontSize: "1.2rem" }}>{item.sessionName}</h3>
                      <p className="teacher-sub">Teacher: {item.teacherName}</p>
                    </div>

                    <span className={`status-pill ${item.status === "Active" ? "active" : "closed"}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="history-meta-grid">
                    <div className="meta-item">
                      <Calendar size={14} />
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="meta-item">
                      <Clock size={14} />
                      <span>Attended: {item.attendanceDurationMinutes} min</span>
                    </div>

                    <div className="meta-item">
                      <FileText size={14} />
                      <span>
                        Quiz: {item.quizScore !== null ? `${item.quizScore} / ${item.totalQuestions}` : "Not Taken"}
                      </span>
                    </div>

                    {item.rank ? (
                      <div className="meta-item badge-rank">
                        <Award size={14} />
                        <span>Rank: #{item.rank}</span>
                      </div>
                    ) : null}

                    <div className="meta-item">
                      <HelpCircle size={14} />
                      <span>Doubts: {item.doubtsAsked}</span>
                    </div>
                  </div>

                  <div className="history-card-footer">
                    <span>Click to view detailed report</span>
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
