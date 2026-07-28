import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Navigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Loading from "../components/Loading";
import api from "../services/api";
import { getStudentProfile, getActiveSession, getStudent } from "../services/storage";

function Leaderboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const student = getStudent();

  if (!student) {
    return <Navigate to="/student-login" replace />;
  }

  const currentRegisterNumber = student?.student?.registerNumber || "";
  const currentStudentName = student?.student?.fullName || "";

  const profile = getStudentProfile();
  const session =
    location.state?.session ||
    profile?.session ||
    getActiveSession();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      setError("Session not found.");
      return;
    }
    fetchLeaderboard();
  }, [session?.sessionCode]);

  async function fetchLeaderboard() {

    try {

        setLoading(true);

        const res = await api.get(
            `/results/leaderboard/${session.sessionCode}`
        );
console.log(
    `/results/leaderboard/${session.sessionCode}`
);
        console.log("Leaderboard Response");

        console.log(res);

        console.log("Response Data");

        console.log(res.data);

        console.log("Is Array");

        console.log(Array.isArray(res.data));

        setEntries(Array.isArray(res.data) ? res.data : []);

    }

    catch (e) {

        console.log(e);

    }

    finally {

        setLoading(false);

    }

}

  const medal = (i) => {
    if (i === 0) return "🥇";
    if (i === 1) return "🥈";
    if (i === 2) return "🥉";
    return `#${i + 1}`;
  };

  const percent = (e) =>
    e.totalQuestions
      ? Math.round((e.score * 100) / e.totalQuestions)
      : 0;

  const topScore =
    entries.length > 0
      ? `${entries[0].score}/${entries[0].totalQuestions}`
      : "-";

  return (
    <div className="app-page">
      <Sidebar />

      <div className="content-with-sidebar">
        <Header
          title="🏆 Leaderboard"
          subtitle={
            session
              ? `Top Student Rankings • ${session.sessionCode}`
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
              Back to Dashboard
            </button>
          }
        />

        <main className="page-shell">

          {loading && <Loading label="Loading leaderboard..." />}

          {!loading && error && (
            <div className="error-state">
              <strong>Leaderboard unavailable</strong>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div className="leaderboard-card">
                  <h3>{entries.length}</h3>
                  <p>Total Participants</p>
                </div>

                <div className="leaderboard-card">
                  <h3>{topScore}</h3>
                  <p>Highest Score</p>
                </div>
              </div>

              {entries.length === 0 ? (
                <div className="empty-state">
                  <strong>No scores yet.</strong>
                  <p>Students will appear after quiz submission.</p>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit,minmax(240px,1fr))",
                      gap: "1rem",
                      marginBottom: "1.5rem",
                    }}
                  >
                    {(Array.isArray(entries) ? entries : []).slice(0, 3).map((entry, index) => (
                      <div
                        key={entry._id}
                        className="leaderboard-card"
                        style={{ textAlign: "center" }}
                      >
                        <h1>{medal(index)}</h1>
                        <h3>{entry.studentName || "Student"}</h3>
                        <p>
                          {entry.score}/{entry.totalQuestions}
                        </p>
                        <strong>{percent(entry)}%</strong>
                      </div>
                    ))}
                  </div>

                  <div className="table-wrap">
                    <table className="responsive-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Student</th>
                          <th>Score</th>
                          <th>Percentage</th>
                          <th>Submitted</th>
                        </tr>
                      </thead>

                      <tbody>
                        {(Array.isArray(entries) ? entries : []).map((entry, index) => (
                          <tr
                            key={entry._id}
                            style={{
                              background: isCurrentStudent(entry)
                                ? "#d1fae5"
                                : "transparent",
                              fontWeight: isCurrentStudent(entry)
                                ? "bold"
                                : "normal",
                            }}
                          >
                            <td>{medal(index)}</td>
                            <td>{entry.studentName || "Student"}</td>
                            <td>
                              {entry.score}/{entry.totalQuestions}
                            </td>
                            <td>{percent(entry)}%</td>
                            <td>
                              {entry.submittedAt
                                ? new Date(
                                    entry.submittedAt
                                  ).toLocaleString()
                                : "-"}
                            </td>
                          </tr>
                        ))}
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
