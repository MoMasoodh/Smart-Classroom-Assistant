import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import api from "../services/api";
import { getStudent } from "../services/storage";
import { GraduationCap, Award, BookOpen, Clock, HelpCircle, Trophy, BarChart3, CheckCircle2 } from "lucide-react";

function StudentProfile() {
  const loggedInStudent = getStudent();
  const registerNumber = loggedInStudent?.student?.registerNumber;

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!registerNumber) {
      setLoading(false);
      return;
    }
    fetchProfile();
  }, [registerNumber]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/profile/student/${registerNumber}`);
      setProfileData(res.data);
    } catch (err) {
      console.error("Error fetching student profile:", err);
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
        <Header title="Student Profile" subtitle="Your learning analytics, academic statistics, and achievements" />

        <main className="page-shell page-grid fade-in">
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              Loading profile details...
            </div>
          ) : (
            <>
              {/* Profile Card */}
              <section className="hero-card page-hero">
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
                    }}
                  >
                    <GraduationCap size={36} />
                  </div>

                  <div>
                    <span className="eyebrow">Student Account</span>
                    <h2 style={{ margin: "0.25rem 0 0.25rem", fontSize: "1.6rem" }}>{student?.fullName || "Student Name"}</h2>
                    <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>
                      Reg No: <strong style={{ fontFamily: "monospace" }}>{student?.registerNumber}</strong> • Dept: {student?.department || "Computer Science"} • Year: {student?.year || 3}
                    </p>
                  </div>
                </div>
              </section>

              {/* Stats Grid */}
              <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                <div className="stat-card hero-card">
                  <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <BookOpen size={12} /> Sessions Attended
                  </span>
                  <h3 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0" }}>{analytics.sessionsAttended || 0}</h3>
                </div>

                <div className="stat-card hero-card">
                  <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Trophy size={12} /> Avg Quiz Score
                  </span>
                  <h3 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0" }}>{analytics.avgQuizScore || 0}%</h3>
                </div>

                <div className="stat-card hero-card">
                  <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Award size={12} /> Highest Score
                  </span>
                  <h3 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0" }}>{analytics.highestQuizScore || 0}%</h3>
                </div>

                <div className="stat-card hero-card">
                  <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <HelpCircle size={12} /> Doubts Asked
                  </span>
                  <h3 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0" }}>{analytics.totalDoubts || 0}</h3>
                </div>
              </div>

              {/* Achievements & Learning Statistics */}
              <section className="hero-card page-section">
                <span className="eyebrow">
                  <Award size={14} /> Achievements & Milestones
                </span>
                <h3 style={{ margin: "0.5rem 0 1rem", fontSize: "1.3rem" }}>Earned Badges</h3>

                {analytics.achievements && analytics.achievements.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                    {analytics.achievements.map((ach, idx) => (
                      <div key={idx} style={{ background: "var(--bg-surface)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border)", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                        <Award size={24} style={{ color: "var(--primary)", flexShrink: 0 }} />
                        <div>
                          <strong style={{ fontSize: "1rem", display: "block" }}>{ach.title}</strong>
                          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{ach.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-muted)" }}>Attend sessions and participate in quizzes to unlock learning achievements.</p>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default StudentProfile;
