import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { SkeletonStat } from "../components/Skeleton";
import api from "../services/api";
import { getActiveSession, getStudentProfile } from "../services/storage";
import {
  Users,
  HelpCircle,
  Clock,
  CheckCircle2,
  FileText,
  BarChart3,
  Trophy,
  Activity,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import "./Statistics.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Doughnut, Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Statistics() {
  const navigate = useNavigate();
  const location = useLocation();
  const storedProfile = getStudentProfile();
  const session = location.state?.session || storedProfile?.session || getActiveSession();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadStatistics = useCallback(
    async (isSilent = false) => {
      if (!session?.sessionCode) return;

      try {
        if (!isSilent) setLoading(true);
        setError("");

        const response = await api.get(`/statistics/${session.sessionCode}`);
        setStats(response.data);
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (requestError) {
        if (!isSilent) {
          setError(requestError.response?.data?.message || "Unable to load classroom statistics.");
        }
      } finally {
        if (!isSilent) setLoading(false);
      }
    },
    [session?.sessionCode]
  );

  useEffect(() => {
    if (session?.sessionCode) {
      loadStatistics(false);

      const timer = setInterval(() => {
        loadStatistics(true);
      }, 15000);

      return () => clearInterval(timer);
    } else {
      setLoading(false);
      setError("No active classroom session found. Please select a session.");
    }
  }, [session?.sessionCode, loadStatistics]);

  // Chart 1: Doughnut Chart Data
  const doughnutData = {
    labels: ["Answered Doubts", "Pending Doubts"],
    datasets: [
      {
        data: stats ? [stats.answeredDoubts, stats.pendingDoubts] : [0, 0],
        backgroundColor: ["#10B981", "#F59E0B"],
        borderColor: ["#059669", "#D97706"],
        borderWidth: 1,
        hoverOffset: 6,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 16,
          font: { size: 13, family: "inherit", weight: "600" },
        },
      },
    },
  };

  // Chart 2: Bar Chart Data
  const barData = {
    labels: stats?.scoreDistribution ? stats.scoreDistribution.map((d) => d.range) : ["0-20%", "21-40%", "41-60%", "61-80%", "81-100%"],
    datasets: [
      {
        label: "Students",
        data: stats?.scoreDistribution ? stats.scoreDistribution.map((d) => d.count) : [0, 0, 0, 0, 0],
        backgroundColor: "rgba(79, 70, 229, 0.8)",
        borderColor: "#4F46E5",
        borderWidth: 1.5,
        borderRadius: 8,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, precision: 0 },
        grid: { color: "rgba(226, 232, 240, 0.6)" },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  // Chart 3: Line Chart Data
  const lineData = {
    labels: stats?.joinsOverTime ? stats.joinsOverTime.map((d) => d.time) : [],
    datasets: [
      {
        label: "Activity Frequency",
        data: stats?.joinsOverTime ? stats.joinsOverTime.map((d) => d.count) : [],
        fill: true,
        backgroundColor: "rgba(99, 102, 241, 0.15)",
        borderColor: "#6366F1",
        tension: 0.4,
        pointBackgroundColor: "#4F46E5",
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, precision: 0 },
        grid: { color: "rgba(226, 232, 240, 0.6)" },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <div className="app-page statistics-page">
      <Sidebar teacher />

      <div className="content-with-sidebar">
        <Header
          title="Classroom Analytics"
          subtitle={stats ? `${stats.sessionName} • ${stats.subject} (${stats.sessionCode})` : "Session Analytics"}
          actions={
            session ? (
              <button className="secondary" onClick={() => navigate("/manage-session", { state: { session } })}>
                <ArrowLeft size={16} /> Manage Session
              </button>
            ) : null
          }
        />

        <main className="page-shell fade-in">
          {loading ? (
            <div className="stats-grid-container">
              {Array.from({ length: 7 }).map((_, i) => (
                <SkeletonStat key={i} />
              ))}
            </div>
          ) : null}

          {error ? (
            <div className="error-state hero-card">
              <strong style={{ color: "#EF4444", fontSize: "1.1rem" }}>Statistics Unavailable</strong>
              <p style={{ margin: "0.5rem 0 0", color: "var(--text-muted)" }}>{error}</p>
              <button
                className="primary-button"
                onClick={() => loadStatistics(false)}
                style={{ marginTop: "1rem" }}
              >
                <RefreshCw size={16} /> Retry Loading
              </button>
            </div>
          ) : null}

          {!loading && !error && stats ? (
            <>
              {/* Header Info Banner */}
              <section className="hero-card stats-header-card" style={{ marginBottom: "1.5rem" }}>
                <div className="stats-header-info">
                  <span className="eyebrow">
                    <Activity size={14} /> Real-Time Analytics
                  </span>
                  <h2 style={{ marginTop: "0.5rem" }}>{stats.sessionName} Performance Overview</h2>
                  <p>
                    Subject: <strong>{stats.subject}</strong> • PIN: <strong>{stats.sessionCode}</strong> • Status:{" "}
                    <span style={{ color: stats.status === "Active" ? "var(--success)" : "var(--danger)", fontWeight: 700 }}>
                      {stats.status}
                    </span>
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                  <span className="polling-badge">
                    <span className="polling-dot"></span> Live Polling (15s)
                  </span>
                  {lastUpdated ? (
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Updated: {lastUpdated}</span>
                  ) : null}
                </div>
              </section>

              {/* 7 KPI Cards Grid */}
              <div className="stats-grid-container">
                {/* 1. Students Joined */}
                <div className="analytics-card">
                  <div>
                    <div className="analytics-card-top">
                      <div className="analytics-card-icon" style={{ color: "#3B82F6", background: "rgba(59, 130, 246, 0.12)" }}>
                        <Users size={24} />
                      </div>
                    </div>
                    <div className="analytics-card-title">Students Joined</div>
                    <div className="analytics-card-number">{stats.studentsJoined}</div>
                    <div className="analytics-card-desc">Total unique students joined</div>
                  </div>

                  <div className="progress-bar-wrapper">
                    <div className="progress-bar-label">
                      <span>Quiz Participation</span>
                      <span>{stats.quizParticipationRate}%</span>
                    </div>
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill primary"
                        style={{ width: `${Math.min(100, stats.quizParticipationRate)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* 2. Total Doubts */}
                <div className="analytics-card">
                  <div>
                    <div className="analytics-card-top">
                      <div className="analytics-card-icon" style={{ color: "#8B5CF6", background: "rgba(139, 92, 246, 0.12)" }}>
                        <HelpCircle size={24} />
                      </div>
                    </div>
                    <div className="analytics-card-title">Total Doubts</div>
                    <div className="analytics-card-number">{stats.totalDoubts}</div>
                    <div className="analytics-card-desc">Questions asked by classroom</div>
                  </div>
                </div>

                {/* 3. Pending Doubts */}
                <div className="analytics-card">
                  <div>
                    <div className="analytics-card-top">
                      <div className="analytics-card-icon" style={{ color: "#F59E0B", background: "rgba(245, 158, 11, 0.12)" }}>
                        <Clock size={24} />
                      </div>
                    </div>
                    <div className="analytics-card-title">Pending Doubts</div>
                    <div className="analytics-card-number">{stats.pendingDoubts}</div>
                    <div className="analytics-card-desc">Awaiting teacher explanation</div>
                  </div>
                </div>

                {/* 4. Answered Doubts */}
                <div className="analytics-card">
                  <div>
                    <div className="analytics-card-top">
                      <div className="analytics-card-icon" style={{ color: "#10B981", background: "rgba(16, 185, 129, 0.12)" }}>
                        <CheckCircle2 size={24} />
                      </div>
                    </div>
                    <div className="analytics-card-title">Answered Doubts</div>
                    <div className="analytics-card-number">{stats.answeredDoubts}</div>
                    <div className="analytics-card-desc">Resolved classroom doubts</div>
                  </div>

                  <div className="progress-bar-wrapper">
                    <div className="progress-bar-label">
                      <span>Answered Rate</span>
                      <span>{stats.answeredRate}%</span>
                    </div>
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill success"
                        style={{ width: `${Math.min(100, stats.answeredRate)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* 5. Quiz Attempts */}
                <div className="analytics-card">
                  <div>
                    <div className="analytics-card-top">
                      <div className="analytics-card-icon" style={{ color: "#EC4899", background: "rgba(236, 72, 153, 0.12)" }}>
                        <FileText size={24} />
                      </div>
                    </div>
                    <div className="analytics-card-title">Quiz Attempts</div>
                    <div className="analytics-card-number">{stats.quizAttempts}</div>
                    <div className="analytics-card-desc">Quiz submissions received</div>
                  </div>
                </div>

                {/* 6. Average Score */}
                <div className="analytics-card">
                  <div>
                    <div className="analytics-card-top">
                      <div className="analytics-card-icon" style={{ color: "#06B6D4", background: "rgba(6, 182, 212, 0.12)" }}>
                        <BarChart3 size={24} />
                      </div>
                    </div>
                    <div className="analytics-card-title">Average Score</div>
                    <div className="analytics-card-number">{stats.averageScore}%</div>
                    <div className="analytics-card-desc">Class average score percentage</div>
                  </div>
                </div>

                {/* 7. Highest Score */}
                <div className="analytics-card">
                  <div>
                    <div className="analytics-card-top">
                      <div className="analytics-card-icon" style={{ color: "#F59E0B", background: "rgba(245, 158, 11, 0.16)" }}>
                        <Trophy size={24} />
                      </div>
                    </div>
                    <div className="analytics-card-title">Highest Score</div>
                    <div className="analytics-card-number">
                      {stats.highestScore?.percentage ?? stats.highestScore?.score ?? 0}%
                    </div>
                    <div className="analytics-card-desc">
                      Top Scorer: <strong>{stats.highestScore?.studentName || "N/A"}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="charts-grid">
                {/* Chart 1: Doughnut Chart */}
                <div className="chart-card">
                  <h3>Answered vs Pending Doubts</h3>
                  <p>Distribution of doubts resolved vs awaiting teacher attention.</p>
                  <div className="chart-container">
                    {stats.totalDoubts === 0 ? (
                      <div className="chart-empty-state">
                        <HelpCircle size={40} />
                        <p>No doubts submitted yet</p>
                      </div>
                    ) : (
                      <Doughnut data={doughnutData} options={doughnutOptions} />
                    )}
                  </div>
                </div>

                {/* Chart 2: Bar Chart */}
                <div className="chart-card">
                  <h3>Quiz Scores Distribution</h3>
                  <p>Number of students falling into performance percentage brackets.</p>
                  <div className="chart-container">
                    {stats.quizAttempts === 0 ? (
                      <div className="chart-empty-state">
                        <FileText size={40} />
                        <p>No quiz attempts recorded yet</p>
                      </div>
                    ) : (
                      <Bar data={barData} options={barOptions} />
                    )}
                  </div>
                </div>

                {/* Chart 3: Line Chart */}
                <div className="chart-card wide-chart">
                  <h3>Classroom Activity Timeline</h3>
                  <p>Real-time frequency of student doubt submissions and quiz attempts over time.</p>
                  <div className="chart-container" style={{ height: "300px" }}>
                    {stats.studentsJoined === 0 && stats.totalDoubts === 0 ? (
                      <div className="chart-empty-state">
                        <Activity size={40} />
                        <p>Classroom activity timeline will build as students participate.</p>
                      </div>
                    ) : (
                      <Line data={lineData} options={lineOptions} />
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default Statistics;