import { useEffect, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { SkeletonTable, SkeletonStat } from "../components/Skeleton";
import api from "../services/api";
import { getStudentProfile, getActiveSession, getStudent } from "../services/storage";
import { Trophy, Award, Medal, Search, ArrowLeft, Users, Zap } from "lucide-react";

import { useStudentSessionSocket } from "../hooks/useStudentSessionSocket";

function Leaderboard() {
  useStudentSessionSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const student = getStudent();

  const [entries, setEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const profile = getStudentProfile();
  const session =
    location.state?.session ||
    profile?.session ||
    getActiveSession();

  const currentRegisterNumber = student?.student?.registerNumber || "";
  const currentStudentName = student?.student?.fullName || "";

  const getEntryIdentity = (entry) => entry.studentName || entry.registerNumber || "";
  const isCurrentStudent = (entry) => {
    if (currentRegisterNumber && entry.registerNumber) {
      return entry.registerNumber === currentRegisterNumber;
    }
    return getEntryIdentity(entry) === (currentStudentName || profile?.studentName || "");
  };

  useEffect(() => {
    if (!session?.sessionCode) {
      setLoading(false);
      setError("No active classroom session selected.");
      return;
    }
    fetchLeaderboard(false);
    const timer = setInterval(() => {
      fetchLeaderboard(true);
    }, 15000);
    return () => clearInterval(timer);
  }, [session?.sessionCode]);

  if (!student) {
    return <Navigate to="/student-login" replace />;
  }

  async function fetchLeaderboard(isSilent = false) {
    try {
      if (!isSilent) setLoading(true);
      const res = await api.get(`/results/leaderboard/${session.sessionCode}`);
      setEntries(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (!isSilent) {
        setError(err.response?.data?.message || "Unable to load leaderboard.");
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }

  const medalIcon = (i) => {
    if (i === 0) return <span style={{ color: "#eab308", fontSize: "1.5rem" }}>🥇</span>;
    if (i === 1) return <span style={{ color: "#94a3b8", fontSize: "1.5rem" }}>🥈</span>;
    if (i === 2) return <span style={{ color: "#d97706", fontSize: "1.5rem" }}>🥉</span>;
    return <span style={{ fontWeight: 700, color: "var(--text-muted)" }}>#{i + 1}</span>;
  };

  const percent = (e) =>
    e.totalQuestions ? Math.round((e.score * 100) / e.totalQuestions) : 0;

  const filteredEntries = entries.filter((e) => {
    const name = e.studentName || "";
    const reg = e.registerNumber || "";
    const term = searchTerm.toLowerCase();
    return name.toLowerCase().includes(term) || reg.toLowerCase().includes(term);
  });

  const topScore =
    entries.length > 0
      ? `${entries[0].score}/${entries[0].totalQuestions} (${percent(entries[0])}%)`
      : "N/A";

  return (
    <div className="app-page">
      <Sidebar />

      <div className="content-with-sidebar">
        <Header
          title="Classroom Leaderboard"
          subtitle={
            session
              ? `Real-Time Quiz Rankings • Session PIN ${session.sessionCode}`
              : "Leaderboard"
          }
          actions={
            <button
              className="secondary"
              onClick={() =>
                navigate("/student-dashboard", {
                  state: {
                    studentName: currentStudentName || profile?.studentName,
                    registerNumber: currentRegisterNumber,
                    session,
                  },
                })
              }
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
          }
        />

        <main className="page-shell fade-in">
          {loading && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
                <SkeletonStat />
                <SkeletonStat />
              </div>
              <SkeletonTable rows={5} columns={5} />
            </div>
          )}

          {!loading && error && (
            <div className="error-state hero-card">
              <strong style={{ fontSize: "1.1rem" }}>Leaderboard Unavailable</strong>
              <p style={{ margin: "0.5rem 0 0" }}>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Summary Stats Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div className="hero-stat" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "var(--primary-light)",
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Users size={22} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "1.5rem" }}>{entries.length}</strong>
                    <span>Total Participants</span>
                  </div>
                </div>

                <div className="hero-stat" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
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
                    }}
                  >
                    <Trophy size={22} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "1.5rem", color: "var(--warning)" }}>{topScore}</strong>
                    <span>Top Score</span>
                  </div>
                </div>
              </div>

              {entries.length === 0 ? (
                <div className="empty-state">
                  <Trophy size={48} />
                  <strong>No Quiz Submissions Yet</strong>
                  <p>Students will appear here automatically as soon as they submit their quizzes.</p>
                </div>
              ) : (
                <>
                  {/* Top 3 Podium Highlights */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: "1.25rem",
                      marginBottom: "1.75rem",
                    }}
                  >
                    {entries.slice(0, 3).map((entry, index) => (
                      <div
                        key={entry._id}
                        className="leaderboard-card hero-card"
                        style={{
                          textAlign: "center",
                          border: isCurrentStudent(entry)
                            ? "2px solid var(--primary)"
                            : "1px solid var(--border)",
                          background: index === 0 ? "linear-gradient(135deg, #fffbeb, #ffffff)" : "var(--surface)",
                        }}
                      >
                        <div style={{ marginBottom: "0.5rem" }}>{medalIcon(index)}</div>
                        <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.2rem", fontWeight: 700 }}>
                          {entry.studentName || "Student"}
                        </h3>
                        <p style={{ margin: "0 0 0.5rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                          Score: <strong>{entry.score}</strong> / {entry.totalQuestions}
                        </p>
                        <span
                          className="status-pill active"
                          style={{
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            padding: "0.3rem 0.85rem",
                          }}
                        >
                          <Zap size={14} /> {percent(entry)}% Score
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Search Bar & Table Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem",
                      marginBottom: "1rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
                      Classroom Rankings
                    </h3>
                    <div style={{ position: "relative", minWidth: "260px" }}>
                      <Search
                        size={18}
                        style={{
                          position: "absolute",
                          left: "0.75rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--text-subtle)",
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Search student name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: "2.5rem", padding: "0.6rem 0.85rem 0.6rem 2.5rem", fontSize: "0.875rem" }}
                      />
                    </div>
                  </div>

                  {/* Responsive Leaderboard Table */}
                  <div className="table-wrap">
                    <table className="responsive-table">
                      <thead>
                        <tr>
                          <th style={{ width: "90px" }}>Rank</th>
                          <th>Student Name</th>
                          <th>Score</th>
                          <th>Percentage</th>
                          <th>Submitted Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEntries.map((entry, index) => {
                          const originalRank = entries.findIndex((e) => e._id === entry._id);
                          const isMe = isCurrentStudent(entry);
                          return (
                            <tr
                              key={entry._id}
                              style={{
                                background: isMe ? "var(--primary-light)" : "transparent",
                                fontWeight: isMe ? 600 : 400,
                              }}
                            >
                              <td>{medalIcon(originalRank >= 0 ? originalRank : index)}</td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                  <span>{entry.studentName || "Student"}</span>
                                  {isMe && (
                                    <span
                                      className="status-pill active"
                                      style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem" }}
                                    >
                                      You
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <strong>{entry.score}</strong> / {entry.totalQuestions}
                              </td>
                              <td>
                                <span
                                  style={{
                                    fontWeight: 700,
                                    color: percent(entry) >= 70 ? "var(--success)" : "var(--text)",
                                  }}
                                >
                                  {percent(entry)}%
                                </span>
                              </td>
                              <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                {entry.submittedAt
                                  ? new Date(entry.submittedAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Leaderboard;
