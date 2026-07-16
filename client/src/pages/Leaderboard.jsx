import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Loading from "../components/Loading";
import api from "../services/api";
import { getStudentProfile, getActiveSession } from "../services/storage";

function Leaderboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const storedProfile = getStudentProfile();
  const session = location.state?.session || storedProfile?.session || getActiveSession();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.sessionCode) {
      loadLeaderboard();
    } else {
      setLoading(false);
      setError("Session not found.");
    }
  }, [session?.sessionCode]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/results/leaderboard/${session.sessionCode}`);
      setEntries(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load leaderboard.");
    } finally {
      setLoading(false);
    }
  };

  const topThree = entries.slice(0, 3);

  return (
    <div className="app-page">

      <Sidebar />

      <div className="content-with-sidebar">

        <Header
          title="Leaderboard"
          subtitle={session ? `Session ${session.sessionCode}` : "Class rankings"}
          actions={
            <button className="secondary" onClick={() => navigate("/student-dashboard", { state: { studentName: storedProfile?.studentName, session } })}>
              Back to Dashboard
            </button>
          }
        />

        <main className="page-shell page-grid">

          {loading ? <Loading label="Loading leaderboard" /> : null}

          {error ? (
            <div className="error-state">
              <strong>Leaderboard unavailable</strong>
              <p>{error}</p>
            </div>
          ) : null}

          {!loading && !error && entries.length === 0 ? (
            <div className="empty-state">
              <strong>No scores yet.</strong>
              <p>Students will appear here after quiz submissions are saved.</p>
            </div>
          ) : null}

          {!loading && !error && entries.length > 0 ? (
            <>
              <div className="dashboard-grid">
                {topThree.map((entry, index) => (
                  <div className="leaderboard-card" key={entry._id} style={{ padding: "1.1rem" }}>
                    <span className={`status-pill ${index === 0 ? "active" : index === 1 ? "pending" : "closed"}`}>
                      #{index + 1}
                    </span>
                    <h3 style={{ marginBottom: 0 }}>{entry.studentName}</h3>
                    <p style={{ margin: "0.35rem 0 0", color: "var(--muted)" }}>
                      {entry.score} / {entry.totalQuestions}
                    </p>
                  </div>
                ))}
              </div>

              <div className="table-wrap">
                <table className="responsive-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Student Name</th>
                      <th>Score</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, index) => (
                      <tr key={entry._id}>
                        <td>#{index + 1}</td>
                        <td>{entry.studentName}</td>
                        <td>{entry.score} / {entry.totalQuestions}</td>
                        <td>{entry.submittedAt ? new Date(entry.submittedAt).toLocaleString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

        </main>

      </div>

    </div>
  );
}

export default Leaderboard;