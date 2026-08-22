import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import {
  UserCheck,
  BookOpen,
  Users,
  HelpCircle,
  Sparkles,
  FileText,
  Trophy,
  BarChart3,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from "lucide-react";

function TeacherProfile() {
  const navigate = useNavigate();
  const { teacher: loggedInTeacher } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loggedInTeacher?.id) {
      setLoading(false);
      return;
    }
    fetchProfile();
  }, [loggedInTeacher?.id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/profile/teacher/${loggedInTeacher.id}`);
      setProfileData(res.data);
    } catch (err) {
      console.error("Error fetching teacher profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const teacher = profileData?.teacher || loggedInTeacher;
  const analytics = profileData?.analytics || {};

  const sessionsCreated = analytics.sessionsCreated || 0;
  const totalStudents = analytics.totalStudentsTaught || 0;
  const doubtsAnswered = analytics.doubtsAnswered || 0;
  const totalDoubts = analytics.totalDoubts || 0;
  const aiAnswers = analytics.aiAnswersGenerated || 0;
  const quizzesCreated = analytics.quizzesCreated || 0;
  const avgClassScore = analytics.avgClassScore || 0;

  const resolutionRate = totalDoubts > 0 ? Math.round((doubtsAnswered / totalDoubts) * 100) : 100;

  return (
    <div className="app-page">
      <Sidebar teacher />

      <div className="content-with-sidebar">
        <Header
          title="Teacher Profile"
          subtitle="Your teaching workspace overview, classroom statistics, and engagement analytics"
        />

        <main className="page-shell fade-in" style={{ display: "grid", gap: "1.5rem" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              Loading teacher profile workspace details...
            </div>
          ) : (
            <>
              {/* Verified Instructor Hero Banner */}
              <section
                className="hero-card page-hero"
                style={{
                  padding: "2rem",
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(16, 185, 129, 0.06) 100%)",
                  border: "1px solid var(--border)",
                  borderRadius: "20px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "24px",
                        background: "linear-gradient(135deg, #3b82f6 0%, #10b981 100%)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)",
                        flexShrink: 0,
                      }}
                    >
                      <UserCheck size={42} />
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                        <span className="status-pill active" style={{ fontSize: "0.8rem", padding: "0.2rem 0.75rem" }}>
                          <ShieldCheck size={13} /> Verified Faculty Instructor
                        </span>
                        <span className="status-pill pending" style={{ fontSize: "0.8rem", padding: "0.2rem 0.75rem" }}>
                          Classroom Administrator
                        </span>
                      </div>
                      <h2 style={{ margin: "0.2rem 0 0.35rem", fontSize: "1.75rem", fontWeight: 800 }}>
                        {teacher?.fullName || "Faculty Instructor"}
                      </h2>
                      <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>
                        Email: <strong style={{ color: "var(--primary)" }}>{teacher?.email || "instructor@edu.com"}</strong> • Smart Classroom Educator
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <button
                      className="primary-button"
                      onClick={() => navigate("/create-session")}
                      style={{ padding: "0.65rem 1.1rem", fontSize: "0.9rem" }}
                    >
                      <PlusCircle size={16} /> Launch New Session
                    </button>
                    <button
                      className="secondary"
                      onClick={() => navigate("/my-sessions")}
                      style={{ padding: "0.65rem 1.1rem", fontSize: "0.9rem" }}
                    >
                      <BookOpen size={16} /> View Sessions
                    </button>
                  </div>
                </div>
              </section>

              {/* Teaching Impact Analytics Grid */}
              <div
                className="stats-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1.25rem",
                }}
              >
                {/* Sessions Created */}
                <div className="stat-card hero-card" style={{ padding: "1.35rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.35rem", margin: 0 }}>
                      <BookOpen size={14} /> Sessions Created
                    </span>
                    <span style={{ background: "var(--primary-light)", color: "var(--primary)", padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700 }}>
                      Total
                    </span>
                  </div>
                  <h3 style={{ fontSize: "2rem", fontWeight: 800, margin: "0.25rem 0 0.5rem" }}>{sessionsCreated}</h3>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    Classroom lectures hosted
                  </div>
                </div>

                {/* Students Taught */}
                <div className="stat-card hero-card" style={{ padding: "1.35rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.35rem", margin: 0, color: "var(--primary)" }}>
                      <Users size={14} /> Unique Students
                    </span>
                    <span style={{ background: "var(--primary-light)", color: "var(--primary)", padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700 }}>
                      Impact
                    </span>
                  </div>
                  <h3 style={{ fontSize: "2rem", fontWeight: 800, margin: "0.25rem 0 0.5rem" }}>{totalStudents}</h3>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    Students engaged in class
                  </div>
                </div>

                {/* Doubts Resolved Rate */}
                <div className="stat-card hero-card" style={{ padding: "1.35rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.35rem", margin: 0, color: "var(--success)" }}>
                      <HelpCircle size={14} /> Doubt Resolution
                    </span>
                    <span style={{ color: "var(--success)", fontSize: "0.85rem", fontWeight: 700 }}>
                      {resolutionRate}%
                    </span>
                  </div>
                  <h3 style={{ fontSize: "2rem", fontWeight: 800, margin: "0.25rem 0 0.5rem", color: "var(--success)" }}>
                    {doubtsAnswered} <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>/ {totalDoubts}</span>
                  </h3>
                  <div style={{ width: "100%", height: "6px", background: "var(--border)", borderRadius: "10px", overflow: "hidden", marginTop: "0.5rem" }}>
                    <div
                      style={{
                        width: `${Math.min(100, resolutionRate)}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #10b981, #059669)",
                        borderRadius: "10px",
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>

                {/* AI Assistant Co-Pilot */}
                <div className="stat-card hero-card" style={{ padding: "1.35rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.35rem", margin: 0, color: "#a855f7" }}>
                      <Sparkles size={14} /> Gemini AI Assists
                    </span>
                    <span style={{ background: "rgba(168, 85, 247, 0.15)", color: "#a855f7", padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700 }}>
                      AI Co-Pilot
                    </span>
                  </div>
                  <h3 style={{ fontSize: "2rem", fontWeight: 800, margin: "0.25rem 0 0.5rem", color: "#a855f7" }}>{aiAnswers}</h3>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    AI-assisted answers generated
                  </div>
                </div>

                {/* Quizzes Created */}
                <div className="stat-card hero-card" style={{ padding: "1.35rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.35rem", margin: 0 }}>
                      <FileText size={14} /> Assessment Quizzes
                    </span>
                    <span style={{ background: "var(--primary-light)", color: "var(--primary)", padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700 }}>
                      Quizzes
                    </span>
                  </div>
                  <h3 style={{ fontSize: "2rem", fontWeight: 800, margin: "0.25rem 0 0.5rem" }}>{quizzesCreated}</h3>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    Published topic quizzes
                  </div>
                </div>

                {/* Avg Class Score */}
                <div className="stat-card hero-card" style={{ padding: "1.35rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.35rem", margin: 0, color: "var(--primary)" }}>
                      <Trophy size={14} /> Class Score Avg
                    </span>
                    <span style={{ color: "var(--primary)", fontSize: "0.85rem", fontWeight: 700 }}>
                      {avgClassScore}%
                    </span>
                  </div>
                  <h3 style={{ fontSize: "2rem", fontWeight: 800, margin: "0.25rem 0 0.5rem" }}>{avgClassScore}%</h3>
                  <div style={{ width: "100%", height: "6px", background: "var(--border)", borderRadius: "10px", overflow: "hidden", marginTop: "0.5rem" }}>
                    <div
                      style={{
                        width: `${Math.min(100, avgClassScore)}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #3b82f6, #6366f1)",
                        borderRadius: "10px",
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Educator Quick Workstation Grid */}
              <section className="hero-card page-section" style={{ padding: "1.75rem" }}>
                <div style={{ marginBottom: "1.25rem" }}>
                  <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <BarChart3 size={14} /> Teacher Studio Controls
                  </span>
                  <h3 style={{ margin: "0.2rem 0 0", fontSize: "1.35rem", fontWeight: 700 }}>Instructor Workstation</h3>
                </div>

                <div className="dashboard-grid">
                  <button className="dashboard-card" onClick={() => navigate("/create-session")}>
                    <div className="card-icon" style={{ color: "var(--primary)", background: "var(--primary-light)" }}>
                      <PlusCircle size={24} />
                    </div>
                    <h2>Create Classroom Session</h2>
                    <p>Launch a live session, set custom expiry timer, and project PIN/QR Code.</p>
                    <div className="dashboard-card-footer">
                      <span className="status-pill active">Launch Now <ArrowRight size={14} /></span>
                    </div>
                  </button>

                  <button className="dashboard-card" onClick={() => navigate("/my-sessions")}>
                    <div className="card-icon" style={{ color: "var(--success)", background: "var(--success-bg)" }}>
                      <BookOpen size={24} />
                    </div>
                    <h2>Manage My Sessions</h2>
                    <p>Access live control panels, timeline events, AI quiz builder, and live roster.</p>
                    <div className="dashboard-card-footer">
                      <span className="status-pill active">Control Panel <ArrowRight size={14} /></span>
                    </div>
                  </button>

                  <button className="dashboard-card" onClick={() => navigate("/teacher-history")}>
                    <div className="card-icon" style={{ color: "#a855f7", background: "rgba(168, 85, 247, 0.15)" }}>
                      <BarChart3 size={24} />
                    </div>
                    <h2>Classroom History & Reports</h2>
                    <p>View closed sessions, past attendance records, and export CSV/Excel reports.</p>
                    <div className="dashboard-card-footer">
                      <span className="status-pill active">View Reports <ArrowRight size={14} /></span>
                    </div>
                  </button>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default TeacherProfile;
