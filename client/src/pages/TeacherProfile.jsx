import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { UserCheck, BookOpen, Users, HelpCircle, Sparkles, FileText, Trophy, BarChart3 } from "lucide-react";

function TeacherProfile() {
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

  return (
    <div className="app-page">
      <Sidebar teacher />

      <div className="content-with-sidebar">
        <Header title="Teacher Profile" subtitle="Your teaching workspace overview, classroom statistics, and engagement analytics" />

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
                    <UserCheck size={36} />
                  </div>

                  <div>
                    <span className="eyebrow">Teacher Account</span>
                    <h2 style={{ margin: "0.25rem 0 0.25rem", fontSize: "1.6rem" }}>{teacher?.fullName || "Instructor Name"}</h2>
                    <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>
                      Email: {teacher?.email || "N/A"} • Instructor Workspace
                    </p>
                  </div>
                </div>
              </section>

              {/* Stats Grid */}
              <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                <div className="stat-card hero-card">
                  <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <BookOpen size={12} /> Sessions Created
                  </span>
                  <h3 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0" }}>{analytics.sessionsCreated || 0}</h3>
                </div>

                <div className="stat-card hero-card">
                  <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Users size={12} /> Students Taught
                  </span>
                  <h3 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0" }}>{analytics.totalStudentsTaught || 0}</h3>
                </div>

                <div className="stat-card hero-card">
                  <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <HelpCircle size={12} /> Doubts Resolved
                  </span>
                  <h3 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0" }}>{analytics.doubtsAnswered || 0}</h3>
                </div>

                <div className="stat-card hero-card">
                  <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Sparkles size={12} /> AI Answers
                  </span>
                  <h3 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0" }}>{analytics.aiAnswersGenerated || 0}</h3>
                </div>

                <div className="stat-card hero-card">
                  <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <FileText size={12} /> Quizzes Created
                  </span>
                  <h3 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0" }}>{analytics.quizzesCreated || 0}</h3>
                </div>

                <div className="stat-card hero-card">
                  <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Trophy size={12} /> Avg Class Score
                  </span>
                  <h3 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0" }}>{analytics.avgClassScore || 0}%</h3>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default TeacherProfile;
