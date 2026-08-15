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
        api.get("/history/student?limit=3"),
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
            <div style={{ display: "grid", gap: "1rem" }}>
              <Skeleton height="120px" radius="16px" />
              <Skeleton height="180px" radius="16px" />
            </div>
          ) : (
            <>
              {/* Profile Card */}
              <section className="hero-card page-hero" style={{ padding: "2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
                  <div
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "50%",
                      background: "var(--primary-light)",
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <GraduationCap size={36} />
                  </div>

                  <div>
                    <span className="eyebrow">Student Learning Profile</span>
                    <h2 style={{ margin: "0.25rem 0 0.25rem", fontSize: "1.6rem" }}>{student?.fullName || "Student Name"}</h2>
                    <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>
                      Reg No: <strong style={{ fontFamily: "monospace" }}>{student?.registerNumber}</strong> • Dept: {student?.department || "Computer Science"} • Year: {student?.year || 3}
                    </p>
                  </div>
                </div>
              </section>

              {/* Concise Learning Summary Stats Grid */}
              <div
                className="stats-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "1rem",
                }}
              >
                <div className="stat-card hero-card" style={{ padding: "1.25rem" }}>
                  <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <BookOpen size={13} /> Sessions Attended
                  </span>
                  <h3 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0" }}>{analytics.sessionsAttended || 0}</h3>
                </div>

                <div className="stat-card hero-card" style={{ padding: "1.25rem" }}>
                  <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Trophy size={13} /> Avg Quiz Score
                  </span>
                  <h3 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0" }}>{analytics.avgQuizScore || 0}%</h3>
                </div>

                <div className="stat-card hero-card" style={{ padding: "1.25rem" }}>
                  <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Clock size={13} /> Attendance %
                  </span>
                  <h3 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0", color: "var(--success)" }}>
                    {analytics.attendancePercentage || 100}%
                  </h3>
                </div>

                <div className="stat-card hero-card" style={{ padding: "1.25rem" }}>
                  <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <HelpCircle size={13} /> Doubts Asked
                  </span>
                  <h3 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0" }}>{analytics.totalDoubts || 0}</h3>
                </div>
              </div>

              {/* Recent Sessions List */}
              <section className="hero-card page-section" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div>
                    <span className="eyebrow">Recent Activity</span>
                    <h3 style={{ margin: "0.2rem 0 0", fontSize: "1.25rem" }}>Recent Sessions</h3>
                  </div>

                  <button
                    className="secondary"
                    onClick={() => navigate("/student-history")}
                    style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
                  >
                    View Session History <ChevronRight size={16} />
                  </button>
                </div>

                {recentSessions.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                    No classroom sessions attended yet. Join live sessions to track your learning summary.
                  </p>
                ) : (
                  <div style={{ display: "grid", gap: "0.85rem" }}>
                    {recentSessions.map((item) => (
                      <div
                        key={item.id || item.sessionCode}
                        className="clickable-card"
                        onClick={() => setSelectedSessionCode(item.sessionCode)}
                        style={{
                          background: "var(--bg-surface)",
                          padding: "1rem 1.25rem",
                          borderRadius: "12px",
                          border: "1px solid var(--border)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: "1.05rem", display: "block" }}>{item.sessionName}</strong>
                          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                            {item.subject} • Teacher: {item.teacherName} • {formatDate(item.createdAt)}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--success)" }}>
                            Attendance: {item.attendancePercentage || 100}%
                          </span>
                          <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Achievements & Milestones */}
              <section className="hero-card page-section" style={{ padding: "1.5rem" }}>
                <span className="eyebrow">
                  <Award size={14} /> Achievements & Milestones
                </span>
                <h3 style={{ margin: "0.4rem 0 1rem", fontSize: "1.25rem" }}>Earned Badges</h3>

                {analytics.achievements && analytics.achievements.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                    {analytics.achievements.map((ach, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "var(--bg-surface)",
                          padding: "1rem",
                          borderRadius: "12px",
                          border: "1px solid var(--border)",
                          display: "flex",
                          gap: "0.75rem",
                          alignItems: "flex-start",
                        }}
                      >
                        <Award size={24} style={{ color: "var(--primary)", flexShrink: 0 }} />
                        <div>
                          <strong style={{ fontSize: "1rem", display: "block" }}>{ach.title}</strong>
                          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{ach.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-muted)", margin: 0 }}>Attend sessions and participate in quizzes to unlock learning achievements.</p>
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
