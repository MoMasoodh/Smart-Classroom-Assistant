import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Loading from "../components/Loading";
import api from "../services/api";
import { getActiveSession, getStudentProfile } from "../services/storage";

function Statistics() {
  const navigate = useNavigate();
  const location = useLocation();
  const storedProfile = getStudentProfile();
  const session = location.state?.session || storedProfile?.session || getActiveSession();

  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.sessionCode) {
      loadStatistics();
    } else {
      setLoading(false);
      setError("Session not found.");
    }
  }, [session?.sessionCode]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError("");
      const [statsResponse, leaderboardResponse] = await Promise.all([
        api.get(`/sessions/${session.sessionCode}/stats`),
        api.get(`/results/leaderboard/${session.sessionCode}`),
      ]);

      setStats(statsResponse.data);
      setLeaderboard(leaderboardResponse.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load statistics.");
    } finally {
      setLoading(false);
    }
  };

  const averageScore = leaderboard.length
    ? (leaderboard.reduce((total, entry) => total + entry.score, 0) / leaderboard.length).toFixed(1)
    : "0.0";
  const highestScore = leaderboard.length ? Math.max(...leaderboard.map((entry) => entry.score)) : 0;

  return (
    <div className="app-page">

      <Sidebar teacher />

      <div className="content-with-sidebar">

        <Header
          title="Statistics"
          subtitle={stats ? `${stats.sessionName} · ${stats.subject}` : "Session analytics"}
          actions={
            <button className="secondary" onClick={() => navigate("/manage-session", { state: { session } })}>
              Manage Session
            </button>
          }
        />

        <main className="page-shell page-grid">

          {loading ? <Loading label="Loading analytics" /> : null}

          {error ? (
            <div className="error-state">
              <strong>Statistics unavailable</strong>
              <p>{error}</p>
            </div>
          ) : null}

          {!loading && !error && stats ? (
            <>
              <div className="stats-grid">
                <div className="stat-card hero-card">
                  <span className="eyebrow">Students Joined</span>
                  <h3>{stats.totalStudents}</h3>
                </div>
                <div className="stat-card hero-card">
                  <span className="eyebrow">Total Doubts</span>
                  <h3>{stats.totalDoubts}</h3>
                </div>
                <div className="stat-card hero-card">
                  <span className="eyebrow">Answered Doubts</span>
                  <h3>{stats.answeredDoubts}</h3>
                </div>
                <div className="stat-card hero-card">
                  <span className="eyebrow">Pending Doubts</span>
                  <h3>{stats.pendingDoubts}</h3>
                </div>
                <div className="stat-card hero-card">
                  <span className="eyebrow">Quiz Attempts</span>
                  <h3>{stats.quizAttempts}</h3>
                </div>
                <div className="stat-card hero-card">
                  <span className="eyebrow">Average Score</span>
                  <h3>{averageScore}</h3>
                </div>
                <div className="stat-card hero-card">
                  <span className="eyebrow">Highest Score</span>
                  <h3>{highestScore}</h3>
                </div>
              </div>

              <div className="hero-card">
                <h3 style={{ marginTop: 0 }}>Session Summary</h3>
                <p style={{ margin: 0, color: "var(--muted)" }}>
                  {stats.sessionName} · {stats.subject} · Code {stats.sessionCode} · {stats.status}
                </p>
              </div>
            </>
          ) : null}

        </main>

      </div>

    </div>
  );
}

export default Statistics;