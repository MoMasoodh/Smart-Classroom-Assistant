import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import SessionDetailModal from "../components/SessionDetailModal";
import Skeleton from "../components/Skeleton";
import api from "../services/api";
import { formatDate } from "../utils/dateUtils";
import { getStudent } from "../services/storage";
import {
  GraduationCap,
  Award,
  BookOpen,
  Clock,
  HelpCircle,
  Trophy,
  ChevronRight,
  History,
  CheckCircle2,
  Sparkles,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Zap,
} from "lucide-react";

function StudentProfile() {
  const navigate = useNavigate();
  const loggedInStudent = getStudent();

  const [profileData, setProfileData] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionCode, setSelectedSessionCode] = useState(null);

  useEffect(() => {
    fetchProfileAndRecent();
  }, []);

  const fetchProfileAndRecent = async () => {
    try {
      setLoading(true);
      const [profRes, histRes] = await Promise.all([
        api.get("/profile/student"),
        api.get("/history/student?limit=4"),
      ]);
      setProfileData(profRes.data);
      setRecentSessions(histRes.data || []);
    } catch (err) {
      console.error("Error fetching student profile data:", err);
    } finally {
      setLoading(false);
    }
  };

  const student = profileData?.student || loggedInStudent?.student;
  const analytics = profileData?.analytics || {};

  const attendancePct = analytics.attendancePercentage ?? 100;
  const avgQuiz = analytics.avgQuizScore ?? 0;
  const highestQuiz = analytics.highestQuizScore ?? 0;
  const totalDoubts = analytics.totalDoubts ?? 0;
  const sessionsAttended = analytics.sessionsAttended ?? 0;
  const achievements = analytics.achievements || [];

  return (
    <div className="app-page">
      <Sidebar />

      <div className="content-with-sidebar">
        <Header
          title="Student Profile"
          subtitle="Your learning analytics, academic statistics, and achievements summary"
        />

        <main className="page-shell fade-in" style={{ display: "grid", gap: "1.5rem" }}>
          {loading ? (
            <div style={{ display: "grid", gap: "1.25rem" }}>
              <Skeleton height="140px" radius="16px" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
                <Skeleton height="110px" radius="16px" />
                <Skeleton height="110px" radius="16px" />
                <Skeleton height="110px" radius="16px" />
                <Skeleton height="110px" radius="16px" />
              </div>
              <Skeleton height="200px" radius="16px" />
            </div>
          ) : (
            <>
              {/* Premium Hero Banner */}
              <section
                className="hero-card page-hero"
                style={{
                  padding: "2rem",
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.06) 100%)",
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
                        background: "linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.4)",
                        flexShrink: 0,
                      }}
                    >
                      <GraduationCap size={42} />
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                        <span className="status-pill active" style={{ fontSize: "0.8rem", padding: "0.2rem 0.75rem" }}>
                          <Zap size={13} /> Active Student Learner
                        </span>
                        <span className="status-pill pending" style={{ fontSize: "0.8rem", padding: "0.2rem 0.75rem" }}>
                          Dept: {student?.department || "Computer Science"}
                        </span>
                      </div>
                      <h2 style={{ margin: "0.2rem 0 0.35rem", fontSize: "1.75rem", fontWeight: 800 }}>
                        {student?.fullName || "Student Name"}
                      </h2>
                      <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>
                        Register No: <strong style={{ fontFamily: "monospace", color: "var(--primary)", fontSize: "1.05rem" }}>{student?.registerNumber || "N/A"}</strong> • Year {student?.year || 3} Undergraduate
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <button
                      className="primary-button"
                      onClick={() => navigate("/ask-doubt")}
                      style={{ padding: "0.65rem 1.1rem", fontSize: "0.9rem" }}
                    >
                      <HelpCircle size={16} /> Ask Doubt
                    </button>
                    <button
                      className="secondary"
                      onClick={() => navigate("/student-history")}
                      style={{ padding: "0.65rem 1.1rem", fontSize: "0.9rem" }}
                    >
                      <History size={16} /> All Sessions
                    </button>
                  </div>
                </div>
              </section>

              {/* Progress & Stat Cards Grid */}
              <div
                className="stats-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1.25rem",
                }}
              >
                {/* Sessions Attended */}
                <div className="stat-card hero-card" style={{ padding: "1.35rem", position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.35rem", margin: 0 }}>
                      <BookOpen size={14} /> Sessions Attended
                    </span>
                    <span style={{ background: "var(--primary-light)", color: "var(--primary)", padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700 }}>
                      Total
                    </span>
                  </div>
                  <h3 style={{ fontSize: "2rem", fontWeight: 800, margin: "0.25rem 0 0.5rem" }}>{sessionsAttended}</h3>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    Classroom lectures joined
                  </div>
                </div>

                {/* Attendance Percentage */}
                <div className="stat-card hero-card" style={{ padding: "1.35rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.35rem", margin: 0, color: "var(--success)" }}>
                      <Clock size={14} /> Attendance Rate
                    </span>
                    <span style={{ color: "var(--success)", fontSize: "0.85rem", fontWeight: 700 }}>
                      {attendancePct}%
                    </span>
                  </div>
                  <h3 style={{ fontSize: "2rem", fontWeight: 800, margin: "0.25rem 0 0.5rem", color: "var(--success)" }}>
                    {attendancePct}%
                  </h3>
                  <div style={{ width: "100%", height: "6px", background: "var(--border)", borderRadius: "10px", overflow: "hidden", marginTop: "0.5rem" }}>
                    <div
                      style={{
                        width: `${Math.min(100, attendancePct)}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #10b981, #059669)",
                        borderRadius: "10px",
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Average Quiz Score */}
                <div className="stat-card hero-card" style={{ padding: "1.35rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.35rem", margin: 0, color: "var(--primary)" }}>
                      <Trophy size={14} /> Quiz Score Avg
                    </span>
                    {highestQuiz > 0 && (
                      <span style={{ background: "var(--primary-light)", color: "var(--primary)", padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700 }}>
                        Best: {highestQuiz}%
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: "2rem", fontWeight: 800, margin: "0.25rem 0 0.5rem" }}>{avgQuiz}%</h3>
                  <div style={{ width: "100%", height: "6px", background: "var(--border)", borderRadius: "10px", overflow: "hidden", marginTop: "0.5rem" }}>
                    <div
                      style={{
                        width: `${Math.min(100, avgQuiz)}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #6366f1, #a855f7)",
                        borderRadius: "10px",
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Doubts Asked */}
                <div className="stat-card hero-card" style={{ padding: "1.35rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.35rem", margin: 0, color: "var(--warning)" }}>
                      <HelpCircle size={14} /> Doubts Submitted
                    </span>
                    <span style={{ background: "var(--warning-bg)", color: "var(--warning)", padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700 }}>
                      Active
                    </span>
                  </div>
                  <h3 style={{ fontSize: "2rem", fontWeight: 800, margin: "0.25rem 0 0.5rem", color: "var(--warning)" }}>{totalDoubts}</h3>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    Questions asked in class
                  </div>
                </div>
              </div>

              {/* Recent Classroom Activity */}
              <section className="hero-card page-section" style={{ padding: "1.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <div>
                    <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Sparkles size={14} /> Learning Timeline
                    </span>
                    <h3 style={{ margin: "0.2rem 0 0", fontSize: "1.35rem", fontWeight: 700 }}>Recent Attended Sessions</h3>
                  </div>

                  <button
                    className="secondary"
                    onClick={() => navigate("/student-history")}
                    style={{ fontSize: "0.88rem", padding: "0.4rem 0.85rem" }}
                  >
                    View All History <ChevronRight size={16} />
                  </button>
                </div>

                {recentSessions.length === 0 ? (
                  <div className="empty-state" style={{ padding: "2rem" }}>
                    <BookOpen size={40} style={{ opacity: 0.5 }} />
                    <p style={{ margin: "0.5rem 0 0" }}>No classroom sessions attended yet. Join live sessions to view timeline summary.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: "1rem" }}>
                    {recentSessions.map((item) => (
                      <div
                        key={item.id || item.sessionCode}
                        className="clickable-card hero-card"
                        onClick={() => setSelectedSessionCode(item.sessionCode)}
                        style={{
                          padding: "1.1rem 1.35rem",
                          borderRadius: "14px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                            <span className="status-pill active" style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", fontFamily: "monospace" }}>
                              PIN: {item.sessionCode}
                            </span>
                            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                          <strong style={{ fontSize: "1.1rem", display: "block", color: "var(--text)" }}>{item.sessionName}</strong>
                          <span style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
                            Subject: {item.subject} • Instructor: {item.teacherName || "Teacher"}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          <span className="status-pill active" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                            <CheckCircle2 size={13} /> Attended ({item.attendancePercentage || 100}%)
                          </span>
                          <ArrowRight size={18} style={{ color: "var(--primary)" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Achievements Showcase */}
              <section className="hero-card page-section" style={{ padding: "1.75rem" }}>
                <div style={{ marginBottom: "1.25rem" }}>
                  <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--warning)" }}>
                    <Award size={14} /> Academic Gamification
                  </span>
                  <h3 style={{ margin: "0.2rem 0 0", fontSize: "1.35rem", fontWeight: 700 }}>Earned Achievements & Badges</h3>
                </div>

                {achievements.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
                    {achievements.map((ach, idx) => (
                      <div
                        key={idx}
                        className="hero-card"
                        style={{
                          padding: "1.25rem",
                          borderRadius: "16px",
                          background: "linear-gradient(135deg, var(--surface) 0%, var(--surface-alt) 100%)",
                          border: "1px solid var(--border)",
                          display: "flex",
                          gap: "1rem",
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "12px",
                            background: "var(--warning-bg)",
                            color: "var(--warning)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Award size={24} />
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <strong style={{ fontSize: "1.05rem", color: "var(--text)" }}>{ach.title}</strong>
                            <CheckCircle2 size={14} style={{ color: "var(--success)" }} />
                          </div>
                          <p style={{ margin: "0.35rem 0 0", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                            {ach.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state" style={{ padding: "2rem" }}>
                    <Award size={40} style={{ opacity: 0.5 }} />
                    <p style={{ margin: "0.5rem 0 0" }}>Attend sessions and complete quizzes to unlock student achievement badges.</p>
                  </div>
                )}
              </section>
            </>
          )}

          {selectedSessionCode && (
            <SessionDetailModal sessionCode={selectedSessionCode} onClose={() => setSelectedSessionCode(null)} />
          )}
        </main>
      </div>
    </div>
  );
}

export default StudentProfile;
