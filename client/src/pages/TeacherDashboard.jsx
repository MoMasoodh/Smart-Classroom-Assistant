import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DashboardCard from "../components/DashboardCard";
import SessionDetailModal from "../components/SessionDetailModal";
import Skeleton from "../components/Skeleton";
import { getStoredSessions } from "../services/storage";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { formatDate } from "../utils/dateUtils";
import {
  PlusCircle,
  BookOpen,
  Compass,
  HelpCircle,
  BarChart3,
  LogOut,
  Sparkles,
  Radio,
  History,
  Users,
  ChevronRight,
} from "lucide-react";
import "./TeacherDashboard.css";

function TeacherDashboard() {
  const navigate = useNavigate();
  const { teacher, logout } = useAuth();
  const teacherName = teacher?.fullName || "Teacher";

  const [sessions, setSessions] = useState(() => {
    return getStoredSessions().filter((s) => s.teacherId === teacher?.id);
  });
  const [recentAnalytics, setRecentAnalytics] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedSessionCode, setSelectedSessionCode] = useState(null);

  const loadSessions = async () => {
    try {
      const response = await api.get("/sessions/my-sessions");
      setSessions(response.data);
    } catch {
      // Fallback to local storage on error
    }
  };

  const loadRecentHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get("/history/teacher?limit=4");
      setRecentAnalytics(res.data || []);
    } catch (err) {
      console.error("Error loading recent teacher history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadSessions();
    loadRecentHistory();
    const timer = setInterval(() => {
      loadSessions();
      loadRecentHistory();
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const activeSessions = sessions.filter(
    (session) =>
      session.isActive !== false &&
      new Date(session.expiresAt) > new Date()
  );

  const latestSession = sessions.length > 0 ? sessions[0] : null;

  const openLatestSession = () => {
    if (!latestSession) {
      navigate("/my-sessions");
      return;
    }

    navigate("/manage-session", {
      state: {
        session: latestSession,
      },
    });
  };

  return (
    <div className="app-page">
      <Sidebar teacher />

      <div className="content-with-sidebar">
        <Header
          title="Teacher Dashboard"
          subtitle={`Welcome back, ${teacherName}`}
          actions={
            <>
              <button
                className="primary-button"
                onClick={() => navigate("/create-session")}
              >
                <PlusCircle size={18} />
                Create Session
              </button>
              <button
                className="secondary"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                <LogOut size={18} />
                Logout
              </button>
            </>
          }
        />

        <main className="page-shell fade-in">
          <section className="hero-card page-hero" style={{ marginBottom: "1.5rem" }}>
            <div>
              <span className="eyebrow">
                <Sparkles size={14} /> Teaching Workspace Overview
              </span>
              <h2 style={{ margin: "0.75rem 0 0.35rem", fontSize: "1.5rem" }}>
                Manage live sessions, student doubts, and AI quizzes.
              </h2>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>
                Keep your classroom engaging with instant QR session codes, real-time doubt resolution, and automated analytics.
              </p>
            </div>

            <div className="field-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
              <div className="hero-stat">
                <strong>{sessions.length}</strong>
                <span>Total Sessions</span>
              </div>
              <div className="hero-stat" style={{ borderLeft: "3px solid var(--success)" }}>
                <strong style={{ color: "var(--success)" }}>{activeSessions.length}</strong>
                <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Radio size={12} style={{ color: "var(--success)" }} /> Active Live
                </span>
              </div>
            </div>
          </section>

          <div className="dashboard-grid">
            <DashboardCard
              icon={<PlusCircle size={26} />}
              title="Create Session"
              description="Launch a new classroom session and generate printable QR code & session PIN."
              onClick={() => navigate("/create-session")}
            />

            <DashboardCard
              icon={<BookOpen size={26} />}
              title="My Sessions"
              description="View, manage, inspect rosters, and close classroom sessions created by you."
              onClick={() => navigate("/my-sessions")}
              footer={
                <span className="status-pill active">
                  {sessions.length} Sessions Saved
                </span>
              }
            />

            <DashboardCard
              icon={<Compass size={26} />}
              title="Manage Latest Session"
              description="Jump directly into your most recently created classroom session."
              onClick={openLatestSession}
              footer={
                latestSession ? (
                  <span className="status-pill active">
                    PIN: {latestSession.sessionCode}
                  </span>
                ) : (
                  <span className="status-pill pending">No Active Session</span>
                )
              }
            />

            <DashboardCard
              icon={<HelpCircle size={26} />}
              title="Pending Doubts"
              description="Review, answer, and provide AI-generated explanations for unanswered student doubts."
              onClick={() => navigate("/pending-doubts")}
            />

            <DashboardCard
              icon={<BarChart3 size={26} />}
              title="Statistics"
              description="Review real-time classroom analytics, doubt resolution rates, and quiz scores."
              onClick={() => navigate("/statistics")}
            />

            <DashboardCard
              icon={<LogOut size={26} />}
              title="Logout"
              description="Safely end your teacher session and return to the application landing page."
              onClick={() => {
                logout();
                navigate("/");
              }}
            />
          </div>

          {/* Teacher Dashboard Recent Sessions Section */}
          <section className="recent-teacher-sessions" style={{ marginTop: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <History size={20} style={{ color: "var(--primary)" }} />
                <h3 style={{ margin: 0, fontSize: "1.25rem" }}>Recent Classroom Sessions</h3>
              </div>

              <button
                className="secondary"
                onClick={() => navigate("/teacher-history")}
                style={{ fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
              >
                View All Sessions <ChevronRight size={16} />
              </button>
            </div>

            {loadingHistory ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                <Skeleton height="140px" radius="16px" />
                <Skeleton height="140px" radius="16px" />
              </div>
            ) : recentAnalytics.length === 0 ? (
              <div className="hero-card empty-state" style={{ textAlign: "center", padding: "2rem" }}>
                <BookOpen size={36} style={{ opacity: 0.5, marginBottom: "0.75rem" }} />
                <h4>No classroom sessions created yet</h4>
                <p style={{ margin: "0.25rem 0 1rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                  Create your first classroom session to start teaching and tracking student doubts.
                </p>
                <button className="primary-button" onClick={() => navigate("/create-session")}>
                  <PlusCircle size={16} /> Create Session
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                {recentAnalytics.map(({ session, analytics }) => (
                  <div
                    key={session._id}
                    className="history-card hero-card clickable-card"
                    style={{ padding: "1.25rem", cursor: "pointer" }}
                    onClick={() => setSelectedSessionCode(session.sessionCode)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <div>
                        <span className="eyebrow">{session.subject}</span>
                        <h4 style={{ margin: "0.2rem 0 0.1rem", fontSize: "1.1rem" }}>{session.sessionName}</h4>
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          PIN: <strong style={{ fontFamily: "monospace" }}>{session.sessionCode}</strong>
                        </p>
                      </div>

                      <span className={`status-pill ${session.isActive ? "active" : "closed"}`}>
                        {session.isActive ? "Active Live" : "Completed"}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: "0.5rem",
                        marginTop: "0.85rem",
                        background: "var(--bg-surface)",
                        padding: "0.6rem 0.85rem",
                        borderRadius: "10px",
                        fontSize: "0.82rem",
                      }}
                    >
                      <div>
                        <span style={{ display: "block", color: "var(--text-muted)" }}>Date</span>
                        <strong>{formatDate(session.createdAt)}</strong>
                      </div>
                      <div>
                        <span style={{ display: "block", color: "var(--text-muted)" }}>Students</span>
                        <strong>{analytics.studentsJoined || 0} Joined</strong>
                      </div>
                      <div>
                        <span style={{ display: "block", color: "var(--text-muted)" }}>Doubts</span>
                        <strong>{analytics.totalDoubts || 0}</strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.25rem", marginTop: "0.75rem", fontSize: "0.82rem", color: "var(--primary)", fontWeight: 600 }}>
                      View Details <ChevronRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {selectedSessionCode && (
        <SessionDetailModal sessionCode={selectedSessionCode} onClose={() => setSelectedSessionCode(null)} />
      )}
    </div>
  );
}

export default TeacherDashboard;