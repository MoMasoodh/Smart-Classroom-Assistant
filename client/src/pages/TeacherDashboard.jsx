import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DashboardCard from "../components/DashboardCard";
import { getStoredSessions } from "../services/storage";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import api from "../services/api";
import {
  PlusCircle,
  BookOpen,
  Compass,
  HelpCircle,
  BarChart3,
  LogOut,
  Sparkles,
  Radio,
} from "lucide-react";
import "./TeacherDashboard.css";

function TeacherDashboard() {
  const navigate = useNavigate();
  const { teacher, logout } = useAuth();
  const teacherName = teacher?.fullName || "Teacher";

  const [sessions, setSessions] = useState(() => {
    return getStoredSessions().filter((s) => s.teacherId === teacher?.id);
  });

  const loadSessions = async () => {
    try {
      const response = await api.get("/sessions/my-sessions");
      setSessions(response.data);
    } catch {
      // Fallback to local storage on error
    }
  };

  useEffect(() => {
    loadSessions();
    const timer = setInterval(loadSessions, 15000);
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
        </main>
      </div>
    </div>
  );
}

export default TeacherDashboard;